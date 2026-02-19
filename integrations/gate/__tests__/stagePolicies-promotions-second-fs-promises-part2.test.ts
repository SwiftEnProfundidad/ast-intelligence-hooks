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

test('gate promotes fs.promises.stat heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesStatFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-stat.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_STAT_AST',
    message: 'AST heuristic detected fs.promises.stat usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesStatFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesStatFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesStatFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.copyFile heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesCopyFileFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-copy-file.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_COPY_FILE_AST',
    message: 'AST heuristic detected fs.promises.copyFile usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesCopyFileFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesCopyFileFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesCopyFileFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.rename heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesRenameFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-rename.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_RENAME_AST',
    message: 'AST heuristic detected fs.promises.rename usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesRenameFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesRenameFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesRenameFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.access heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesAccessFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-access.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_ACCESS_AST',
    message: 'AST heuristic detected fs.promises.access usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesAccessFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesAccessFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesAccessFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.chmod heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesChmodFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-chmod.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_CHMOD_AST',
    message: 'AST heuristic detected fs.promises.chmod usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesChmodFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesChmodFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesChmodFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.chown heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesChownFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-chown.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_CHOWN_AST',
    message: 'AST heuristic detected fs.promises.chown usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesChownFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesChownFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesChownFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.utimes heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesUtimesFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-utimes.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_UTIMES_AST',
    message: 'AST heuristic detected fs.promises.utimes usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesUtimesFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesUtimesFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesUtimesFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.lstat heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesLstatFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-lstat.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_LSTAT_AST',
    message: 'AST heuristic detected fs.promises.lstat usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesLstatFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesLstatFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesLstatFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

