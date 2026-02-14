import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { collectAdapterSessionStatusTails } from '../adapter-session-status-audit-tail-lib';

const withTempRepo = (run: (repoRoot: string) => void): void => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'pumuki-adapter-tail-'));
  const repoRoot = join(tempRoot, 'repo');
  mkdirSync(repoRoot, { recursive: true });
  try {
    run(repoRoot);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
};

test('collectAdapterSessionStatusTails filters repo logs and picks latest audit files', () => {
  withTempRepo((repoRoot) => {
    const auditDir = join(repoRoot, '.audit_tmp');
    mkdirSync(auditDir, { recursive: true });

    writeFileSync(
      join(auditDir, 'cascade-hook.log'),
      [
        `[ts] ANALYZING: ${repoRoot}/apps/backend/src/example.ts (1 edits)`,
        '[ts] ANALYZING: /tmp/external-repo/file.ts (1 edits)',
        '__pumuki_simulated__',
      ].join('\n'),
      'utf8'
    );
    writeFileSync(
      join(auditDir, 'cascade-writes.log'),
      [
        JSON.stringify({ file: `${repoRoot}/apps/backend/src/example.ts`, size: 10 }),
        JSON.stringify({ file: '/tmp/external-repo/file.ts', size: 20 }),
      ].join('\n'),
      'utf8'
    );
    writeFileSync(join(auditDir, 'cascade-hook-runtime-20260209T100000.log'), 'old', 'utf8');
    writeFileSync(join(auditDir, 'cascade-hook-runtime-20260209T110000.log'), 'new', 'utf8');
    writeFileSync(join(auditDir, 'cascade-hook-smoke-20260209T100000.log'), 'old', 'utf8');
    writeFileSync(join(auditDir, 'cascade-hook-smoke-20260209T110000.log'), 'new', 'utf8');

    const tails = collectAdapterSessionStatusTails({
      repoRoot,
      tailLines: 10,
    });

    assert.equal(tails.length, 4);
    assert.equal(tails[2].title, 'cascade-hook-runtime-20260209T110000.log');
    assert.equal(tails[3].title, 'cascade-hook-smoke-20260209T110000.log');
    assert.match(tails[0].content, /apps\/backend\/src\/example\.ts/);
    assert.doesNotMatch(tails[0].content, /external-repo/);
    assert.match(tails[1].content, /apps\/backend\/src\/example\.ts/);
    assert.doesNotMatch(tails[1].content, /external-repo/);
  });
});

test('collectAdapterSessionStatusTails reports missing audit logs consistently', () => {
  withTempRepo((repoRoot) => {
    const tails = collectAdapterSessionStatusTails({
      repoRoot,
      tailLines: 5,
    });

    assert.equal(tails.length, 4);
    assert.equal(tails[2].title, 'cascade-hook-runtime-<missing>.log');
    assert.equal(tails[3].title, 'cascade-hook-smoke-<missing>.log');
    assert.equal(tails[0].path, resolve(repoRoot, '.audit_tmp/cascade-hook.log'));
    assert.equal(tails[1].path, resolve(repoRoot, '.audit_tmp/cascade-writes.log'));
    assert.match(tails[0].content, /^\[missing\]/);
    assert.match(tails[1].content, /^\[missing\]/);
  });
});
