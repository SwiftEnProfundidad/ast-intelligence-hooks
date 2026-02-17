import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import type { ILifecycleGitService } from '../gitService';
import { installPumukiHooks } from '../hookManager';
import { runLifecycleUninstall } from '../uninstall';

class FakeLifecycleGitService implements ILifecycleGitService {
  readonly unsetCalls: Array<{ cwd: string; key: string }> = [];

  constructor(
    private readonly repoRoot: string,
    private readonly trackedPaths: ReadonlySet<string> = new Set()
  ) {}

  runGit(): string {
    return '';
  }

  resolveRepoRoot(): string {
    return this.repoRoot;
  }

  getStatusShort(): string {
    return '';
  }

  listTrackedNodeModulesPaths(): ReadonlyArray<string> {
    return [];
  }

  isPathTracked(_cwd: string, path: string): boolean {
    return this.trackedPaths.has(path);
  }

  setLocalConfig(): void {}

  unsetLocalConfig(cwd: string, key: string): void {
    this.unsetCalls.push({ cwd, key });
  }

  getLocalConfig(): string | undefined {
    return undefined;
  }
}

test('runLifecycleUninstall sin purge elimina hooks gestionados y limpia estado', async () => {
  await withTempDir('pumuki-uninstall-no-purge-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);

    const git = new FakeLifecycleGitService(repoRoot);
    const result = runLifecycleUninstall({
      cwd: '/tmp/ignored',
      purgeArtifacts: false,
      git,
    });

    assert.equal(result.repoRoot, repoRoot);
    assert.deepEqual(result.changedHooks, ['pre-commit', 'pre-push']);
    assert.deepEqual(result.removedArtifacts, []);
    assert.equal(existsSync(join(repoRoot, '.git/hooks/pre-commit')), false);
    assert.equal(existsSync(join(repoRoot, '.git/hooks/pre-push')), false);
    assert.equal(git.unsetCalls.length, 4);
  });
});

test('runLifecycleUninstall con purge elimina artefacto cuando no está trackeado', async () => {
  await withTempDir('pumuki-uninstall-purge-untracked-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);

    const artifact = join(repoRoot, '.ai_evidence.json');
    writeFileSync(artifact, '{}\n', 'utf8');

    const git = new FakeLifecycleGitService(repoRoot);
    const result = runLifecycleUninstall({
      cwd: repoRoot,
      purgeArtifacts: true,
      git,
    });

    assert.deepEqual(result.changedHooks, ['pre-commit', 'pre-push']);
    assert.deepEqual(result.removedArtifacts, ['.ai_evidence.json']);
    assert.equal(existsSync(artifact), false);
  });
});

test('runLifecycleUninstall con purge preserva artefacto trackeado', async () => {
  await withTempDir('pumuki-uninstall-purge-tracked-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);

    const artifact = join(repoRoot, '.ai_evidence.json');
    writeFileSync(artifact, '{}\n', 'utf8');

    const git = new FakeLifecycleGitService(repoRoot, new Set(['.ai_evidence.json']));
    const result = runLifecycleUninstall({
      cwd: repoRoot,
      purgeArtifacts: true,
      git,
    });

    assert.deepEqual(result.removedArtifacts, []);
    assert.equal(existsSync(artifact), true);
  });
});
