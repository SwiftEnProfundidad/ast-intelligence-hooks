import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createConsumerMenuRuntime } from '../framework-menu-consumer-runtime-lib';
import type { PumukiCriticalNotificationEvent } from '../framework-menu-system-notifications-lib';

const writeEmptyEvidence = (dir: string, stage: 'PRE_COMMIT' | 'PRE_PUSH'): void => {
  writeFileSync(
    join(dir, '.ai_evidence.json'),
    JSON.stringify(
      {
        snapshot: {
          stage,
          outcome: 'PASS',
          findings: [],
          files_scanned: 0,
          files_affected: 0,
        },
        severity_metrics: {
          snapshot: {
            by_severity: {
              CRITICAL: 0,
              ERROR: 0,
              WARN: 0,
              INFO: 0,
            },
          },
        },
      },
      null,
      2
    )
  );
};

const writeEvidenceWithLines = (dir: string): void => {
  writeFileSync(
    join(dir, '.ai_evidence.json'),
    JSON.stringify(
      {
        snapshot: {
          stage: 'PRE_COMMIT',
          outcome: 'BLOCK',
          files_scanned: 12,
          files_affected: 2,
          findings: [
            {
              ruleId: 'heuristics.ts.process-exit.ast',
              severity: 'CRITICAL',
              filePath: 'apps/backend/src/runtime/process.ts',
              lines: [27, 32],
            },
            {
              ruleId: 'heuristics.ts.document-write.ast',
              severity: 'ERROR',
              filePath: 'apps/web/src/ui/banner.tsx',
              lines: 14,
            },
          ],
        },
        severity_metrics: {
          by_severity: {
            CRITICAL: 1,
            ERROR: 1,
            WARN: 0,
            INFO: 0,
          },
        },
      },
      null,
      2
    )
  );
};

test('consumer runtime avisa cuando STAGING only no tiene archivos en scope', { concurrency: false }, async () => {
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-staged-'));
  process.chdir(temp);
  try {
    const output: string[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => {},
      runStagedGate: async () => {
        writeEmptyEvidence(temp, 'PRE_COMMIT');
      },
      runWorkingTreeGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });

    const action = runtime.actions.find((item) => item.id === '3');
    assert.ok(action, 'Expected consumer action id=3');
    await action.execute();

    assert.match(output.join('\n'), /Scope vacío.*staged/i);
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime avisa cuando working tree no tiene archivos en scope', { concurrency: false }, async () => {
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-working-'));
  process.chdir(temp);
  try {
    const output: string[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => {},
      runStagedGate: async () => {},
      runWorkingTreeGate: async () => {
        writeEmptyEvidence(temp, 'PRE_PUSH');
      },
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });

    const action = runtime.actions.find((item) => item.id === '4');
    assert.ok(action, 'Expected consumer action id=4');
    await action.execute();

    assert.match(output.join('\n'), /Scope vacío.*working tree/i);
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime ejecuta preflight con stage correcto por opción', async () => {
  const stages: string[] = [];
  const runtime = createConsumerMenuRuntime({
    runRepoGate: async () => {},
    runRepoAndStagedGate: async () => {},
    runStagedGate: async () => {},
    runWorkingTreeGate: async () => {},
    runPreflight: async (stage) => {
      stages.push(stage);
    },
    write: () => {},
  });

  await runtime.actions.find((item) => item.id === '1')?.execute();
  await runtime.actions.find((item) => item.id === '2')?.execute();
  await runtime.actions.find((item) => item.id === '3')?.execute();
  await runtime.actions.find((item) => item.id === '4')?.execute();

  assert.deepEqual(stages, ['PRE_COMMIT', 'PRE_PUSH', 'PRE_COMMIT', 'PRE_PUSH']);
});

