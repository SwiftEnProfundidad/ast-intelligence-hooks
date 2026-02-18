import assert from 'node:assert/strict';
import { existsSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { PUMUKI_CONFIG_KEYS } from '../constants';
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
  private readonly config = new Map<string, string>();

  constructor(
    private readonly repoRoot: string,
    private readonly trackedPaths: ReadonlySet<string> = new Set(),
    initialConfig: Record<string, string> = {}
  ) {
    for (const [key, value] of Object.entries(initialConfig)) {
      this.config.set(key, value);
    }
  }

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

  setLocalConfig(_cwd: string, key: string, value: string): void {
    this.config.set(key, value);
  }

  unsetLocalConfig(cwd: string, key: string): void {
    this.unsetCalls.push({ cwd, key });
    this.config.delete(key);
  }

  getLocalConfig(_cwd: string, key: string): string | undefined {
    return this.config.get(key);
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
    assert.equal(git.unsetCalls.length, 5);
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
    assert.equal(git.unsetCalls.length, 10);
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
    assert.equal(git.unsetCalls.length, 5);
  });
});

test('runLifecycleUninstall purge elimina artefactos OpenSpec gestionados y no trackeados', async () => {
  await withTempDir('pumuki-uninstall-purge-openspec-managed-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);
    mkdirSync(join(repoRoot, 'openspec', 'changes', 'archive'), {
      recursive: true,
    });
    mkdirSync(join(repoRoot, 'openspec', 'specs'), {
      recursive: true,
    });
    writeFileSync(join(repoRoot, 'openspec', 'project.md'), '# OpenSpec Project\n', 'utf8');
    writeFileSync(join(repoRoot, 'openspec', 'changes', 'archive', '.gitkeep'), '', 'utf8');
    writeFileSync(join(repoRoot, 'openspec', 'specs', '.gitkeep'), '', 'utf8');

    const git = new FakeLifecycleGitService(repoRoot, new Set(), {
      [PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts]:
        'openspec/project.md,openspec/changes/archive/.gitkeep,openspec/specs/.gitkeep',
    });
    const result = runLifecycleUninstall({
      cwd: repoRoot,
      purgeArtifacts: true,
      git,
    });

    assert.deepEqual(result.removedArtifacts, [
      'openspec/project.md',
      'openspec/changes/archive/.gitkeep',
      'openspec/specs/.gitkeep',
    ]);
    assert.equal(existsSync(join(repoRoot, 'openspec')), false);
  });
});

test('runLifecycleUninstall purge preserva artefactos OpenSpec gestionados cuando están trackeados', async () => {
  await withTempDir('pumuki-uninstall-purge-openspec-tracked-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);
    mkdirSync(join(repoRoot, 'openspec', 'changes', 'archive'), {
      recursive: true,
    });
    writeFileSync(join(repoRoot, 'openspec', 'project.md'), '# OpenSpec Project\n', 'utf8');
    writeFileSync(join(repoRoot, 'openspec', 'changes', 'archive', '.gitkeep'), '', 'utf8');

    const git = new FakeLifecycleGitService(repoRoot, new Set(['openspec/project.md']), {
      [PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts]:
        'openspec/project.md,openspec/changes/archive/.gitkeep',
    });
    const result = runLifecycleUninstall({
      cwd: repoRoot,
      purgeArtifacts: true,
      git,
    });

    assert.deepEqual(result.removedArtifacts, ['openspec/changes/archive/.gitkeep']);
    assert.equal(existsSync(join(repoRoot, 'openspec', 'project.md')), true);
    assert.equal(existsSync(join(repoRoot, 'openspec')), true);
  });
});
