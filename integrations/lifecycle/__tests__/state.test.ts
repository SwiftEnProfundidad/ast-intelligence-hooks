import assert from 'node:assert/strict';
import test from 'node:test';
import { PUMUKI_CONFIG_KEYS, PUMUKI_MANAGED_HOOKS } from '../constants';
import type { ILifecycleGitService } from '../gitService';
import {
  clearLifecycleState,
  readLifecycleState,
  readOpenSpecManagedArtifacts,
  writeLifecycleState,
  writeOpenSpecManagedArtifacts,
} from '../state';

class FakeLifecycleGitService implements ILifecycleGitService {
  readonly setCalls: Array<{ cwd: string; key: string; value: string }> = [];
  readonly unsetCalls: Array<{ cwd: string; key: string }> = [];
  readonly getCalls: Array<{ cwd: string; key: string }> = [];
  private readonly config = new Map<string, string>();

  constructor(initialConfig: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(initialConfig)) {
      this.config.set(key, value);
    }
  }

  runGit(): string {
    return '';
  }

  resolveRepoRoot(cwd: string): string {
    return cwd;
  }

  statusShort(): string {
    return '';
  }

  trackedNodeModulesPaths(): ReadonlyArray<string> {
    return [];
  }

  pathTracked(): boolean {
    return false;
  }

  applyLocalConfig(cwd: string, key: string, value: string): void {
    this.setCalls.push({ cwd, key, value });
    this.config.set(key, value);
  }

  clearLocalConfig(cwd: string, key: string): void {
    this.unsetCalls.push({ cwd, key });
    this.config.delete(key);
  }

  localConfig(cwd: string, key: string): string | undefined {
    this.getCalls.push({ cwd, key });
    return this.config.get(key);
  }
}

