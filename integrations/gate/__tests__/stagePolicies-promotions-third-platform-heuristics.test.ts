import test from 'node:test';
import {
  assert,
  astHeuristicsRuleSet,
  applyHeuristicSeverityForStage,
  evaluateGate,
  evaluateRules,
  policyForCI,
  policyForPreCommit,
  policyForPrePush
} from './stagePoliciesFixtures';

test('gate promotes fs.fstat callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsFstatCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-fstat-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_FSTAT_CALLBACK_AST',
    message: 'AST heuristic detected fs.fstat callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsFstatCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsFstatCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsFstatCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.ftruncate callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsFtruncateCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-ftruncate-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_FTRUNCATE_CALLBACK_AST',
    message: 'AST heuristic detected fs.ftruncate callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsFtruncateCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsFtruncateCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsFtruncateCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.truncate callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsTruncateCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-truncate-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_TRUNCATE_CALLBACK_AST',
    message: 'AST heuristic detected fs.truncate callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsTruncateCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsTruncateCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsTruncateCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.futimes callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsFutimesCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-futimes-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_FUTIMES_CALLBACK_AST',
    message: 'AST heuristic detected fs.futimes callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsFutimesCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsFutimesCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsFutimesCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.lutimes callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsLutimesCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-lutimes-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_LUTIMES_CALLBACK_AST',
    message: 'AST heuristic detected fs.lutimes callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsLutimesCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsLutimesCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsLutimesCallbackFact]
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

test('gate promotes SOLID DIP concrete-instantiation heuristic to blocking in PRE_PUSH and CI only', () => {
  const solidDipFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.solid.dip.concrete-instantiation.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_SOLID_DIP_CONCRETE_INSTANTIATION_AST',
    message: 'AST heuristic detected DIP risk: direct instantiation of concrete framework dependency.',
    filePath: 'apps/backend/src/application/use-cases/CreateUserUseCase.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [solidDipFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [solidDipFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [solidDipFact]
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
