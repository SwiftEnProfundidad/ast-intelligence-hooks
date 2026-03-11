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
  const dir = mkdtempSync(join(tmpdir(), 'pumuki-backlog-fleet-tick-'));
  const filePath = join(dir, 'backlog.md');
  writeFileSync(filePath, contents, 'utf8');
  return filePath;
};

test('watch-consumer-backlog-fleet-tick --help devuelve exit code 0', () => {
  const scriptPath = resolveScriptPath('../watch-consumer-backlog-fleet-tick.ts');
  const result = runTsxScript(scriptPath, ['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /--saas=<path>/);
});

test('watch-consumer-backlog-fleet-tick --json reporta resumen limpio cuando todos los targets estan cerrados', () => {
  const scriptPath = resolveScriptPath('../watch-consumer-backlog-fleet-tick.ts');
  const saas = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUMUKI-001 | ✅ | #100 |\n`
  );
  const ruralgo = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUMUKI-INC-001 | ✅ | #481 |\n`
  );
  const flux = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUM-001 | ✅ | #700 |\n`
  );

  const result = runTsxScript(scriptPath, [
    `--saas=${saas}`,
    `--ruralgo=${ruralgo}`,
    `--flux=${flux}`,
    '--json',
    '--no-fail',
  ]);

  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout) as {
    tool?: string;
    summary?: {
      targets?: number;
      has_action_required?: boolean;
      non_closed_total?: number;
      entries_scanned_total?: number;
      action_required_targets?: number;
    };
    results?: Array<{ key?: string; nonClosedEntries?: number; hasActionRequired?: boolean }>;
  };

  assert.equal(payload.tool, 'backlog-watch-fleet-tick');
  assert.equal(payload.summary?.targets, 3);
  assert.equal(payload.summary?.entries_scanned_total, 3);
  assert.equal(payload.summary?.non_closed_total, 0);
  assert.equal(payload.summary?.action_required_targets, 0);
  assert.equal(payload.summary?.has_action_required, false);
  assert.equal(payload.results?.length, 3);
  assert.deepEqual(
    payload.results?.map((entry) => entry.key),
    ['saas', 'ruralgo', 'flux']
  );
});

test('watch-consumer-backlog-fleet-tick devuelve exit code 1 cuando hay findings y no se pasa --no-fail', () => {
  const scriptPath = resolveScriptPath('../watch-consumer-backlog-fleet-tick.ts');
  const saas = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUMUKI-001 | ✅ | #100 |\n`
  );
  const ruralgo = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUMUKI-INC-001 | ✅ | #481 |\n`
  );
  const flux = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUM-010 | ⏳ | Pendiente |\n`
  );

  const result = runTsxScript(scriptPath, [`--saas=${saas}`, `--ruralgo=${ruralgo}`, `--flux=${flux}`]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[pumuki\]\[backlog-watch-fleet-tick\] key=flux/);
  assert.match(result.stdout, /action_required=yes/);
});

test('watch-consumer-backlog-fleet-tick mantiene visible el pendiente real de SAAS en formato operativo', () => {
  const scriptPath = resolveScriptPath('../watch-consumer-backlog-fleet-tick.ts');
  const saas = createBacklogFile(
    `# Registro de Bugs y Mejoras de Pumuki\n\n## Seguimiento operativo (Bugs)\n| Orden | ID | Severidad | Prioridad | Estado | Referencia upstream | Versión objetivo | Nota |\n|---|---|---|---|---|---|---|---|\n| 18 | PUMUKI-018 | HIGH | P1 | ⏳ | Pendiente | TBC | Falso positivo \`ios.no-force-unwrap\` al detectar patrón seguro \`!= nil\`. |\n`
  );
  const ruralgo = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUMUKI-INC-001 | ✅ | #481 |\n`
  );
  const flux = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUM-001 | ✅ | #700 |\n`
  );

  const result = runTsxScript(scriptPath, [
    `--saas=${saas}`,
    `--ruralgo=${ruralgo}`,
    `--flux=${flux}`,
    '--json',
    '--no-fail',
  ]);

  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout) as {
    summary?: {
      non_closed_total?: number;
      action_required_targets?: number;
      has_action_required?: boolean;
    };
    results?: Array<{
      key?: string;
      nonClosedEntries?: number;
      hasActionRequired?: boolean;
      classification?: { needsIssue?: Array<{ id?: string; issueNumber?: number | null }> };
    }>;
  };

  assert.equal(payload.summary?.non_closed_total, 1);
  assert.equal(payload.summary?.action_required_targets, 1);
  assert.equal(payload.summary?.has_action_required, true);

  const saasResult = payload.results?.find((entry) => entry.key === 'saas');
  assert.equal(saasResult?.nonClosedEntries, 1);
  assert.equal(saasResult?.hasActionRequired, true);
  assert.equal(saasResult?.classification?.needsIssue?.length, 1);
  assert.equal(saasResult?.classification?.needsIssue?.[0]?.id, 'PUMUKI-018');
  assert.equal(saasResult?.classification?.needsIssue?.[0]?.issueNumber, null);
});
