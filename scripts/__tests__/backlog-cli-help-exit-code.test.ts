import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const resolveScriptPath = (relativePath: string): string =>
  fileURLToPath(new URL(relativePath, import.meta.url));

const runTsxScript = (scriptPath: string, args: ReadonlyArray<string>) =>
  spawnSync('node', ['--import', 'tsx', scriptPath, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

const createBacklogFile = (contents: string): string => {
  const dir = mkdtempSync(join(tmpdir(), 'pumuki-backlog-cli-'));
  const filePath = join(dir, 'backlog.md');
  writeFileSync(filePath, contents, 'utf8');
  return filePath;
};

test('watch-consumer-backlog --help devuelve exit code 0', () => {
  const scriptPath = resolveScriptPath('../watch-consumer-backlog.ts');
  const result = runTsxScript(scriptPath, ['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /--id-issue-map-from/);
});

test('reconcile-consumer-backlog-issues --help devuelve exit code 0', () => {
  const scriptPath = resolveScriptPath('../reconcile-consumer-backlog-issues.ts');
  const result = runTsxScript(scriptPath, ['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /--resolve-missing-via-gh/);
});

test('watch-consumer-backlog unknown arg devuelve exit code 1', () => {
  const scriptPath = resolveScriptPath('../watch-consumer-backlog.ts');
  const result = runTsxScript(scriptPath, ['--unknown']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown argument/);
});

test('reconcile-consumer-backlog-issues unknown arg devuelve exit code 1', () => {
  const scriptPath = resolveScriptPath('../reconcile-consumer-backlog-issues.ts');
  const result = runTsxScript(scriptPath, ['--unknown']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown argument/);
});

test('watch-consumer-backlog --json incluye tool y schema_version', () => {
  const scriptPath = resolveScriptPath('../watch-consumer-backlog.ts');
  const backlogFile = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUMUKI-001 | ✅ | #100 |\n`
  );
  const result = runTsxScript(scriptPath, ['--file=' + backlogFile, '--json', '--no-fail']);
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout) as {
    tool?: string;
    schema_version?: string;
    generated_at?: string;
    run_id?: string;
    invocation?: {
      mode?: string;
      repo?: string | null;
      resolve_missing_via_gh?: boolean;
      id_issue_map?: string;
      id_issue_map_from?: string;
    };
    compat?: {
      contract_id?: string;
      min_reader_version?: string;
      is_backward_compatible?: boolean;
      breaking_changes?: unknown[];
    };
  };
  assert.equal(payload.tool, 'backlog-watch');
  assert.equal(payload.schema_version, '1.0.0');
  assert.match(payload.generated_at ?? '', /^\d{4}-\d{2}-\d{2}T/);
  assert.match(payload.run_id ?? '', /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.equal(payload.invocation?.mode, 'json');
  assert.equal(payload.invocation?.repo, null);
  assert.equal(payload.invocation?.resolve_missing_via_gh, false);
  assert.equal(payload.invocation?.id_issue_map, 'none');
  assert.equal(payload.invocation?.id_issue_map_from, 'none');
  assert.equal(payload.compat?.contract_id, 'backlog-tooling-json-v1');
  assert.equal(payload.compat?.min_reader_version, '1.0.0');
  assert.equal(payload.compat?.is_backward_compatible, true);
  assert.deepEqual(payload.compat?.breaking_changes, []);
});

test('reconcile-consumer-backlog-issues --json incluye tool y schema_version', () => {
  const scriptPath = resolveScriptPath('../reconcile-consumer-backlog-issues.ts');
  const backlogFile = createBacklogFile(
    `| Orden | ID | Estado | Referencia upstream | Nota |\n|---|---|---|---|---|\n| 1 | PUMUKI-001 | ✅ | #100 | cerrado |\n`
  );
  const result = runTsxScript(scriptPath, ['--file=' + backlogFile, '--json']);
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout) as {
    tool?: string;
    schema_version?: string;
    generated_at?: string;
    run_id?: string;
    invocation?: {
      mode?: string;
      repo?: string | null;
      apply?: boolean;
      resolve_missing_via_gh?: boolean;
      id_issue_map?: string;
      id_issue_map_from?: string;
    };
    compat?: {
      contract_id?: string;
      min_reader_version?: string;
      is_backward_compatible?: boolean;
      breaking_changes?: unknown[];
    };
  };
  assert.equal(payload.tool, 'backlog-reconcile');
  assert.equal(payload.schema_version, '1.0.0');
  assert.match(payload.generated_at ?? '', /^\d{4}-\d{2}-\d{2}T/);
  assert.match(payload.run_id ?? '', /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.equal(payload.invocation?.mode, 'json');
  assert.equal(payload.invocation?.repo, null);
  assert.equal(payload.invocation?.apply, false);
  assert.equal(payload.invocation?.resolve_missing_via_gh, false);
  assert.equal(payload.invocation?.id_issue_map, 'none');
  assert.equal(payload.invocation?.id_issue_map_from, 'none');
  assert.equal(payload.compat?.contract_id, 'backlog-tooling-json-v1');
  assert.equal(payload.compat?.min_reader_version, '1.0.0');
  assert.equal(payload.compat?.is_backward_compatible, true);
  assert.deepEqual(payload.compat?.breaking_changes, []);
});

test('reconcile-consumer-backlog-issues --json expone heading sync metadata', () => {
  const scriptPath = resolveScriptPath('../reconcile-consumer-backlog-issues.ts');
  const backlogFile = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUMUKI-010 | ✅ | Pendiente |\n\n### ⏳ PUMUKI-010\nDetalle.\n`
  );
  const result = runTsxScript(scriptPath, ['--file=' + backlogFile, '--json', '--apply']);
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout) as {
    headingUpdated?: boolean;
    headingChanges?: Array<{ id?: string; from?: string; to?: string }>;
  };
  assert.equal(payload.headingUpdated, true);
  assert.equal(payload.headingChanges?.length, 1);
  assert.equal(payload.headingChanges?.[0]?.id, 'PUMUKI-010');
  assert.equal(payload.headingChanges?.[0]?.from, '⏳');
  assert.equal(payload.headingChanges?.[0]?.to, '✅');
});
