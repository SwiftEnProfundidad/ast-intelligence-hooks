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
  assert.equal(findSeverity('heuristics.ts.console-error.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.eval.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.function-constructor.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.set-timeout-string.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.set-interval-string.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.new-promise-async.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.with-statement.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.process-exit.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.delete-operator.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.inner-html.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.document-write.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.insert-adjacent-html.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.child-process-import.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.process-env-mutation.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-write-file-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-rm-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-mkdir-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-readdir-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-read-file-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-stat-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-realpath-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-lstat-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-exists-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-chmod-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-chown-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-fchown-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-fchmod-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-fstat-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-ftruncate-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-futimes-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-lutimes-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.child-process-exec-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.child-process-exec.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.child-process-spawn-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.child-process-spawn.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.child-process-fork.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.child-process-exec-file-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.child-process-exec-file.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-append-file-sync.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-write-file.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-append-file.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-rm.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-unlink.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-read-file.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-readdir.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-mkdir.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-stat.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-copy-file.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-rename.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-access.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-chmod.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-chown.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-utimes.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-lstat.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-realpath.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-symlink.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-link.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-readlink.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-open.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-opendir.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-cp.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-promises-mkdtemp.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-utimes-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-watch-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-watch-file-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-unwatch-file-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-read-file-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-exists-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-write-file-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-append-file-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-readdir-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-mkdir-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-rmdir-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-rm-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-rename-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-copy-file-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-stat-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-statfs-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-lstat-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-realpath-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-access-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-chmod-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-chown-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-lchown-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-lchmod-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-unlink-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-readlink-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-symlink-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-fsync-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-fdatasync-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-fchown-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-fchmod-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-fstat-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-ftruncate-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-truncate-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-futimes-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-lutimes-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-link-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-mkdtemp-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-opendir-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-open-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-cp-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-close-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-read-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-readv-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-writev-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.fs-write-callback.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ts.debugger.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ios.force-unwrap.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ios.force-try.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.ios.force-cast.ast', 'PRE_COMMIT'), 'WARN');
  assert.equal(findSeverity('heuristics.android.thread-sleep.ast', 'PRE_COMMIT'), 'WARN');
});

