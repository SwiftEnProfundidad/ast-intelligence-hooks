import assert from 'node:assert/strict';
import { existsSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import type { ILifecycleGitService } from '../gitService';
import { installPumukiHooks } from '../hookManager';
import { runLifecycleUninstall } from '../uninstall';

const withCwd = <T>(cwd: string, fn: () => T): T => {
  const previous = process.cwd();
  process.chdir(cwd);
  try {
    return fn();
  } finally {
    process.chdir(previous);
  }
};

class FakeLifecycleGitService implements ILifecycleGitService {
  readonly unsetCalls: Array<{ cwd: string; key: string }> = [];
  readonly resolveRepoRootCalls: string[] = [];

  constructor(
    private readonly repoRoot: string,
    private readonly trackedPaths: ReadonlySet<string> = new Set()
  ) {}

  runGit(_args: ReadonlyArray<string>, _cwd: string): string {
    return '';
  }

  resolveRepoRoot(cwd: string): string {
    this.resolveRepoRootCalls.push(cwd);
    return this.repoRoot;
  }

  getStatusShort(_cwd: string): string {
    return '';
  }

  listTrackedNodeModulesPaths(_cwd: string): ReadonlyArray<string> {
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

test('runLifecycleUninstall es idempotente cuando se ejecuta dos veces seguidas', async () => {
  await withTempDir('pumuki-uninstall-idempotent-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);

    const git = new FakeLifecycleGitService(repoRoot);
    const first = runLifecycleUninstall({
      cwd: repoRoot,
      git,
    });
    const second = runLifecycleUninstall({
      cwd: repoRoot,
      git,
    });

    assert.deepEqual(first.changedHooks, ['pre-commit', 'pre-push']);
    assert.deepEqual(second.changedHooks, []);
    assert.equal(git.unsetCalls.length, 8);
  });
});

test('runLifecycleUninstall usa process.cwd cuando no recibe cwd explícito', async () => {
  await withTempDir('pumuki-uninstall-default-cwd-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);

    const git = new FakeLifecycleGitService(repoRoot);
    const defaultCwd = tmpdir();
    const result = withCwd(defaultCwd, () =>
      runLifecycleUninstall({
        git,
      })
    );

    assert.equal(result.repoRoot, repoRoot);
    assert.deepEqual(git.resolveRepoRootCalls.map((cwd) => realpathSync(cwd)), [realpathSync(defaultCwd)]);
  });
});

test('runLifecycleUninstall preserva hooks custom sin bloque gestionado', async () => {
  await withTempDir('pumuki-uninstall-custom-hook-', async (repoRoot) => {
    const hooksDir = join(repoRoot, '.git', 'hooks');
    mkdirSync(hooksDir, { recursive: true });

    const customHookPath = join(hooksDir, 'pre-commit');
    const customHookContents = '#!/usr/bin/env bash\necho "custom-hook"\n';
    writeFileSync(customHookPath, customHookContents, 'utf8');

    const git = new FakeLifecycleGitService(repoRoot);
    const result = runLifecycleUninstall({
      cwd: repoRoot,
      git,
    });

    assert.deepEqual(result.changedHooks, []);
    assert.equal(existsSync(customHookPath), true);
    assert.equal(git.unsetCalls.length, 4);
  });
});
