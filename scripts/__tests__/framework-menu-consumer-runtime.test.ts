import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createConsumerMenuRuntime } from '../framework-menu-consumer-runtime-lib';

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