test('consumer runtime emite notificación audit summary tras opción 1', { concurrency: false }, async () => {
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-notify-'));
  process.chdir(temp);
  try {
    const events: PumukiCriticalNotificationEvent[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {
        writeFileSync(
          join(temp, '.ai_evidence.json'),
          JSON.stringify(
            {
              snapshot: {
                stage: 'PRE_COMMIT',
                outcome: 'BLOCK',
                files_scanned: 8,
                files_affected: 3,
                findings: [
                  {
                    ruleId: 'backend.solid.srp.class-too-many-responsibilities',
                    severity: 'CRITICAL',
                    filePath: 'src/a.ts',
                  },
                  {
                    ruleId: 'backend.solid.ocp.closed-for-modification',
                    severity: 'ERROR',
                    filePath: 'src/b.ts',
                  },
                  {
                    ruleId: 'backend.clean.layers.boundary',
                    severity: 'WARN',
                    filePath: 'src/c.ts',
                  },
                ],
              },
              severity_metrics: {
                by_severity: {
                  CRITICAL: 1,
                  ERROR: 1,
                  WARN: 1,
                  INFO: 0,
                },
              },
            },
            null,
            2
          )
        );
      },
      runRepoAndStagedGate: async () => {},
      runStagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runPreflight: async () => {},
      emitSystemNotification: ({ event }) => {
        events.push(event);
        return { delivered: false, reason: 'disabled' };
      },
      write: () => {},
    });

    const action = runtime.actions.find((item) => item.id === '1');
    assert.ok(action, 'Expected consumer action id=1');
    await action.execute();

    assert.equal(events.length, 1);
    assert.equal(events[0]?.kind, 'audit.summary');
    if (events[0]?.kind !== 'audit.summary') {
      assert.fail('Expected audit.summary notification event');
    }
    assert.equal(events[0].totalViolations, 3);
    assert.equal(events[0].criticalViolations, 1);
    assert.equal(events[0].highViolations, 1);
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime printMenu agrupa opciones por flujos canónicos', async () => {
  const previousUiV2 = process.env.PUMUKI_MENU_UI_V2;
  process.env.PUMUKI_MENU_UI_V2 = '1';
  try {
    const output: string[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => {},
      runStagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });

    runtime.printMenu();
    const rendered = output.join('\n');
    assert.match(rendered, /Audit Flows/i);
    assert.match(rendered, /Diagnostics/i);
    assert.match(rendered, /Export/i);
    assert.match(rendered, /System/i);
    assert.match(rendered, /1\)\s+Full audit/i);
    assert.match(rendered, /10\)\s+Exit/i);
  } finally {
    if (typeof previousUiV2 === 'string') {
      process.env.PUMUKI_MENU_UI_V2 = previousUiV2;
    } else {
      delete process.env.PUMUKI_MENU_UI_V2;
    }
  }
});

test('consumer runtime printMenu muestra badge de estado PASS\/WARN\/BLOCK', { concurrency: false }, async () => {
  const previousUiV2 = process.env.PUMUKI_MENU_UI_V2;
  process.env.PUMUKI_MENU_UI_V2 = '1';
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-badge-'));
  process.chdir(temp);
  try {
    writeFileSync(
      join(temp, '.ai_evidence.json'),
      JSON.stringify(
        {
          snapshot: {
            stage: 'PRE_COMMIT',
            outcome: 'BLOCK',
            findings: [
              {
                ruleId: 'backend.avoid-explicit-any',
                severity: 'ERROR',
                filePath: 'apps/backend/src/service.ts',
              },
            ],
            files_scanned: 10,
            files_affected: 1,
          },
          severity_metrics: {
            by_severity: {
              CRITICAL: 0,
              ERROR: 1,
              WARN: 0,
              INFO: 0,
            },
          },
        },
        null,
        2
      )
    );

    const output: string[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => {},
      runStagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });

    runtime.printMenu();
    assert.match(output.join('\n'), /BLOCK/i);
  } finally {
    process.chdir(previous);
    if (typeof previousUiV2 === 'string') {
      process.env.PUMUKI_MENU_UI_V2 = previousUiV2;
    } else {
      delete process.env.PUMUKI_MENU_UI_V2;
    }
  }
});

test('consumer runtime printMenu usa vista clásica por defecto cuando PUMUKI_MENU_UI_V2 no está activo', async () => {
  const previousUiV2 = process.env.PUMUKI_MENU_UI_V2;
  delete process.env.PUMUKI_MENU_UI_V2;
  try {
    const output: string[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => {},
      runStagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });
    runtime.printMenu();
    const rendered = output.join('\n');
    assert.match(rendered, /A\. Switch to advanced menu/);
    assert.doesNotMatch(rendered, /Audit Flows/i);
  } finally {
    if (typeof previousUiV2 === 'string') {
      process.env.PUMUKI_MENU_UI_V2 = previousUiV2;
    }
  }
});

test('consumer runtime opción 9 muestra trazabilidad clicable file:line', { concurrency: false }, async () => {
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-file-diagnostics-'));
  process.chdir(temp);
  try {
    writeEvidenceWithLines(temp);
    const output: string[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => {},
      runStagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });

    const action = runtime.actions.find((item) => item.id === '9');
    assert.ok(action, 'Expected consumer action id=9');
    await action.execute();

    const rendered = output.join('\n');
    assert.match(rendered, /VIOLATIONS — CLICKABLE LOCATIONS/);
    assert.match(rendered, /apps\/backend\/src\/runtime\/process\.ts:27/);
    assert.match(rendered, /apps\/web\/src\/ui\/banner\.tsx:14/);
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime opción 8 exporta markdown con enlaces clicables', { concurrency: false }, async () => {
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-export-markdown-'));
  process.chdir(temp);
  try {
    writeEvidenceWithLines(temp);
    const output: string[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => {},
      runStagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });

    const action = runtime.actions.find((item) => item.id === '8');
    assert.ok(action, 'Expected consumer action id=8');
    await action.execute();

    const exportedPath = join(temp, '.audit-reports', 'pumuki-legacy-audit.md');
    const markdown = readFileSync(exportedPath, 'utf8');
    assert.match(output.join('\n'), /Markdown exported:/);
    assert.match(markdown, /## Clickable Findings/);
    assert.match(
      markdown,
      /\[apps\/backend\/src\/runtime\/process\.ts:27\]\(\.\/apps\/backend\/src\/runtime\/process\.ts#L27\)/
    );
  } finally {
    process.chdir(previous);
  }
});