test('readLifecycleState devuelve valores actuales desde git config local', () => {
  const repoRoot = '/tmp/repo';
  const git = new FakeLifecycleGitService({
    [PUMUKI_CONFIG_KEYS.installed]: 'true',
    [PUMUKI_CONFIG_KEYS.version]: '6.3.11',
    [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit,pre-push',
    [PUMUKI_CONFIG_KEYS.installedAt]: '2026-02-17T10:00:00.000Z',
    [PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts]:
      'openspec/project.md,openspec/specs/.gitkeep',
  });

  const state = readLifecycleState(git, repoRoot);

  assert.deepEqual(state, {
    installed: 'true',
    version: '6.3.11',
    hooks: 'pre-commit,pre-push',
    installedAt: '2026-02-17T10:00:00.000Z',
    openSpecManagedArtifacts: 'openspec/project.md,openspec/specs/.gitkeep',
  });
  assert.deepEqual(git.getCalls.map((call) => call.key), [
    PUMUKI_CONFIG_KEYS.installed,
    PUMUKI_CONFIG_KEYS.version,
    PUMUKI_CONFIG_KEYS.hooks,
    PUMUKI_CONFIG_KEYS.installedAt,
    PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts,
  ]);
});

test('writeLifecycleState persiste installed/version/hooks/installedAt', () => {
  const repoRoot = '/tmp/repo';
  const git = new FakeLifecycleGitService();

  writeLifecycleState({
    git,
    repoRoot,
    version: '6.3.12',
  });

  assert.equal(git.setCalls.length, 4);
  assert.deepEqual(git.setCalls.slice(0, 3), [
    { cwd: repoRoot, key: PUMUKI_CONFIG_KEYS.installed, value: 'true' },
    { cwd: repoRoot, key: PUMUKI_CONFIG_KEYS.version, value: '6.3.12' },
    { cwd: repoRoot, key: PUMUKI_CONFIG_KEYS.hooks, value: PUMUKI_MANAGED_HOOKS.join(',') },
  ]);
  const installedAtCall = git.setCalls[3];
  assert.ok(installedAtCall);
  assert.equal(installedAtCall.cwd, repoRoot);
  assert.equal(installedAtCall.key, PUMUKI_CONFIG_KEYS.installedAt);
  assert.equal(Number.isFinite(Date.parse(installedAtCall.value)), true);
});

test('clearLifecycleState elimina todas las claves lifecycle de git config local', () => {
  const repoRoot = '/tmp/repo';
  const git = new FakeLifecycleGitService({
    [PUMUKI_CONFIG_KEYS.installed]: 'true',
    [PUMUKI_CONFIG_KEYS.version]: '6.3.11',
    [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit,pre-push',
    [PUMUKI_CONFIG_KEYS.installedAt]: '2026-02-17T10:00:00.000Z',
    [PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts]: 'openspec/project.md',
  });

  clearLifecycleState(git, repoRoot);

  assert.deepEqual(git.unsetCalls, [
    { cwd: repoRoot, key: PUMUKI_CONFIG_KEYS.installed },
    { cwd: repoRoot, key: PUMUKI_CONFIG_KEYS.version },
    { cwd: repoRoot, key: PUMUKI_CONFIG_KEYS.hooks },
    { cwd: repoRoot, key: PUMUKI_CONFIG_KEYS.installedAt },
    { cwd: repoRoot, key: PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts },
  ]);
  const state = readLifecycleState(git, repoRoot);
  assert.deepEqual(state, {
    installed: undefined,
    version: undefined,
    hooks: undefined,
    installedAt: undefined,
    openSpecManagedArtifacts: undefined,
  });
});

test('writeLifecycleState sobrescribe valores previos con contrato canónico de hooks', () => {
  const repoRoot = '/tmp/repo';
  const git = new FakeLifecycleGitService({
    [PUMUKI_CONFIG_KEYS.installed]: 'false',
    [PUMUKI_CONFIG_KEYS.version]: '0.0.0',
    [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit',
  });

  writeLifecycleState({
    git,
    repoRoot,
    version: '6.3.13',
  });

  const state = readLifecycleState(git, repoRoot);
  assert.equal(state.installed, 'true');
  assert.equal(state.version, '6.3.13');
  assert.equal(state.hooks, PUMUKI_MANAGED_HOOKS.join(','));
  assert.equal(Number.isFinite(Date.parse(String(state.installedAt))), true);
});

test('clearLifecycleState es idempotente aunque no existan claves previas', () => {
  const repoRoot = '/tmp/repo';
  const git = new FakeLifecycleGitService();

  assert.doesNotThrow(() => clearLifecycleState(git, repoRoot));
  assert.deepEqual(git.unsetCalls, [
    { cwd: repoRoot, key: PUMUKI_CONFIG_KEYS.installed },
    { cwd: repoRoot, key: PUMUKI_CONFIG_KEYS.version },
    { cwd: repoRoot, key: PUMUKI_CONFIG_KEYS.hooks },
    { cwd: repoRoot, key: PUMUKI_CONFIG_KEYS.installedAt },
    { cwd: repoRoot, key: PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts },
  ]);
});

test('writeOpenSpecManagedArtifacts persiste lista determinista y readOpenSpecManagedArtifacts la parsea', () => {
  const repoRoot = '/tmp/repo';
  const git = new FakeLifecycleGitService();

  writeOpenSpecManagedArtifacts({
    git,
    repoRoot,
    artifacts: [
      'openspec/specs/.gitkeep',
      'openspec/project.md',
      'openspec/project.md',
      ' openspec/changes/archive/.gitkeep ',
    ],
  });

  const managed = readOpenSpecManagedArtifacts(git, repoRoot);
  assert.deepEqual(managed, [
    'openspec/changes/archive/.gitkeep',
    'openspec/project.md',
    'openspec/specs/.gitkeep',
  ]);
});

test('writeOpenSpecManagedArtifacts limpia la key cuando recibe lista vacía', () => {
  const repoRoot = '/tmp/repo';
  const git = new FakeLifecycleGitService({
    [PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts]: 'openspec/project.md',
  });

  writeOpenSpecManagedArtifacts({
    git,
    repoRoot,
    artifacts: [],
  });

  assert.equal(readOpenSpecManagedArtifacts(git, repoRoot).length, 0);
  assert.equal(
    git.unsetCalls.some((call) => call.key === PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts),
    true
  );
});
