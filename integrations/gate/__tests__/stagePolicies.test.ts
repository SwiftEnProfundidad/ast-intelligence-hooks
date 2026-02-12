import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { evaluateGate } from '../../../core/gate/evaluateGate';
import { evaluateRules } from '../../../core/gate/evaluateRules';
import { astHeuristicsRuleSet } from '../../../core/rules/presets/astHeuristicsRuleSet';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import {
  applyHeuristicSeverityForStage,
  policyForCI,
  policyForPreCommit,
  policyForPrePush,
  resolvePolicyForStage,
} from '../stagePolicies';

const findSeverity = (ruleId: string, stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI') => {
  const rules = applyHeuristicSeverityForStage(astHeuristicsRuleSet, stage);
  const rule = rules.find((current) => current.id === ruleId);
  assert.ok(rule, `Expected rule ${ruleId} to exist`);
  return rule.severity;
};

test('returns expected gate policy thresholds per stage', () => {
  assert.deepEqual(policyForPreCommit(), {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'CRITICAL',
    warnOnOrAbove: 'ERROR',
  });
  assert.deepEqual(policyForPrePush(), {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  });
  assert.deepEqual(policyForCI(), {
    stage: 'CI',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  });
});

test('resolves stage policy defaults when skills policy file is missing', async () => {
  await withTempDir('pumuki-stage-policy-default-', async (tempRoot) => {
    const resolved = resolvePolicyForStage('PRE_COMMIT', tempRoot);
    assert.deepEqual(resolved.policy, policyForPreCommit());
    assert.equal(resolved.trace.source, 'default');
    assert.equal(resolved.trace.bundle, 'gate-policy.default.PRE_COMMIT');
    assert.match(resolved.trace.hash, /^[A-Fa-f0-9]{64}$/);
  });
});

test('resolves stage policy overrides from skills.policy.json', async () => {
  const skillsPolicy = {
    version: '1.0',
    defaultBundleEnabled: true,
    stages: {
      PRE_COMMIT: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
      PRE_PUSH: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
      CI: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
    },
    bundles: {},
  };

  await withTempDir('pumuki-stage-policy-skills-', async (tempRoot) => {
    writeFileSync(
      join(tempRoot, 'skills.policy.json'),
      JSON.stringify(skillsPolicy, null, 2),
      'utf8'
    );

    const resolved = resolvePolicyForStage('PRE_COMMIT', tempRoot);
    assert.deepEqual(resolved.policy, {
      stage: 'PRE_COMMIT',
      blockOnOrAbove: 'ERROR',
      warnOnOrAbove: 'WARN',
    });
    assert.equal(resolved.trace.source, 'skills.policy');
    assert.equal(resolved.trace.bundle, 'gate-policy.skills.policy.PRE_COMMIT');
    assert.match(resolved.trace.hash, /^[A-Fa-f0-9]{64}$/);
  });
});

test('keeps heuristic severities as WARN in PRE_COMMIT', () => {
  assert.equal(findSeverity('heuristics.ts.console-log.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.console-error.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.eval.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.function-constructor.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.set-timeout-string.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.set-interval-string.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.new-promise-async.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.with-statement.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.process-exit.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.delete-operator.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.inner-html.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.document-write.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.insert-adjacent-html.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.child-process-import.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.process-env-mutation.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-write-file-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.child-process-exec-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.child-process-exec.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.child-process-spawn-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.child-process-spawn.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.child-process-fork.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.child-process-exec-file-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.child-process-exec-file.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-append-file-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-write-file.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-append-file.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.debugger.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ios.force-unwrap.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ios.force-try.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ios.force-cast.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.android.thread-sleep.ast', 'PRE_COMMIT'), 'WARN');
});