test('promotes selected heuristic severities to ERROR in PRE_PUSH and CI', () => {
  assert.equal(findSeverity('heuristics.ts.console-log.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.console-error.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.eval.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.function-constructor.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.set-timeout-string.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.set-interval-string.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.new-promise-async.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.with-statement.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.process-exit.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.delete-operator.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.inner-html.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.document-write.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.insert-adjacent-html.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-import.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.process-env-mutation.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-write-file-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-rm-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-mkdir-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-readdir-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-read-file-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-stat-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-realpath-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-lstat-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-exists-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-chmod-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-chown-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-fchown-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-fchmod-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-fstat-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-ftruncate-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-futimes-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-lutimes-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-exec-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-exec.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-spawn-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-spawn.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-fork.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-exec-file-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-exec-file.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-append-file-sync.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-write-file.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-append-file.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-rm.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-unlink.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-read-file.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-readdir.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-mkdir.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-stat.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-copy-file.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-rename.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-access.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-chmod.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-chown.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-utimes.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-lstat.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-realpath.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-symlink.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-link.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-readlink.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-open.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-opendir.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-cp.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-mkdtemp.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-utimes-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-watch-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-watch-file-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-unwatch-file-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-read-file-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-exists-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-write-file-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-append-file-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-readdir-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-mkdir-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-rmdir-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-rm-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-rename-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-copy-file-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-stat-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-statfs-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-lstat-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-realpath-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-access-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-chmod-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-chown-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-lchown-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-lchmod-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-unlink-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-readlink-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-symlink-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-fsync-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-fdatasync-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-fchown-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-fchmod-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-fstat-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-ftruncate-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-truncate-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-futimes-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-lutimes-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-link-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-mkdtemp-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-opendir-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-open-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-cp-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-close-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-read-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-readv-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-writev-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-write-callback.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.explicit-any.ast', 'CI'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.debugger.ast', 'PRE_PUSH'), 'ERROR');
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

test('gate promotes console.error heuristic to blocking in PRE_PUSH and CI only', () => {
  const consoleErrorFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.console-error.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_CONSOLE_ERROR_AST',
    message: 'AST heuristic detected console.error usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [consoleErrorFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [consoleErrorFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [consoleErrorFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes eval heuristic to blocking in PRE_PUSH and CI only', () => {
  const evalFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.eval.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_EVAL_AST',
    message: 'AST heuristic detected eval usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [evalFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [evalFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [evalFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes Function-constructor heuristic to blocking in PRE_PUSH and CI only', () => {
  const functionConstructorFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.function-constructor.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FUNCTION_CONSTRUCTOR_AST',
    message: 'AST heuristic detected Function constructor usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [functionConstructorFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [functionConstructorFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [functionConstructorFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes setTimeout-string heuristic to blocking in PRE_PUSH and CI only', () => {
  const timeoutStringFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.set-timeout-string.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_SET_TIMEOUT_STRING_AST',
    message: 'AST heuristic detected setTimeout with a string callback.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [timeoutStringFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [timeoutStringFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [timeoutStringFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes setInterval-string heuristic to blocking in PRE_PUSH and CI only', () => {
  const intervalStringFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.set-interval-string.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_SET_INTERVAL_STRING_AST',
    message: 'AST heuristic detected setInterval with a string callback.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [intervalStringFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [intervalStringFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [intervalStringFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes async Promise-executor heuristic to blocking in PRE_PUSH and CI only', () => {
  const asyncPromiseFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.new-promise-async.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_NEW_PROMISE_ASYNC_AST',
    message: 'AST heuristic detected async Promise executor usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [asyncPromiseFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [asyncPromiseFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [asyncPromiseFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes with-statement heuristic to blocking in PRE_PUSH and CI only', () => {
  const withStatementFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.with-statement.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_WITH_STATEMENT_AST',
    message: 'AST heuristic detected with-statement usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [withStatementFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [withStatementFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [withStatementFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes process.exit heuristic to blocking in PRE_PUSH and CI only', () => {
  const processExitFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.process-exit.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_PROCESS_EXIT_AST',
    message: 'AST heuristic detected process.exit usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [processExitFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [processExitFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [processExitFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes delete-operator heuristic to blocking in PRE_PUSH and CI only', () => {
  const deleteOperatorFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.delete-operator.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_DELETE_OPERATOR_AST',
    message: 'AST heuristic detected delete-operator usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [deleteOperatorFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [deleteOperatorFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [deleteOperatorFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes innerHTML heuristic to blocking in PRE_PUSH and CI only', () => {
  const innerHtmlFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.inner-html.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_INNER_HTML_AST',
    message: 'AST heuristic detected innerHTML assignment.',
    filePath: 'apps/frontend/src/main.tsx',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [innerHtmlFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [innerHtmlFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [innerHtmlFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes document.write heuristic to blocking in PRE_PUSH and CI only', () => {
  const documentWriteFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.document-write.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_DOCUMENT_WRITE_AST',
    message: 'AST heuristic detected document.write usage.',
    filePath: 'apps/frontend/src/main.tsx',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [documentWriteFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [documentWriteFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [documentWriteFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes insertAdjacentHTML heuristic to blocking in PRE_PUSH and CI only', () => {
  const insertAdjacentHtmlFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.insert-adjacent-html.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_INSERT_ADJACENT_HTML_AST',
    message: 'AST heuristic detected insertAdjacentHTML usage.',
    filePath: 'apps/frontend/src/main.tsx',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [insertAdjacentHtmlFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [insertAdjacentHtmlFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [insertAdjacentHtmlFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes child_process import heuristic to blocking in PRE_PUSH and CI only', () => {
  const childProcessImportFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.child-process-import.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_CHILD_PROCESS_IMPORT_AST',
    message: 'AST heuristic detected child_process import/require usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [childProcessImportFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [childProcessImportFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [childProcessImportFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes process.env mutation heuristic to blocking in PRE_PUSH and CI only', () => {
  const processEnvMutationFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.process-env-mutation.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_PROCESS_ENV_MUTATION_AST',
    message: 'AST heuristic detected process.env mutation.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [processEnvMutationFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [processEnvMutationFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [processEnvMutationFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.writeFileSync heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.rmSync heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.mkdirSync heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.readdirSync heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.readFileSync heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.statSync heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.realpathSync heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.lstatSync heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.existsSync heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.chmodSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsChmodSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-chmod-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_CHMOD_SYNC_AST',
    message: 'AST heuristic detected fs.chmodSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsChmodSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsChmodSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsChmodSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.chownSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsChownSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-chown-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_CHOWN_SYNC_AST',
    message: 'AST heuristic detected fs.chownSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsChownSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsChownSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsChownSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.fchownSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsFchownSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-fchown-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_FCHOWN_SYNC_AST',
    message: 'AST heuristic detected fs.fchownSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsFchownSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsFchownSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsFchownSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.fchmodSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsFchmodSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-fchmod-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_FCHMOD_SYNC_AST',
    message: 'AST heuristic detected fs.fchmodSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsFchmodSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsFchmodSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsFchmodSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.fstatSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsFstatSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-fstat-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_FSTAT_SYNC_AST',
    message: 'AST heuristic detected fs.fstatSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsFstatSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsFstatSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsFstatSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.ftruncateSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsFtruncateSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-ftruncate-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_FTRUNCATE_SYNC_AST',
    message: 'AST heuristic detected fs.ftruncateSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsFtruncateSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsFtruncateSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsFtruncateSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.futimesSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsFutimesSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-futimes-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_FUTIMES_SYNC_AST',
    message: 'AST heuristic detected fs.futimesSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsFutimesSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsFutimesSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsFutimesSyncFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes fs.lutimesSync heuristic to blocking in PRE_PUSH and CI only', () => {
  const fsLutimesSyncFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.fs-lutimes-sync.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_FS_LUTIMES_SYNC_AST',
    message: 'AST heuristic detected fs.lutimesSync usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [fsLutimesSyncFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [fsLutimesSyncFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [fsLutimesSyncFact]
  );
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

test('gate promotes fs.copyFile callback heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.stat callback heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.statfs callback heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.lstat callback heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.realpath callback heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.access callback heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.chmod callback heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.chown callback heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.lchown callback heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.lchmod callback heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.unlink callback heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.readlink callback heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.symlink callback heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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

test('gate promotes fs.link callback heuristic to blocking in PRE_PUSH and CI only', () => {
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
  assert.equal(preCommitDecision.outcome, 'PASS');

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
