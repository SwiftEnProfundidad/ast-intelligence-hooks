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

test('gate promotes fs.copyFile callback heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsCopyFileCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-copy-file-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_COPY_FILE_CALLBACK_AST',
    message: 'AST heuristic detected fs.copyFile callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsCopyFileCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsCopyFileCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsCopyFileCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.stat callback heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsStatCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-stat-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_STAT_CALLBACK_AST',
    message: 'AST heuristic detected fs.stat callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsStatCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsStatCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsStatCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.statfs callback heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsStatfsCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-statfs-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_STATFS_CALLBACK_AST',
    message: 'AST heuristic detected fs.statfs callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsStatfsCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsStatfsCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsStatfsCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.lstat callback heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsLstatCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-lstat-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_LSTAT_CALLBACK_AST',
    message: 'AST heuristic detected fs.lstat callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsLstatCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsLstatCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsLstatCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.realpath callback heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsRealpathCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-realpath-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_REALPATH_CALLBACK_AST',
    message: 'AST heuristic detected fs.realpath callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsRealpathCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsRealpathCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsRealpathCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.access callback heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsAccessCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-access-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_ACCESS_CALLBACK_AST',
    message: 'AST heuristic detected fs.access callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsAccessCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsAccessCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsAccessCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.chmod callback heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsChmodCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-chmod-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_CHMOD_CALLBACK_AST',
    message: 'AST heuristic detected fs.chmod callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsChmodCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsChmodCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsChmodCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.chown callback heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsChownCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-chown-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_CHOWN_CALLBACK_AST',
    message: 'AST heuristic detected fs.chown callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsChownCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsChownCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsChownCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.lchown callback heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsLchownCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-lchown-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_LCHOWN_CALLBACK_AST',
    message: 'AST heuristic detected fs.lchown callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsLchownCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsLchownCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsLchownCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.lchmod callback heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsLchmodCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-lchmod-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_LCHMOD_CALLBACK_AST',
    message: 'AST heuristic detected fs.lchmod callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsLchmodCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsLchmodCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsLchmodCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.unlink callback heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsUnlinkCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-unlink-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_UNLINK_CALLBACK_AST',
    message: 'AST heuristic detected fs.unlink callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsUnlinkCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsUnlinkCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsUnlinkCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.readlink callback heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsReadlinkCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-readlink-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_READLINK_CALLBACK_AST',
    message: 'AST heuristic detected fs.readlink callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsReadlinkCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsReadlinkCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsReadlinkCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.symlink callback heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsSymlinkCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-symlink-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_SYMLINK_CALLBACK_AST',
    message: 'AST heuristic detected fs.symlink callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsSymlinkCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsSymlinkCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsSymlinkCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.link callback heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsLinkCallbackFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-link-callback.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_LINK_CALLBACK_AST',
    message: 'AST heuristic detected fs.link callback usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsLinkCallbackFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsLinkCallbackFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsLinkCallbackFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

