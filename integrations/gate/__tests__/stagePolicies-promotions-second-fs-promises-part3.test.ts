import test from 'node:test';
import {
  assert,
  astHeuristicsRuleSet,
  applyHeuristicSeverityForStage,
  evaluateGate,
  evaluateRules
} from './stagePoliciesFixtures';

test('gate promotes fs.promises.realpath heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesRealpathFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-realpath.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_REALPATH_AST',
    message: 'AST heuristic detected fs.promises.realpath usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesRealpathFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesRealpathFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesRealpathFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.symlink heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesSymlinkFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-symlink.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_SYMLINK_AST',
    message: 'AST heuristic detected fs.promises.symlink usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesSymlinkFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesSymlinkFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesSymlinkFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.link heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesLinkFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-link.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_LINK_AST',
    message: 'AST heuristic detected fs.promises.link usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesLinkFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesLinkFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesLinkFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.readlink heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesReadlinkFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-readlink.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_READLINK_AST',
    message: 'AST heuristic detected fs.promises.readlink usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesReadlinkFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesReadlinkFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesReadlinkFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.open heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesOpenFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-open.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_OPEN_AST',
    message: 'AST heuristic detected fs.promises.open usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesOpenFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesOpenFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesOpenFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.opendir heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesOpendirFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-opendir.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_OPENDIR_AST',
    message: 'AST heuristic detected fs.promises.opendir usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesOpendirFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesOpendirFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesOpendirFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.cp heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesCpFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-cp.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_CP_AST',
    message: 'AST heuristic detected fs.promises.cp usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesCpFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesCpFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesCpFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.mkdtemp heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesMkdtempFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-mkdtemp.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_MKDTEMP_AST',
    message: 'AST heuristic detected fs.promises.mkdtemp usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesMkdtempFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesMkdtempFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesMkdtempFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});
