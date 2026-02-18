import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { PUMUKI_CONFIG_KEYS } from '../constants';
import type { ILifecycleGitService } from '../gitService';
import { buildPumukiManagedHookBlock } from '../hookBlock';
import { getCurrentPumukiVersion } from '../packageInfo';
import { readLifecycleStatus } from '../status';

class FakeLifecycleGitService implements ILifecycleGitService {
  readonly resolveCalls: string[] = [];
  readonly listTrackedCalls: string[] = [];
  readonly getConfigCalls: Array<{ cwd: string; key: string }> = [];

  constructor(
    private readonly repoRoot: string,
    private readonly trackedNodeModules: ReadonlyArray<string>,
    private readonly config: Record<string, string>
  ) {}

  runGit(): string {
    return '';
  }

  resolveRepoRoot(cwd: string): string {
    this.resolveCalls.push(cwd);
    return this.repoRoot;
  }

  getStatusShort(): string {
    return '';
  }

  listTrackedNodeModulesPaths(cwd: string): ReadonlyArray<string> {
    this.listTrackedCalls.push(cwd);
    return this.trackedNodeModules;
  }

  isPathTracked(): boolean {
    return false;
  }

  setLocalConfig(): void {}

  unsetLocalConfig(): void {}

  getLocalConfig(cwd: string, key: string): string | undefined {
    this.getConfigCalls.push({ cwd, key });
    return this.config[key];
  }
}

test('readLifecycleStatus compone estado desde git + hooks + lifecycle config', async () => {
  await withTempDir('pumuki-lifecycle-status-', async (repoRoot) => {
    const hooksDir = join(repoRoot, '.git', 'hooks');
    mkdirSync(hooksDir, { recursive: true });

    writeFileSync(
      join(hooksDir, 'pre-commit'),
      `#!/usr/bin/env sh\n\n${buildPumukiManagedHookBlock('pre-commit')}\n`,
      'utf8'
    );
    writeFileSync(join(hooksDir, 'pre-push'), '#!/usr/bin/env sh\necho "custom"\n', 'utf8');

    const git = new FakeLifecycleGitService(
      repoRoot,
      ['node_modules/.package-lock.json', 'node_modules/@scope/pkg/index.js'],
      {
        [PUMUKI_CONFIG_KEYS.installed]: 'true',
        [PUMUKI_CONFIG_KEYS.version]: '6.3.11',
        [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit,pre-push',
        [PUMUKI_CONFIG_KEYS.installedAt]: '2026-02-17T10:00:00.000Z',
      }
    );

    const status = readLifecycleStatus({
      cwd: '/tmp/ignored-cwd',
      git,
    });

    assert.equal(status.repoRoot, repoRoot);
    assert.equal(status.packageVersion, getCurrentPumukiVersion());
    assert.equal(status.trackedNodeModulesCount, 2);
    assert.deepEqual(status.lifecycleState, {
      installed: 'true',
      version: '6.3.11',
      hooks: 'pre-commit,pre-push',
      installedAt: '2026-02-17T10:00:00.000Z',
      openSpecManagedArtifacts: undefined,
    });
    assert.deepEqual(status.hookStatus, {
      'pre-commit': { exists: true, managedBlockPresent: true },
      'pre-push': { exists: true, managedBlockPresent: false },
    });

    assert.deepEqual(git.resolveCalls, ['/tmp/ignored-cwd']);
    assert.deepEqual(git.listTrackedCalls, [repoRoot]);
    assert.deepEqual(
      git.getConfigCalls.map((call) => call.key),
      [
        PUMUKI_CONFIG_KEYS.installed,
        PUMUKI_CONFIG_KEYS.version,
        PUMUKI_CONFIG_KEYS.hooks,
        PUMUKI_CONFIG_KEYS.installedAt,
        PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts,
      ]
    );
    assert.ok(git.getConfigCalls.every((call) => call.cwd === repoRoot));
  });
});

test('readLifecycleStatus usa process.cwd cuando no se pasa cwd explícito', async () => {
  await withTempDir('pumuki-lifecycle-status-default-cwd-', async (repoRoot) => {
    const git = new FakeLifecycleGitService(repoRoot, [], {});

    const status = readLifecycleStatus({ git });

    assert.equal(status.repoRoot, repoRoot);
    assert.deepEqual(git.resolveCalls, [process.cwd()]);
    assert.deepEqual(git.listTrackedCalls, [repoRoot]);
    assert.equal(status.trackedNodeModulesCount, 0);
  });
});

test('readLifecycleStatus devuelve lifecycle vacío y hooks ausentes cuando no hay instalación', async () => {
  await withTempDir('pumuki-lifecycle-status-empty-', async (repoRoot) => {
    const git = new FakeLifecycleGitService(repoRoot, [], {});

    const status = readLifecycleStatus({
      cwd: repoRoot,
      git,
    });

    assert.deepEqual(status.lifecycleState, {
      installed: undefined,
      version: undefined,
      hooks: undefined,
      installedAt: undefined,
      openSpecManagedArtifacts: undefined,
    });
    assert.deepEqual(status.hookStatus, {
      'pre-commit': { exists: false, managedBlockPresent: false },
      'pre-push': { exists: false, managedBlockPresent: false },
    });
  });
});
