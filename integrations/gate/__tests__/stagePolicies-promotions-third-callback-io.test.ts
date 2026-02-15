import test from 'node:test';
import {
  assert,
  astHeuristicsRuleSet,
  applyHeuristicSeverityForStage,
  evaluateGate,
  evaluateRules
} from './stagePoliciesFixtures';
test('gate promotes fs.utimes callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsUtimesCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-utimes-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_UTIMES_CALLBACK_AST',
    message: 'AST heuristic detected fs.utimes callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsUtimesCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsUtimesCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsUtimesCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.watch callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsWatchCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-watch-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_WATCH_CALLBACK_AST',
    message: 'AST heuristic detected fs.watch callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsWatchCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsWatchCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsWatchCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.watchFile callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsWatchFileCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-watch-file-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_WATCH_FILE_CALLBACK_AST',
    message: 'AST heuristic detected fs.watchFile callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsWatchFileCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsWatchFileCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsWatchFileCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.unwatchFile callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsUnwatchFileCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-unwatch-file-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_UNWATCH_FILE_CALLBACK_AST',
    message: 'AST heuristic detected fs.unwatchFile callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsUnwatchFileCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsUnwatchFileCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsUnwatchFileCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.readFile callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsReadFileCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-read-file-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_READ_FILE_CALLBACK_AST',
    message: 'AST heuristic detected fs.readFile callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsReadFileCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsReadFileCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsReadFileCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.exists callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsExistsCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-exists-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_EXISTS_CALLBACK_AST',
    message: 'AST heuristic detected fs.exists callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsExistsCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsExistsCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsExistsCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.writeFile callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsWriteFileCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-write-file-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_WRITE_FILE_CALLBACK_AST',
    message: 'AST heuristic detected fs.writeFile callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsWriteFileCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsWriteFileCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsWriteFileCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.appendFile callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsAppendFileCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-append-file-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_APPEND_FILE_CALLBACK_AST',
    message: 'AST heuristic detected fs.appendFile callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsAppendFileCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsAppendFileCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsAppendFileCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.readdir callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsReaddirCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-readdir-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_READDIR_CALLBACK_AST',
    message: 'AST heuristic detected fs.readdir callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsReaddirCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsReaddirCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsReaddirCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.mkdir callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsMkdirCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-mkdir-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_MKDIR_CALLBACK_AST',
    message: 'AST heuristic detected fs.mkdir callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsMkdirCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsMkdirCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsMkdirCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.rmdir callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsRmdirCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-rmdir-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_RMDIR_CALLBACK_AST',
    message: 'AST heuristic detected fs.rmdir callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsRmdirCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsRmdirCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsRmdirCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.rm callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsRmCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-rm-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_RM_CALLBACK_AST',
    message: 'AST heuristic detected fs.rm callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsRmCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsRmCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsRmCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.rename callback heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsRenameCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-rename-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_RENAME_CALLBACK_AST',
    message: 'AST heuristic detected fs.rename callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsRenameCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsRenameCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsRenameCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

