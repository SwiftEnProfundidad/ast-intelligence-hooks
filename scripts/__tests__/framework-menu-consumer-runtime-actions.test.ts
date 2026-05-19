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
    assert.match(rendered, /Evidence: status=ok stage=PRE_COMMIT outcome=BLOCK findings=2/);
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
      runUnstagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runWorkingTreePreCommitGate: async () => {},
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

test('consumer runtime opción 8 mantiene paridad con la evidence canónica tras ejecutar la opción 1', { concurrency: false }, async () => {
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

    assert.match(rendered, /Evidence: status=ok stage=PRE_COMMIT outcome=BLOCK findings=2/);
    assert.match(markdown, /- Stage: `PRE_COMMIT`/);
    assert.match(markdown, /- Outcome: `BLOCK`/);
    assert.match(markdown, /- Total violations: `2`/);
    assert.match(markdown, /- Files scanned: `12`/);
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime opción 2 resume la evidencia canónica tras PRE_PUSH', { concurrency: false }, async () => {
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
    assert.match(rendered, /Evidence: status=ok stage=PRE_COMMIT outcome=BLOCK findings=2/);
    assert.match(rendered, /Files scanned: 12/);
    assert.match(rendered, /Files affected: 2/);
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime opción 2 resume un bloqueo PRE_PUSH aunque no exista evidencia canónica', { concurrency: false }, async () => {
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
    assert.match(rendered, /Evidence: status=ok stage=PRE_PUSH outcome=BLOCK findings=1/);
    assert.match(rendered, /Primary block: GIT_ATOMICITY_TOO_MANY_SCOPES/);
    assert.match(rendered, /Files scanned: 0/);
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime opción 1 usa el bloqueo devuelto por el gate aunque no exista evidencia canónica', { concurrency: false }, async () => {
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-summary-blocked-opt1-'));
  process.chdir(temp);
  try {
    const output: string[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => ({
        blocked: {
          stage: 'PRE_COMMIT',
          totalViolations: 3,
          causeCode: 'SKILLS_BACKEND_NO_SOLID_VIOLATIONS',
          causeMessage: 'SOLID rule violated.',
          remediation: 'Split responsibilities and re-run the gate.',
          blockingCauses: [
            {
              code: 'NO_SOLID',
              ruleId: 'skills.backend.no-solid-violations',
              message: 'Backend SOLID violation.',
              file: 'apps/backend/src/service.ts',
              remediation: 'Split service responsibilities.',
            },
            {
              code: 'NO_CONSOLE',
              ruleId: 'skills.frontend.no-console-log',
              message: 'Frontend console violation.',
              file: 'apps/web/src/App.tsx',
              remediation: 'Remove console.log.',
            },
          ],
        },
      }),
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

    const action = runtime.actions.find((item) => item.id === '1');
    assert.ok(action, 'Expected consumer action id=1');
    await action.execute();

    const rendered = output.join('\n');
    assert.match(rendered, /Collecting source files/);
    assert.match(rendered, /Running pattern checks/);
    assert.match(rendered, /Running ESLint audits/);
    assert.match(rendered, /AST Intelligence/);
    assert.match(rendered, /Running AST analysis/);
    assert.match(rendered, /Evidence: status=ok stage=PRE_COMMIT outcome=BLOCK findings=3/);
    assert.match(rendered, /Gate blocked: SKILLS_BACKEND_NO_SOLID_VIOLATIONS/);
    assert.match(rendered, /Blocking causes: 2/);
    assert.match(rendered, /skills\.backend\.no-solid-violations @ apps\/backend\/src\/service\.ts/);
    assert.match(rendered, /Solution: Split service responsibilities/);
    assert.match(rendered, /skills\.frontend\.no-console-log @ apps\/web\/src\/App\.tsx/);
    assert.match(rendered, /Solution: Remove console\.log/);
    assert.match(rendered, /Primary block: skills\.backend\.no-solid-violations/);
    assert.match(rendered, /FINAL SUMMARY - VIOLATIONS BY SEVERITY/);
    assert.match(rendered, /Total violations: 3/);
    assert.match(rendered, /PLATFORM-SPECIFIC ANALYSIS/);
    assert.match(rendered, /Platform: Backend -> 1 violations/);
    assert.match(rendered, /Platform: Frontend -> 1 violations/);
    assert.match(rendered, /TOP VIOLATIONS & REMEDIATION/);
    assert.match(rendered, /skills\.backend\.no-solid-violations -> apps\/backend\/src\/service\.ts:1/);
    assert.match(rendered, /skills\.frontend\.no-console-log -> apps\/web\/src\/App\.tsx:1/);
    assert.equal(runtime.readCurrentSummary()?.totalFindings, 3);
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime avisa drift cuando el bloqueo del gate contradice la evidencia canónica', { concurrency: false }, async () => {
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-drift-'));
  process.chdir(temp);
  try {
    writeEvidenceWithLines(temp);
    const output: string[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => ({
        blocked: {
          stage: 'PRE_COMMIT',
          totalViolations: 3,
          causeCode: 'SKILLS_BACKEND_NO_SOLID_VIOLATIONS',
          causeMessage: 'SOLID rule violated.',
          remediation: 'Split responsibilities and re-run the gate.',
        },
      }),
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

    const action = runtime.actions.find((item) => item.id === '1');
    assert.ok(action, 'Expected consumer action id=1');
    await action.execute();

    const rendered = output.join('\n');
    assert.match(rendered, /Menu\/gate evidence drift detected/);
    assert.match(rendered, /Diagnostic code: MENU_GATE_EVIDENCE_DRIFT/);
    assert.match(rendered, /Diagnostic severity: HIGH/);
    assert.match(rendered, /totalFindings gate=3 evidence=2/);
    assert.match(rendered, /severity\.CRITICAL gate=0 evidence=1/);
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime opción 8 exporta el bloqueo en memoria cuando la opción 2 no generó evidencia', { concurrency: false }, async () => {
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
