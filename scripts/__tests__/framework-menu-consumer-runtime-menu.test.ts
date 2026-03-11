import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createConsumerMenuRuntime } from '../framework-menu-consumer-runtime-lib';

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

test('consumer runtime printMenu muestra badge de estado PASS/WARN/BLOCK', { concurrency: false }, async () => {
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
