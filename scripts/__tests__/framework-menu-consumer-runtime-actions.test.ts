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
      runUnstagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runWorkingTreePreCommitGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });

    const action = runtime.actions.find((item) => item.id === '3');
    assert.ok(action, 'Expected consumer action id=3');
    await action.execute();

    assert.match(output.join('\n'), /Scope vacío.*staged/i);
    assert.match(output.join('\n'), /archivos soportados en staged/i);
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
      runUnstagedGate: async () => {},
      runWorkingTreeGate: async () => {
        writeEmptyEvidence(temp, 'PRE_PUSH');
      },
      runWorkingTreePreCommitGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });

    const action = runtime.actions.find((item) => item.id === '4');
    assert.ok(action, 'Expected consumer action id=4');
    await action.execute();

    assert.match(output.join('\n'), /Scope vacío.*working tree/i);
    assert.match(output.join('\n'), /archivos soportados en staged\/unstaged/i);
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime no vende scope vacío cuando working tree queda bloqueado', { concurrency: false }, async () => {
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-working-blocked-'));
  process.chdir(temp);
  try {
    const output: string[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => {},
      runStagedGate: async () => {},
      runUnstagedGate: async () => {},
      runWorkingTreeGate: async () => {
        writeEvidenceWithLines(temp);
      },
      runWorkingTreePreCommitGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });

    const action = runtime.actions.find((item) => item.id === '4');
    assert.ok(action, 'Expected consumer action id=4');
    await action.execute();

    const rendered = output.join('\n');
    assert.doesNotMatch(rendered, /Scope vacío.*working tree/i);
    assert.match(rendered, /Advanced Project Audit — AST Intelligence & Quality Gate/);
    assert.match(rendered, /Total Violations:\s+2/);
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime mantiene opciones legacy sin preflight visible', async () => {
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

  assert.deepEqual(stages, []);
});

test('consumer runtime opción 5 conserva comportamiento legacy read-only', async () => {
  let preflightCount = 0;
  let repoGateCount = 0;
  const output: string[] = [];
  const runtime = createConsumerMenuRuntime({
    runRepoGate: async () => {
      repoGateCount += 1;
    },
    runRepoAndStagedGate: async () => {},
    runStagedGate: async () => {},
    runWorkingTreeGate: async () => {},
    runPreflight: async () => {
      preflightCount += 1;
    },
    write: (text) => {
      output.push(text);
    },
  });

  await runtime.actions.find((item) => item.id === '5')?.execute();

  assert.equal(preflightCount, 0);
  assert.equal(repoGateCount, 0);
  assert.match(output.join('\n'), /PATTERN CHECKS/i);
});

test('consumer runtime opciones 11–13 no ejecutan preflight', async () => {
  const stages: string[] = [];
  const runtime = createConsumerMenuRuntime({
    runRepoGate: async () => {},
    runRepoAndStagedGate: async () => {},
    runStagedGate: async () => {},
    runUnstagedGate: async () => {},
    runWorkingTreeGate: async () => {},
    runWorkingTreePreCommitGate: async () => {},
    runPreflight: async (stage) => {
      stages.push(stage);
    },
    write: () => {},
  });

  await runtime.actions.find((item) => item.id === '11')?.execute();
  await runtime.actions.find((item) => item.id === '12')?.execute();
  await runtime.actions.find((item) => item.id === '13')?.execute();
  await runtime.actions.find((item) => item.id === '14')?.execute();

  assert.deepEqual(stages, []);
});

