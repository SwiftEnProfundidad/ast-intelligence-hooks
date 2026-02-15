import test from 'node:test';
import {
  assert,
  astHeuristicsRuleSet,
  applyHeuristicSeverityForStage,
  evaluateGate,
  evaluateRules
} from './stagePoliciesFixtures';
test('gate promotes fs.fsyncSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsFsyncSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-fsync-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_FSYNC_SYNC_AST',
    message: 'AST heuristic detected fs.fsyncSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsFsyncSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsFsyncSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsFsyncSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.fdatasyncSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsFdatasyncSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-fdatasync-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_FDATASYNC_SYNC_AST',
    message: 'AST heuristic detected fs.fdatasyncSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsFdatasyncSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsFdatasyncSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsFdatasyncSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.closeSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsCloseSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-close-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_CLOSE_SYNC_AST',
    message: 'AST heuristic detected fs.closeSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsCloseSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsCloseSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'), [
    fsCloseSyncFact,
  ]);
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.readSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsReadSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-read-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_READ_SYNC_AST',
    message: 'AST heuristic detected fs.readSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsReadSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsReadSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'), [
    fsReadSyncFact,
  ]);
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.readlinkSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsReadlinkSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-readlink-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_READLINK_SYNC_AST',
    message: 'AST heuristic detected fs.readlinkSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsReadlinkSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsReadlinkSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'), [
    fsReadlinkSyncFact,
  ]);
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.symlinkSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsSymlinkSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-symlink-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_SYMLINK_SYNC_AST',
    message: 'AST heuristic detected fs.symlinkSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsSymlinkSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsSymlinkSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'), [
    fsSymlinkSyncFact,
  ]);
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.linkSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsLinkSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-link-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_LINK_SYNC_AST',
    message: 'AST heuristic detected fs.linkSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsLinkSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsLinkSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'), [
    fsLinkSyncFact,
  ]);
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.cpSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsCpSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-cp-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_CP_SYNC_AST',
    message: 'AST heuristic detected fs.cpSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsCpSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsCpSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'), [
    fsCpSyncFact,
  ]);
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.openSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsOpenSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-open-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_OPEN_SYNC_AST',
    message: 'AST heuristic detected fs.openSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsOpenSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsOpenSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'), [
    fsOpenSyncFact,
  ]);
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.opendirSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsOpendirSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-opendir-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_OPENDIR_SYNC_AST',
    message: 'AST heuristic detected fs.opendirSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsOpendirSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsOpendirSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'), [
    fsOpendirSyncFact,
  ]);
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.mkdtempSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsMkdtempSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-mkdtemp-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_MKDTEMP_SYNC_AST',
    message: 'AST heuristic detected fs.mkdtempSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsMkdtempSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsMkdtempSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'), [
    fsMkdtempSyncFact,
  ]);
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

test('gate promotes execFile untrusted args heuristic to blocking in PRE_PUSH and CI only', () => {
  const execFileUntrustedArgsFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.child-process-exec-file-untrusted-args.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_CHILD_PROCESS_EXEC_FILE_UNTRUSTED_ARGS_AST',
    message: 'AST heuristic detected execFile/execFileSync with non-literal args array.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [execFileUntrustedArgsFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [execFileUntrustedArgsFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [execFileUntrustedArgsFact]
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

test('gate promotes fs.promises.rm heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesRmFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-rm.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_RM_AST',
    message: 'AST heuristic detected fs.promises.rm usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesRmFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesRmFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesRmFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.unlink heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesUnlinkFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-unlink.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_UNLINK_AST',
    message: 'AST heuristic detected fs.promises.unlink usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesUnlinkFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesUnlinkFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesUnlinkFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.readFile heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesReadFileFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-read-file.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_READ_FILE_AST',
    message: 'AST heuristic detected fs.promises.readFile usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesReadFileFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesReadFileFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesReadFileFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.readdir heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesReaddirFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-readdir.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_READDIR_AST',
    message: 'AST heuristic detected fs.promises.readdir usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesReaddirFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesReaddirFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesReaddirFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.promises.mkdir heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsPromisesMkdirFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-promises-mkdir.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_PROMISES_MKDIR_AST',
    message: 'AST heuristic detected fs.promises.mkdir usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsPromisesMkdirFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsPromisesMkdirFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsPromisesMkdirFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

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
