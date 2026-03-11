import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const resolveScriptPath = (relativePath: string): string =>
  fileURLToPath(new URL(relativePath, import.meta.url));

const runTsxScript = (scriptPath: string, args: ReadonlyArray<string>) =>
  spawnSync('node', ['--import', 'tsx', scriptPath, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

const createBacklogFile = (contents: string): string => {
  const dir = mkdtempSync(join(tmpdir(), 'pumuki-backlog-fleet-'));
  const filePath = join(dir, 'backlog.md');
  writeFileSync(filePath, contents, 'utf8');
  return filePath;
};

test('watch-consumer-backlog-fleet --help devuelve exit code 0', () => {
  const scriptPath = resolveScriptPath('../watch-consumer-backlog-fleet.ts');
  const result = runTsxScript(scriptPath, ['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /--target=<path>\[::repo\]/);
});

test('watch-consumer-backlog-fleet --json agrega resultados multi-target y conserva repo opcional', () => {
  const scriptPath = resolveScriptPath('../watch-consumer-backlog-fleet.ts');
  const closedBacklog = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUMUKI-001 | ✅ | #100 |\n`
  );
  const pendingBacklog = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUM-010 | ⏳ | Pendiente |\n`
  );

  const result = runTsxScript(scriptPath, [
    `--target=${closedBacklog}::SwiftEnProfundidad/ast-intelligence-hooks`,
    `--target=${pendingBacklog}`,
    '--json',
    '--no-fail',
  ]);

  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout) as {
    tool?: string;
    schema_version?: string;
    summary?: {
      targets?: number;
      entries_scanned_total?: number;
      non_closed_total?: number;
      action_required_targets?: number;
      has_action_required?: boolean;
    };
    results?: Array<{
      filePath?: string;
      repo?: string;
      entriesScanned?: number;
      nonClosedEntries?: number;
      hasActionRequired?: boolean;
      actionRequiredReasons?: string[];
      classification?: {
        needsIssue?: unknown[];
      };
    }>;
  };

  assert.equal(payload.tool, 'backlog-watch-fleet');
  assert.equal(payload.schema_version, '1.0.0');
  assert.equal(payload.summary?.targets, 2);
  assert.equal(payload.summary?.entries_scanned_total, 2);
  assert.equal(payload.summary?.non_closed_total, 1);
  assert.equal(payload.summary?.action_required_targets, 1);
  assert.equal(payload.summary?.has_action_required, true);
  assert.equal(payload.results?.length, 2);

  const closedResult = payload.results?.find((entry) => entry.filePath === closedBacklog);
  const pendingResult = payload.results?.find((entry) => entry.filePath === pendingBacklog);

  assert.equal(closedResult?.repo, 'SwiftEnProfundidad/ast-intelligence-hooks');
  assert.equal(closedResult?.hasActionRequired, false);
  assert.equal(pendingResult?.hasActionRequired, true);
  assert.equal(pendingResult?.classification?.needsIssue?.length, 1);
  assert.deepEqual(pendingResult?.actionRequiredReasons, ['needs_issue']);
});

test('watch-consumer-backlog-fleet falla con exit code 1 cuando hay findings y no se pasa --no-fail', () => {
  const scriptPath = resolveScriptPath('../watch-consumer-backlog-fleet.ts');
  const pendingBacklog = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUMUKI-INC-999 | ⏳ | Pendiente |\n`
  );
  const result = runTsxScript(scriptPath, [`--target=${pendingBacklog}`]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[pumuki\]\[backlog-watch-fleet\] target=/);
  assert.match(result.stdout, /action_required=yes/);
});
