import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createConsumerMenuRuntime } from '../framework-menu-consumer-runtime-lib';
import { formatAdvancedMenuView } from '../framework-menu-advanced-view-lib';
import { createFrameworkMenuActions } from '../framework-menu-actions';
import { createFrameworkMenuPrompts } from '../framework-menu-prompts';

const buildAdvancedActions = () => {
  const fakeRl = {
    question: async () => '',
  };
  const prompts = createFrameworkMenuPrompts(
    fakeRl as unknown as Parameters<typeof createFrameworkMenuPrompts>[0]
  );
  return createFrameworkMenuActions({
    prompts,
    runStaged: async () => {},
    runRange: async () => {},
    runRepoAudit: async () => {},
    runRepoAndStagedAudit: async () => {},
    runStagedAndUnstagedAudit: async () => {},
    resolveDefaultRangeFrom: () => 'HEAD~1',
    printActiveSkillsBundles: () => {},
  });
};

test('consumer runtime printMenu agrupa opciones por shell mínima y diagnósticos legacy read-only', async () => {
  const previousUiV2 = process.env.PUMUKI_MENU_UI_V2;
  process.env.PUMUKI_MENU_UI_V2 = '1';
  try {
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

    runtime.printMenu();
    const rendered = output.join('\n');
    assert.match(rendered, /██████╗ ██╗   ██╗███╗   ███╗██╗   ██╗██╗  ██╗██╗/);
    assert.match(rendered, /Advanced Project Audit — AST Intelligence & Quality Gate/i);
    assert.match(rendered, /Classic audit flows/i);
    assert.match(rendered, /Engine · working tree \(no preflight\)/i);
    assert.match(rendered, /11\)\s+Engine audit · STAGED only/i);
    assert.match(rendered, /14\)\s+Engine audit · tracked repo files \(AUTO runtime rules · PRE_COMMIT\)/i);
    assert.match(rendered, /Classic export/i);
    assert.match(rendered, /Classic diagnostics/i);
    assert.match(rendered, /System/i);
    assert.match(rendered, /1\)\s+Full audit \(repo analysis\)/i);
    assert.match(rendered, /2\)\s+Strict REPO\+STAGING \(CI\/CD\)/i);
    assert.match(rendered, /3\)\s+Strict STAGING only \(dev\)/i);
    assert.match(rendered, /4\)\s+Standard CRITICAL\/HIGH/i);
    assert.match(rendered, /8\)\s+Export Markdown/i);
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
      runUnstagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runWorkingTreePreCommitGate: async () => {},
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

test('consumer runtime printMenu usa vista clásica agrupada por shell mínima cuando PUMUKI_MENU_UI_V2 no está activo', async () => {
  const previousUiV2 = process.env.PUMUKI_MENU_UI_V2;
  delete process.env.PUMUKI_MENU_UI_V2;
  try {
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
    runtime.printMenu();
    const rendered = output.join('\n');
    assert.match(rendered, /██████╗ ██╗   ██╗███╗   ███╗██╗   ██╗██╗  ██╗██╗/);
    assert.match(rendered, /Choose an option|Advanced Project Audit/);
    assert.match(rendered, /1\)\s+Full audit \(repo analysis\)\s+6\)\s+ESLint Admin\+Web/i);
    assert.match(rendered, /7\)\s+AST Intelligence/i);
    assert.match(rendered, /Additional engine flows/i);
    assert.match(rendered, /A\) Switch to advanced menu/);
  } finally {
    if (typeof previousUiV2 === 'string') {
      process.env.PUMUKI_MENU_UI_V2 = previousUiV2;
    }
  }
});

test('consumer runtime exposes blocked summary so advanced menu can stay aligned with consumer gate', async () => {
  const runtime = createConsumerMenuRuntime({
    runRepoGate: async () => {},
    runRepoAndStagedGate: async () => ({
      blocked: {
        stage: 'PRE_PUSH',
        totalViolations: 3,
        causeCode: 'GIT_ATOMICITY_TOO_MANY_SCOPES',
        causeMessage: 'Atomicity budget exceeded.',
        remediation: 'Split the change by scope.',
      },
    }),
    runStagedGate: async () => {},
    runUnstagedGate: async () => {},
    runWorkingTreeGate: async () => {},
    runWorkingTreePreCommitGate: async () => {},
    runPreflight: async () => {},
    write: () => {},
  });

  const strictRepoAndStaged = runtime.actions.find((action) => action.id === '2');
  assert.ok(strictRepoAndStaged);
  await strictRepoAndStaged.execute();

  const summary = runtime.readCurrentSummary();
  assert.ok(summary);
  assert.equal(summary.outcome, 'BLOCK');

  const rendered = formatAdvancedMenuView(buildAdvancedActions(), {
    evidenceSummary: summary,
  });

  assert.match(rendered, /\bBLOCK\b/);
});
