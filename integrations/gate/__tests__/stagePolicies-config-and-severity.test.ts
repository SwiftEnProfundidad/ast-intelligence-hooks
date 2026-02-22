import test from 'node:test';
import {
  assert,
  astHeuristicsRuleSet,
  applyHeuristicSeverityForStage,
  evaluateGate,
  evaluateRules,
  findSeverity,
  join,
  policyForCI,
  policyForPreCommit,
  policyForPrePush,
  resolvePolicyForStage,
  withTempDir,
  writeFileSync
} from './stagePoliciesFixtures';
test('returns expected gate policy thresholds per stage', () => {
  assert.deepEqual(policyForPreCommit(), {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
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

test('promotes heuristic severities to ERROR in PRE_COMMIT', () => {
  assert.equal(findSeverity('heuristics.ts.console-log.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.console-error.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.eval.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.function-constructor.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.set-timeout-string.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.set-interval-string.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.new-promise-async.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.with-statement.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.process-exit.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.delete-operator.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.inner-html.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.document-write.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.insert-adjacent-html.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-import.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.process-env-mutation.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.hardcoded-secret-token.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.weak-crypto-hash.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.insecure-token-math-random.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.insecure-token-date-now.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.weak-token-randomuuid.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.jwt-decode-without-verify.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.jwt-verify-ignore-expiration.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.jwt-sign-no-expiration.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.tls-reject-unauthorized-false.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.dynamic-shell-invocation.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.tls-env-override.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-shell-true.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.vm-dynamic-code-execution.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.buffer-alloc-unsafe.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.buffer-alloc-unsafe-slow.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-write-file-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-rm-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-mkdir-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-readdir-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-read-file-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-stat-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-realpath-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-lstat-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-exists-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-chmod-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-chown-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-fchown-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-fchmod-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-fstat-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-ftruncate-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-futimes-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-lutimes-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-exec-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-exec.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-spawn-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-spawn.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-fork.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-exec-file-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(
    findSeverity('heuristics.ts.child-process-exec-file-untrusted-args.ast', 'PRE_COMMIT'),
    'ERROR'
  );
  assert.equal(findSeverity('heuristics.ts.child-process-exec-file.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-append-file-sync.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-write-file.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-append-file.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-rm.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-unlink.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-read-file.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-readdir.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-mkdir.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-stat.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-copy-file.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-rename.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-access.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-chmod.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-chown.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-utimes.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-lstat.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-realpath.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-symlink.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-link.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-readlink.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-open.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-opendir.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-cp.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-promises-mkdtemp.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-utimes-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-watch-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-watch-file-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-unwatch-file-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-read-file-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-exists-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-write-file-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-append-file-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-readdir-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-mkdir-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-rmdir-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-rm-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-rename-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-copy-file-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-stat-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-statfs-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-lstat-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-realpath-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-access-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-chmod-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-chown-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-lchown-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-lchmod-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-unlink-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-readlink-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-symlink-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-fsync-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-fdatasync-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-fchown-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-fchmod-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-fstat-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-ftruncate-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-truncate-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-futimes-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-lutimes-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-link-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-mkdtemp-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-opendir-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-open-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-cp-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-close-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-read-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-readv-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-writev-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.fs-write-callback.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.debugger.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(
    findSeverity('heuristics.ts.solid.srp.class-command-query-mix.ast', 'PRE_COMMIT'),
    'ERROR'
  );
  assert.equal(
    findSeverity('heuristics.ts.solid.isp.interface-command-query-mix.ast', 'PRE_COMMIT'),
    'ERROR'
  );
  assert.equal(
    findSeverity('heuristics.ts.solid.ocp.discriminator-switch.ast', 'PRE_COMMIT'),
    'ERROR'
  );
  assert.equal(
    findSeverity('heuristics.ts.solid.lsp.override-not-implemented.ast', 'PRE_COMMIT'),
    'ERROR'
  );
  assert.equal(
    findSeverity('heuristics.ts.solid.dip.framework-import.ast', 'PRE_COMMIT'),
    'ERROR'
  );
  assert.equal(
    findSeverity('heuristics.ts.solid.dip.concrete-instantiation.ast', 'PRE_COMMIT'),
    'ERROR'
  );
  assert.equal(findSeverity('heuristics.ios.force-unwrap.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ios.force-try.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.ios.force-cast.ast', 'PRE_COMMIT'), 'ERROR');
  assert.equal(findSeverity('heuristics.android.thread-sleep.ast', 'PRE_COMMIT'), 'ERROR');
});

test('promotes selected heuristic severities to ERROR in PRE_COMMIT, PRE_PUSH y CI', () => {
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
  assert.equal(findSeverity('heuristics.ts.hardcoded-secret-token.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.weak-crypto-hash.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.insecure-token-math-random.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.insecure-token-date-now.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.weak-token-randomuuid.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.jwt-decode-without-verify.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.jwt-verify-ignore-expiration.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.jwt-sign-no-expiration.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.tls-reject-unauthorized-false.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.dynamic-shell-invocation.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.tls-env-override.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.child-process-shell-true.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.vm-dynamic-code-execution.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.buffer-alloc-unsafe.ast', 'PRE_PUSH'), 'ERROR');
  assert.equal(findSeverity('heuristics.ts.buffer-alloc-unsafe-slow.ast', 'PRE_PUSH'), 'ERROR');
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
  assert.equal(
    findSeverity('heuristics.ts.child-process-exec-file-untrusted-args.ast', 'PRE_PUSH'),
    'ERROR'
  );
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
  assert.equal(
    findSeverity('heuristics.ts.solid.srp.class-command-query-mix.ast', 'PRE_PUSH'),
    'ERROR'
  );
  assert.equal(
    findSeverity('heuristics.ts.solid.isp.interface-command-query-mix.ast', 'PRE_PUSH'),
    'ERROR'
  );
  assert.equal(
    findSeverity('heuristics.ts.solid.ocp.discriminator-switch.ast', 'PRE_PUSH'),
    'ERROR'
  );
  assert.equal(
    findSeverity('heuristics.ts.solid.lsp.override-not-implemented.ast', 'PRE_PUSH'),
    'ERROR'
  );
  assert.equal(
    findSeverity('heuristics.ts.solid.dip.framework-import.ast', 'PRE_PUSH'),
    'ERROR'
  );
  assert.equal(
    findSeverity('heuristics.ts.solid.dip.concrete-instantiation.ast', 'PRE_PUSH'),
    'ERROR'
  );
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

test('keeps ignored heuristic severities unchanged and still promotes PRE_COMMIT', () => {
  assert.equal(findSeverity('heuristics.ts.empty-catch.ast', 'PRE_PUSH'), 'WARN');
  assert.equal(findSeverity('heuristics.ios.callback-style.ast', 'PRE_COMMIT'), 'ERROR');
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
