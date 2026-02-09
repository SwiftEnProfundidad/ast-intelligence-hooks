import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  cleanValidationArtifacts,
  resolveValidationArtifactTargets,
} from '../clean-validation-artifacts-lib';

test('resolveValidationArtifactTargets returns deterministic artifact and audit targets', async () => {
  await withTempDir('pumuki-clean-artifacts-targets-', async (tempRoot) => {
    const windsurfArtifacts = join(tempRoot, 'docs', 'validation', 'windsurf', 'artifacts');
    const pilotArtifacts = join(tempRoot, 'docs', 'validation', 'pilot0', 'artifacts');
    const archiveDir = join(tempRoot, 'docs', 'validation', 'archive');
    const auditTmp = join(tempRoot, '.audit_tmp');

    mkdirSync(windsurfArtifacts, { recursive: true });
    mkdirSync(pilotArtifacts, { recursive: true });
    mkdirSync(archiveDir, { recursive: true });
    mkdirSync(auditTmp, { recursive: true });

    const targets = resolveValidationArtifactTargets(tempRoot);
    assert.deepEqual(targets, [auditTmp, pilotArtifacts, windsurfArtifacts]);
  });
});

test('cleanValidationArtifacts supports dry-run mode', async () => {
  await withTempDir('pumuki-clean-artifacts-dry-run-', async (tempRoot) => {
    const artifactsDir = join(tempRoot, 'docs', 'validation', 'windsurf', 'artifacts');
    mkdirSync(artifactsDir, { recursive: true });
    writeFileSync(join(artifactsDir, 'sample.log'), 'artifact', 'utf8');

    const result = cleanValidationArtifacts({
      repoRoot: tempRoot,
      dryRun: true,
    });

    assert.equal(result.removed.length, 0);
    assert.equal(result.skipped.length, 1);
    assert.equal(existsSync(artifactsDir), true);
  });
});

test('cleanValidationArtifacts removes artifact directories and keeps archive docs', async () => {
  await withTempDir('pumuki-clean-artifacts-remove-', async (tempRoot) => {
    const artifactsDir = join(tempRoot, 'docs', 'validation', 'windsurf', 'artifacts');
    const archiveDoc = join(tempRoot, 'docs', 'validation', 'archive', 'README.md');
    const auditTmp = join(tempRoot, '.audit_tmp');

    mkdirSync(artifactsDir, { recursive: true });
    mkdirSync(join(tempRoot, 'docs', 'validation', 'archive'), { recursive: true });
    mkdirSync(auditTmp, { recursive: true });
    writeFileSync(join(artifactsDir, 'sample.log'), 'artifact', 'utf8');
    writeFileSync(archiveDoc, '# archive', 'utf8');

    const result = cleanValidationArtifacts({
      repoRoot: tempRoot,
      dryRun: false,
    });

    assert.equal(result.removed.includes(artifactsDir), true);
    assert.equal(result.removed.includes(auditTmp), true);
    assert.equal(existsSync(artifactsDir), false);
    assert.equal(existsSync(auditTmp), false);
    assert.equal(existsSync(archiveDoc), true);
  });
});