test('consumer runtime acción interna de file diagnostics muestra trazabilidad clicable file:line', { concurrency: false }, async () => {
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
      runUnstagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runWorkingTreePreCommitGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });

    const action = runtime.actions.find((item) => item.id === '10');
    assert.ok(action, 'Expected consumer action id=10');
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
      runUnstagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runWorkingTreePreCommitGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });

    const action = runtime.actions.find((item) => item.id === '8');
    assert.ok(action, 'Expected consumer action id=8');
    await action.execute();

    const markdown = readExportedMarkdown(temp);
    assert.match(output.join('\n'), /Legacy read-only markdown exported:/);
    assert.match(markdown, /# PUMUKI Legacy Read-Only Evidence Snapshot/);
    assert.match(markdown, /- Outcome: `BLOCK`/);
    assert.match(markdown, /- Total violations: `2`/);
    assert.match(markdown, /- Mode: `legacy read-only`/);
    assert.match(markdown, /## Clickable Findings/);
    assert.match(
      markdown,
      /\[apps\/backend\/src\/runtime\/process\.ts:27\]\(\.\/apps\/backend\/src\/runtime\/process\.ts#L27\)/
    );
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime opción 8 mantiene paridad con la evidence canónica tras ejecutar evidence update', { concurrency: false }, async () => {
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-export-parity-'));
  process.chdir(temp);
  try {
    const output: string[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {
        writeEvidenceWithLines(temp);
      },
      runRepoAndStagedGate: async () => {},
      runStagedGate: async () => {},
      runUnstagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runWorkingTreePreCommitGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });

    const auditAction = runtime.actions.find((item) => item.id === '1');
    const exportAction = runtime.actions.find((item) => item.id === '8');
    assert.ok(auditAction, 'Expected consumer action id=1');
    assert.ok(exportAction, 'Expected consumer action id=8');

    await auditAction.execute();
    await exportAction.execute();

    const rendered = output.join('\n');
    const markdown = readExportedMarkdown(temp);

    assert.match(rendered, /Advanced Project Audit — AST Intelligence & Quality Gate/);
    assert.match(rendered, /Total Violations:\s+2/);
    assert.match(markdown, /- Stage: `PRE_COMMIT`/);
    assert.match(markdown, /- Outcome: `BLOCK`/);
    assert.match(markdown, /- Total violations: `2`/);
    assert.match(markdown, /- Files scanned: `12`/);
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime acción enterprise REPO+STAGING resume la evidencia canónica tras PRE_PUSH', { concurrency: false }, async () => {
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-summary-opt2-'));
  process.chdir(temp);
  try {
    const output: string[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => {
        writeEvidenceWithLines(temp);
      },
      runStagedGate: async () => {},
      runUnstagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runWorkingTreePreCommitGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });

    const action = runtime.actions.find((item) => item.id === '2');
    assert.ok(action, 'Expected consumer action id=2');
    await action.execute();

    const rendered = output.join('\n');
    assert.match(rendered, /Advanced Project Audit — AST Intelligence & Quality Gate/);
    assert.match(rendered, /Files Scanned:\s+12/);
    assert.match(rendered, /Total Violations:\s+2/);
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime acción enterprise REPO+STAGING resume un bloqueo PRE_PUSH aunque no exista evidencia canónica', { concurrency: false }, async () => {
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-summary-blocked-'));
  process.chdir(temp);
  try {
    const output: string[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => ({
        blocked: {
          stage: 'PRE_PUSH',
          totalViolations: 1,
          causeCode: 'GIT_ATOMICITY_TOO_MANY_SCOPES',
          causeMessage: 'Too many scopes changed.',
          remediation: 'Split the change into smaller commits.',
        },
      }),
      runStagedGate: async () => {},
      runUnstagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runWorkingTreePreCommitGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });

    const action = runtime.actions.find((item) => item.id === '2');
    assert.ok(action, 'Expected consumer action id=2');
    await action.execute();

    const rendered = output.join('\n');
    assert.match(rendered, /Advanced Project Audit — AST Intelligence & Quality Gate/);
    assert.match(rendered, /Stage: PRE_PUSH/);
    assert.match(rendered, /GIT_ATOMICITY_TOO_MANY_SCOPES/);
    assert.match(rendered, /Files scanned: 0/);
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime opción 8 exporta el bloqueo en memoria cuando REPO+STAGING no generó evidencia', { concurrency: false }, async () => {
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-export-blocked-'));
  process.chdir(temp);
  try {
    const output: string[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => ({
        blocked: {
          stage: 'PRE_PUSH',
          totalViolations: 1,
          causeCode: 'GIT_ATOMICITY_TOO_MANY_SCOPES',
          causeMessage: 'Too many scopes changed.',
          remediation: 'Split the change into smaller commits.',
        },
      }),
      runStagedGate: async () => {},
      runUnstagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runWorkingTreePreCommitGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });

    const strictAction = runtime.actions.find((item) => item.id === '2');
    const exportAction = runtime.actions.find((item) => item.id === '8');
    assert.ok(strictAction, 'Expected consumer action id=2');
    assert.ok(exportAction, 'Expected consumer action id=8');

    await strictAction.execute();
    await exportAction.execute();

    const markdown = readExportedMarkdown(temp);
    assert.match(markdown, /# PUMUKI Legacy Read-Only Evidence Snapshot/);
    assert.match(markdown, /- Stage: `PRE_PUSH`/);
    assert.match(markdown, /- Outcome: `BLOCK`/);
    assert.match(markdown, /- Total violations: `1`/);
    assert.match(markdown, /GIT_ATOMICITY_TOO_MANY_SCOPES/);
  } finally {
    process.chdir(previous);
  }
});
