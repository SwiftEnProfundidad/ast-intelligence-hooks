import test from 'node:test';
import {
  assert,
  astHeuristicsRuleSet,
  applyHeuristicSeverityForStage,
  evaluateGate,
  evaluateRules,
  policyForCI,
  policyForPreCommit,
  policyForPrePush,
} from './stagePoliciesFixtures';

test('gate promotes fs.mkdtemp callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsMkdtempCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-mkdtemp-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_MKDTEMP_CALLBACK_AST',
    message: 'AST heuristic detected fs.mkdtemp callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsMkdtempCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsMkdtempCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsMkdtempCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.opendir callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsOpendirCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-opendir-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_OPENDIR_CALLBACK_AST',
    message: 'AST heuristic detected fs.opendir callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsOpendirCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsOpendirCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsOpendirCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.open callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsOpenCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-open-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_OPEN_CALLBACK_AST',
    message: 'AST heuristic detected fs.open callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsOpenCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsOpenCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsOpenCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.cp callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsCpCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-cp-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_CP_CALLBACK_AST',
    message: 'AST heuristic detected fs.cp callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsCpCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsCpCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsCpCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.close callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsCloseCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-close-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_CLOSE_CALLBACK_AST',
    message: 'AST heuristic detected fs.close callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsCloseCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsCloseCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsCloseCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.read callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsReadCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-read-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_READ_CALLBACK_AST',
    message: 'AST heuristic detected fs.read callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsReadCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsReadCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsReadCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.readv callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsReadvCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-readv-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_READV_CALLBACK_AST',
    message: 'AST heuristic detected fs.readv callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsReadvCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsReadvCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsReadvCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.writev callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsWritevCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-writev-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_WRITEV_CALLBACK_AST',
    message: 'AST heuristic detected fs.writev callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsWritevCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsWritevCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsWritevCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.write callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsWriteCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-write-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_WRITE_CALLBACK_AST',
    message: 'AST heuristic detected fs.write callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsWriteCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsWriteCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsWriteCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.fsync callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsFsyncCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-fsync-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_FSYNC_CALLBACK_AST',
    message: 'AST heuristic detected fs.fsync callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsFsyncCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsFsyncCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsFsyncCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.fdatasync callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsFdatasyncCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-fdatasync-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_FDATASYNC_CALLBACK_AST',
    message: 'AST heuristic detected fs.fdatasync callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsFdatasyncCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsFdatasyncCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsFdatasyncCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.fchown callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsFchownCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-fchown-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_FCHOWN_CALLBACK_AST',
    message: 'AST heuristic detected fs.fchown callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsFchownCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsFchownCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsFchownCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.fchmod callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsFchmodCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-fchmod-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_FCHMOD_CALLBACK_AST',
    message: 'AST heuristic detected fs.fchmod callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsFchmodCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsFchmodCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsFchmodCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