test('promotes selected heuristic severities to ERROR in PRE_PUSH and CI', () => {
  assert.equal(findSeverity('heuristics.ts.console-log.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.console-error.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.eval.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.function-constructor.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.set-timeout-string.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.set-interval-string.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.new-promise-async.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.with-statement.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.process-exit.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.delete-operator.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.inner-html.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.document-write.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.insert-adjacent-html.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-import.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.process-env-mutation.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-write-file-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-exec-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-exec.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-spawn-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-spawn.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-fork.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-exec-file-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-exec-file.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-append-file-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-write-file.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-append-file.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.explicit-any.ast', 'CI'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.debugger.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ios.force-unwrap.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ios.anyview.ast', 'CI'), 'ERROR');
  assert.equal(findSeverity('heuristics.ios.force-try.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ios.force-cast.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ios.callback-style.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.android.globalscope.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.android.run-blocking.ast', 'CI'), 'ERROR');
});

test('keeps non-promoted heuristic severities unchanged', () => {
  assert.equal(findSeverity('heuristics.ts.empty-catch.ast', 'PRE_PUSH'), 'WARN');
  assert.equal(findSeverity('heuristics.ios.callback-style.ast', 'PRE_COMMIT'), 'WARN');
});

test('does not mutate the source heuristic ruleset', () => {
  const original = astHeuristicsRuleSet.find(
    (rule) => rule.id === 'heuristics.android.thread-sleep.ast'
  );
  assert.ok(original);

  const promoted = applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH').find(
    (rule) => rule.id === 'heuristics.android.thread-sleep.ast'
  );
  assert.ok(promoted);

  assert.equal(original.severity, 'WARN');
  assert.equal(promoted.severity, 'ERROR');
});

test('gate blocks promoted heuristic rules only in PRE_PUSH and CI', () => {
  const consoleLogFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.console-log.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_CONSOLE_LOG_AST',
    message: 'AST heuristic detected console.log usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [consoleLogFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [consoleLogFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [consoleLogFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes console.error heuristic to blocking in PRE_PUSH and CI only', () => {
  const consoleErrorFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.console-error.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_CONSOLE_ERROR_AST',
    message: 'AST heuristic detected console.error usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [consoleErrorFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [consoleErrorFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [consoleErrorFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes eval heuristic to blocking in PRE_PUSH and CI only', () => {
  const evalFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.eval.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_EVAL_AST',
    message: 'AST heuristic detected eval usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [evalFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [evalFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [evalFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes Function-constructor heuristic to blocking in PRE_PUSH and CI only', () => {
  const functionConstructorFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.function-constructor.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FUNCTION_CONSTRUCTOR_AST',
    message: 'AST heuristic detected Function constructor usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [functionConstructorFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [functionConstructorFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [functionConstructorFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes setTimeout-string heuristic to blocking in PRE_PUSH and CI only', () => {
  const timeoutStringFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.set-timeout-string.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_SET_TIMEOUT_STRING_AST',
    message: 'AST heuristic detected setTimeout with a string callback.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [timeoutStringFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [timeoutStringFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [timeoutStringFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes setInterval-string heuristic to blocking in PRE_PUSH and CI only', () => {
  const intervalStringFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.set-interval-string.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_SET_INTERVAL_STRING_AST',
    message: 'AST heuristic detected setInterval with a string callback.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [intervalStringFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [intervalStringFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [intervalStringFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes async Promise-executor heuristic to blocking in PRE_PUSH and CI only', () => {
  const asyncPromiseFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.new-promise-async.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_NEW_PROMISE_ASYNC_AST',
    message: 'AST heuristic detected async Promise executor usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [asyncPromiseFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [asyncPromiseFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [asyncPromiseFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes with-statement heuristic to blocking in PRE_PUSH and CI only', () => {
  const withStatementFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.with-statement.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_WITH_STATEMENT_AST',
    message: 'AST heuristic detected with-statement usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [withStatementFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [withStatementFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [withStatementFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes process.exit heuristic to blocking in PRE_PUSH and CI only', () => {
  const processExitFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.process-exit.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_PROCESS_EXIT_AST',
    message: 'AST heuristic detected process.exit usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [processExitFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [processExitFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [processExitFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes delete-operator heuristic to blocking in PRE_PUSH and CI only', () => {
  const deleteOperatorFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.delete-operator.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_DELETE_OPERATOR_AST',
    message: 'AST heuristic detected delete-operator usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [deleteOperatorFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [deleteOperatorFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [deleteOperatorFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes innerHTML heuristic to blocking in PRE_PUSH and CI only', () => {
  const innerHtmlFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.inner-html.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_INNER_HTML_AST',
    message: 'AST heuristic detected innerHTML assignment.',
    filePath: 'apps/frontend/src/main.tsx',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [innerHtmlFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [innerHtmlFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [innerHtmlFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes document.write heuristic to blocking in PRE_PUSH and CI only', () => {
  const documentWriteFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.document-write.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_DOCUMENT_WRITE_AST',
    message: 'AST heuristic detected document.write usage.',
    filePath: 'apps/frontend/src/main.tsx',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [documentWriteFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [documentWriteFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [documentWriteFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes insertAdjacentHTML heuristic to blocking in PRE_PUSH and CI only', () => {
  const insertAdjacentHtmlFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.insert-adjacent-html.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_INSERT_ADJACENT_HTML_AST',
    message: 'AST heuristic detected insertAdjacentHTML usage.',
    filePath: 'apps/frontend/src/main.tsx',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [insertAdjacentHtmlFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [insertAdjacentHtmlFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [insertAdjacentHtmlFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes child_process import heuristic to blocking in PRE_PUSH and CI only', () => {
  const childProcessImportFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.child-process-import.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_CHILD_PROCESS_IMPORT_AST',
    message: 'AST heuristic detected child_process import/require usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [childProcessImportFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [childProcessImportFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [childProcessImportFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes process.env mutation heuristic to blocking in PRE_PUSH and CI only', () => {
  const processEnvMutationFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.process-env-mutation.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_PROCESS_ENV_MUTATION_AST',
    message: 'AST heuristic detected process.env mutation.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [processEnvMutationFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [processEnvMutationFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [processEnvMutationFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.writeFileSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsWriteFileSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-write-file-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_WRITE_FILE_SYNC_AST',
    message: 'AST heuristic detected fs.writeFileSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsWriteFileSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsWriteFileSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsWriteFileSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes execSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const execSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.child-process-exec-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_CHILD_PROCESS_EXEC_SYNC_AST',
    message: 'AST heuristic detected execSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [execSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [execSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [execSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes exec heuristic to blocking in PRE_PUSH and CI only', () => {
  const execFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.child-process-exec.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_CHILD_PROCESS_EXEC_AST',
    message: 'AST heuristic detected exec usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [execFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [execFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [execFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes spawnSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const spawnSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.child-process-spawn-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_CHILD_PROCESS_SPAWN_SYNC_AST',
    message: 'AST heuristic detected spawnSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [spawnSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [spawnSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [spawnSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes spawn heuristic to blocking in PRE_PUSH and CI only', () => {
  const spawnFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.child-process-spawn.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_CHILD_PROCESS_SPAWN_AST',
    message: 'AST heuristic detected spawn usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [spawnFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [spawnFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [spawnFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fork heuristic to blocking in PRE_PUSH and CI only', () => {
  const forkFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.child-process-fork.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_CHILD_PROCESS_FORK_AST',
    message: 'AST heuristic detected fork usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [forkFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [forkFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [forkFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes execFileSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const execFileSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.child-process-exec-file-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_CHILD_PROCESS_EXEC_FILE_SYNC_AST',
    message: 'AST heuristic detected execFileSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [execFileSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [execFileSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [execFileSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes execFile heuristic to blocking in PRE_PUSH and CI only', () => {
  const execFileFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.child-process-exec-file.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_CHILD_PROCESS_EXEC_FILE_AST',
    message: 'AST heuristic detected execFile usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [execFileFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [execFileFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [execFileFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.appendFileSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsAppendFileSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-append-file-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_APPEND_FILE_SYNC_AST',
    message: 'AST heuristic detected fs.appendFileSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsAppendFileSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsAppendFileSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsAppendFileSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.writeFile heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesWriteFileFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-write-file.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_WRITE_FILE_AST',
    message: 'AST heuristic detected fs.promises.writeFile usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesWriteFileFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesWriteFileFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesWriteFileFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.appendFile heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesAppendFileFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-append-file.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_APPEND_FILE_AST',
    message: 'AST heuristic detected fs.promises.appendFile usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesAppendFileFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesAppendFileFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesAppendFileFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes debugger heuristic to blocking in PRE_PUSH and CI only', () => {
  const debuggerFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.debugger.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_DEBUGGER_AST',
    message: 'AST heuristic detected debugger statement usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [debuggerFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [debuggerFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [debuggerFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes ios AnyView heuristic to blocking in PRE_PUSH and CI only', () => {
  const anyViewFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ios.anyview.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_IOS_ANYVIEW_AST',
    message: 'AST heuristic detected AnyView usage.',
    filePath: 'apps/ios/Sources/ProfileView.swift',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [anyViewFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [anyViewFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [anyViewFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes explicit any heuristic to blocking in PRE_PUSH and CI only', () => {
  const explicitAnyFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.explicit-any.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_EXPLICIT_ANY_AST',
    message: 'AST heuristic detected explicit any usage.',
    filePath: 'apps/backend/src/runtime.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [explicitAnyFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [explicitAnyFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [explicitAnyFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes iOS callback-style heuristic to blocking in PRE_PUSH and CI only', () => {
  const callbackStyleFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ios.callback-style.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_IOS_CALLBACK_STYLE_AST',
    message: 'AST heuristic detected callback-style API signature outside bridge layers.',
    filePath: 'apps/ios/Sources/Networking/SessionClient.swift',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [callbackStyleFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [callbackStyleFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [callbackStyleFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes iOS force-try heuristic to blocking in PRE_PUSH and CI only', () => {
  const forceTryFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ios.force-try.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_IOS_FORCE_TRY_AST',
    message: 'AST heuristic detected force try usage.',
    filePath: 'apps/ios/Sources/Feature/UseCase.swift',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [forceTryFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [forceTryFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [forceTryFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes iOS force-cast heuristic to blocking in PRE_PUSH and CI only', () => {
  const forceCastFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ios.force-cast.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_IOS_FORCE_CAST_AST',
    message: 'AST heuristic detected force cast usage.',
    filePath: 'apps/ios/Sources/Feature/Mapper.swift',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [forceCastFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [forceCastFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [forceCastFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate keeps non-promoted heuristic rules as non-blocking warnings', () => {
  const emptyCatchFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.empty-catch.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_EMPTY_CATCH_AST',
    message: 'AST heuristic detected an empty catch block.',
    filePath: 'apps/frontend/src/lib/runtime.ts',
  };

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [emptyCatchFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'WARN');
  assert.equal(prePushDecision.blocking.length, 0);
  assert.equal(prePushDecision.warnings.length, 1);
});
