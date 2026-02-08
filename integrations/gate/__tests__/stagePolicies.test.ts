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
  assert.equal(findSeverity('heuristics.ios.force-unwrap.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ios.force-try.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ios.force-cast.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.android.thread-sleep.ast', 'PRE_COMMIT'), 'WARN');
});

test('promotes selected heuristic severities to ERROR in PRE_PUSH and CI', () => {
  assert.equal(findSeverity('heuristics.ts.console-log.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.explicit-any.ast', 'CI'), 'ERROR');
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
