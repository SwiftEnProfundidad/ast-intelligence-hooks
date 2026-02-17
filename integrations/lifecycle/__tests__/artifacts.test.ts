import assert from 'node:assert/strict';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import type { ILifecycleGitService } from '../gitService';
import { purgeUntrackedPumukiArtifacts } from '../artifacts';

const createGitStub = (
  trackedPaths: ReadonlyArray<string>
): ILifecycleGitService =>
  ({
    runGit() {
      return '';
    },
    resolveRepoRoot(cwd: string) {
      return cwd;
    },
    getStatusShort() {
      return '';
    },
    listTrackedNodeModulesPaths() {
      return [];
    },
    isPathTracked(_cwd: string, path: string) {
      return trackedPaths.includes(path);
    },
    setLocalConfig() {},
    unsetLocalConfig() {},
    getLocalConfig() {
      return undefined;
    },
  }) as ILifecycleGitService;

test('purgeUntrackedPumukiArtifacts elimina artefactos no trackeados', async () => {
  await withTempDir('pumuki-artifacts-purge-', async (repoRoot) => {
    const lowercase = join(repoRoot, '.ai_evidence.json');
    writeFileSync(lowercase, '{}\n', 'utf8');

    const removed = purgeUntrackedPumukiArtifacts({
      git: createGitStub([]),
      repoRoot,
    });

    assert.deepEqual(removed, ['.ai_evidence.json']);
    assert.equal(existsSync(lowercase), false);
  });
});

test('purgeUntrackedPumukiArtifacts preserva artefactos trackeados', async () => {
  await withTempDir('pumuki-artifacts-tracked-', async (repoRoot) => {
    const lowercase = join(repoRoot, '.ai_evidence.json');
    writeFileSync(lowercase, '{}\n', 'utf8');

    const removed = purgeUntrackedPumukiArtifacts({
      git: createGitStub(['.ai_evidence.json', '.AI_EVIDENCE.json']),
      repoRoot,
    });

    assert.deepEqual(removed, []);
    assert.equal(existsSync(lowercase), true);
  });
});

test('purgeUntrackedPumukiArtifacts contempla variante uppercase de artefacto', async () => {
  await withTempDir('pumuki-artifacts-uppercase-', async (repoRoot) => {
    const uppercase = join(repoRoot, '.AI_EVIDENCE.json');
    writeFileSync(uppercase, '{}\n', 'utf8');

    const removed = purgeUntrackedPumukiArtifacts({
      git: createGitStub([]),
      repoRoot,
    });

    assert.equal(removed.length, 1);
    assert.equal(
      removed[0] === '.ai_evidence.json' || removed[0] === '.AI_EVIDENCE.json',
      true
    );
    assert.equal(existsSync(uppercase), false);
  });
});

test('purgeUntrackedPumukiArtifacts preserva alias cuando alguna variante está trackeada', async () => {
  await withTempDir('pumuki-artifacts-tracked-alias-', async (repoRoot) => {
    const uppercase = join(repoRoot, '.AI_EVIDENCE.json');
    writeFileSync(uppercase, '{}\n', 'utf8');

    const removed = purgeUntrackedPumukiArtifacts({
      git: createGitStub(['.ai_evidence.json']),
      repoRoot,
    });

    assert.deepEqual(removed, []);
    assert.equal(existsSync(uppercase), true);
  });
});

test('purgeUntrackedPumukiArtifacts ignora rutas ausentes', async () => {
  await withTempDir('pumuki-artifacts-missing-', async (repoRoot) => {
    const removed = purgeUntrackedPumukiArtifacts({
      git: createGitStub([]),
      repoRoot,
    });

    assert.deepEqual(removed, []);
  });
});
