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
test('gate promotes fs.writeFileSync heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
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
  assert.equal(preCommitDecision.outcome, 'BLOCK');

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

test('gate promotes fs.rmSync heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsRmSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-rm-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_RM_SYNC_AST',
    message: 'AST heuristic detected fs.rmSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsRmSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsRmSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsRmSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.mkdirSync heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsMkdirSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-mkdir-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_MKDIR_SYNC_AST',
    message: 'AST heuristic detected fs.mkdirSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsMkdirSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsMkdirSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsMkdirSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.readdirSync heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsReaddirSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-readdir-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_READDIR_SYNC_AST',
    message: 'AST heuristic detected fs.readdirSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsReaddirSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsReaddirSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsReaddirSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.readFileSync heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsReadFileSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-read-file-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_READ_FILE_SYNC_AST',
    message: 'AST heuristic detected fs.readFileSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsReadFileSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsReadFileSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsReadFileSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.statSync heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsStatSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-stat-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_STAT_SYNC_AST',
    message: 'AST heuristic detected fs.statSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsStatSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsStatSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsStatSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.statfsSync heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsStatfsSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-statfs-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_STATFS_SYNC_AST',
    message: 'AST heuristic detected fs.statfsSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsStatfsSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsStatfsSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'), [
    fsStatfsSyncFact,
  ]);
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.realpathSync heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsRealpathSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-realpath-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_REALPATH_SYNC_AST',
    message: 'AST heuristic detected fs.realpathSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsRealpathSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsRealpathSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsRealpathSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.lstatSync heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsLstatSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-lstat-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_LSTAT_SYNC_AST',
    message: 'AST heuristic detected fs.lstatSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsLstatSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsLstatSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsLstatSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.existsSync heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsExistsSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-exists-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_EXISTS_SYNC_AST',
    message: 'AST heuristic detected fs.existsSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsExistsSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsExistsSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsExistsSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.accessSync heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsAccessSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-access-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_ACCESS_SYNC_AST',
    message: 'AST heuristic detected fs.accessSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsAccessSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsAccessSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'), [
    fsAccessSyncFact,
  ]);
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.utimesSync heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsUtimesSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-utimes-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_UTIMES_SYNC_AST',
    message: 'AST heuristic detected fs.utimesSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsUtimesSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsUtimesSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsUtimesSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.renameSync heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsRenameSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-rename-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_RENAME_SYNC_AST',
    message: 'AST heuristic detected fs.renameSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsRenameSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsRenameSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsRenameSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.copyFileSync heuristic to blocking in PRE_COMMIT, PRE_PUSH y CI', () => {
  const fsCopyFileSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-copy-file-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_COPY_FILE_SYNC_AST',
    message: 'AST heuristic detected fs.copyFileSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsCopyFileSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'BLOCK');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsCopyFileSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsCopyFileSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

