import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createConsumerMenuRuntime } from '../framework-menu-consumer-runtime-lib';
import {
  readExportedMarkdown,
  writeEmptyEvidence,
  writeEvidenceWithLines,
} from './framework-menu-consumer-runtime-test-helpers';

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

    const markdown = readExportedMarkdown(temp);
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
