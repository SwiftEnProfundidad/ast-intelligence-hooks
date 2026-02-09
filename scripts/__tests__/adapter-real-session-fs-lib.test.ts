import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  findLatestAuditFileRelativePath,
  readFileIfExists,
} from '../adapter-real-session-fs-lib';

test('readFileIfExists returns undefined for missing file and content for existing file', async () => {
  await withTempDir('pumuki-real-session-fs-read-', (tempRoot) => {
    const missing = readFileIfExists(tempRoot, '.audit_tmp/missing.log');
    assert.equal(missing, undefined);

    const target = join(tempRoot, '.audit_tmp/existing.log');
    mkdirSync(join(tempRoot, '.audit_tmp'), { recursive: true });
    writeFileSync(target, 'hello', 'utf8');

    const existing = readFileIfExists(tempRoot, '.audit_tmp/existing.log');
    assert.equal(existing, 'hello');
  });
});

test('findLatestAuditFileRelativePath returns latest match by lexical timestamp', async () => {
  await withTempDir('pumuki-real-session-fs-find-', (tempRoot) => {
    const auditDir = join(tempRoot, '.audit_tmp');
    mkdirSync(auditDir, { recursive: true });
    writeFileSync(join(auditDir, 'cascade-hook-runtime-20260208.log'), 'a', 'utf8');
    writeFileSync(join(auditDir, 'cascade-hook-runtime-20260209.log'), 'b', 'utf8');

    const latest = findLatestAuditFileRelativePath({
      cwd: tempRoot,
      directory: '.audit_tmp',
      prefix: 'cascade-hook-runtime-',
      suffix: '.log',
    });

    assert.equal(latest, '.audit_tmp/cascade-hook-runtime-20260209.log');
  });
});
