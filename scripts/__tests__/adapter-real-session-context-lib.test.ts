import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  loadAdapterAuditSnapshot,
  loadAdapterHookConfigSnapshot,
  runGitOrUnknown,
} from '../adapter-real-session-context-lib';

test('runGitOrUnknown returns unknown outside git repository', async () => {
  await withTempDir('pumuki-real-session-git-', (tempRoot) => {
    const branch = runGitOrUnknown(tempRoot, ['rev-parse', '--abbrev-ref', 'HEAD']);
    assert.equal(branch, 'unknown');
  });
});

test('loadAdapterHookConfigSnapshot reads hook config from provided home path', async () => {
  await withTempDir('pumuki-real-session-hook-config-', (tempRoot) => {
    const homeDir = join(tempRoot, 'home');
    const hookConfigDir = join(homeDir, '.codeium/adapter');
    mkdirSync(hookConfigDir, { recursive: true });
    writeFileSync(
      join(hookConfigDir, 'hooks.json'),
      JSON.stringify({ hooks: { pre_write_code: 'echo ok' } }, null, 2),
      'utf8'
    );

    const snapshot = loadAdapterHookConfigSnapshot({
      cwd: tempRoot,
      homeDir,
    });

    assert.equal(snapshot.hookConfigPath, '~/.codeium/adapter/hooks.json');
    assert.equal(snapshot.hookConfigExists, true);
    assert.match(snapshot.hookConfigContent ?? '', /pre_write_code/);
  });
});

test('loadAdapterAuditSnapshot resolves latest logs and tails deterministically', async () => {
  await withTempDir('pumuki-real-session-audit-', (tempRoot) => {
    const auditTmp = join(tempRoot, '.audit_tmp');
    mkdirSync(auditTmp, { recursive: true });

    writeFileSync(join(auditTmp, 'cascade-hook-runtime-20260208.log'), 'old-runtime', 'utf8');
    writeFileSync(
      join(auditTmp, 'cascade-hook-runtime-20260209.log'),
      'line-a\nline-b',
      'utf8'
    );
    writeFileSync(join(auditTmp, 'cascade-hook-smoke-20260208.log'), 'old-smoke', 'utf8');
    writeFileSync(
      join(auditTmp, 'cascade-hook-smoke-20260209.log'),
      'smoke-a\nsmoke-b',
      'utf8'
    );
    writeFileSync(join(auditTmp, 'cascade-hook.log'), 'hook-a\nhook-b', 'utf8');
    writeFileSync(join(auditTmp, 'cascade-writes.log'), 'write-a\nwrite-b', 'utf8');

    const snapshot = loadAdapterAuditSnapshot({
      cwd: tempRoot,
      tailLines: 1,
    });

    assert.equal(snapshot.runtimeLogPath, '.audit_tmp/cascade-hook-runtime-20260209.log');
    assert.equal(snapshot.smokeLogPath, '.audit_tmp/cascade-hook-smoke-20260209.log');
    assert.equal(snapshot.runtimeLogTail, 'line-b');
    assert.equal(snapshot.smokeLogTail, 'smoke-b');
    assert.equal(snapshot.hookLogTail, 'hook-b');
    assert.equal(snapshot.writesLogTail, 'write-b');
    assert.equal(snapshot.hasRuntimeLog, true);
    assert.equal(snapshot.hasSmokeLog, true);
    assert.equal(snapshot.hasHookLog, true);
    assert.equal(snapshot.hasWritesLog, true);
  });
});
