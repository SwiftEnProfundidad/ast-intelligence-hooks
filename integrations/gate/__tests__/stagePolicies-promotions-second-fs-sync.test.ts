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

