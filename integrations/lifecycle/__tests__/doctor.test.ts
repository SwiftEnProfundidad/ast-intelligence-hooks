import assert from 'node:assert/strict';
import { mkdirSync, realpathSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { PUMUKI_CONFIG_KEYS } from '../constants';
import type { ILifecycleGitService } from '../gitService';
import { installPumukiHooks } from '../hookManager';
import { doctorHasBlockingIssues, runLifecycleDoctor } from '../doctor';
import { getCurrentPumukiVersion } from '../packageInfo';

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
  readonly resolveRepoRootCalls: string[] = [];

  constructor(
    private readonly repoRoot: string,
    private readonly trackedNodeModules: ReadonlyArray<string> = [],
    private readonly state: Record<string, string | undefined> = {}
  ) {}

  runGit(_args: ReadonlyArray<string>, _cwd: string): string {
    return '';
  }

  resolveRepoRoot(cwd: string): string {
    this.resolveRepoRootCalls.push(cwd);
    return this.repoRoot;
  }

  statusShort(_cwd: string): string {
    return '';
  }

  trackedNodeModulesPaths(_cwd: string): ReadonlyArray<string> {
    return this.trackedNodeModules;
  }

  pathTracked(_cwd: string, _path: string): boolean {
    return false;
  }

  applyLocalConfig(_cwd: string, _key: string, _value: string): void {}

  clearLocalConfig(_cwd: string, _key: string): void {}

  localConfig(_cwd: string, key: string): string | undefined {
    return this.state[key];
  }
}

test('runLifecycleDoctor marca issue bloqueante cuando hay rutas trackeadas en node_modules', async () => {
  await withTempDir('pumuki-doctor-tracked-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    const git = new FakeLifecycleGitService(repoRoot, ['node_modules/pkg/index.js'], {
      [PUMUKI_CONFIG_KEYS.installed]: 'true',
    });

    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
    });

    assert.equal(report.repoRoot, repoRoot);
    assert.deepEqual(report.trackedNodeModulesPaths, ['node_modules/pkg/index.js']);
    assert.equal(report.issues.some((issue) => issue.severity === 'error'), true);
    assert.equal(doctorHasBlockingIssues(report), true);
  });
});

test('runLifecycleDoctor marca warning si lifecycle dice instalado y falta bloque de hook', async () => {
  await withTempDir('pumuki-doctor-missing-hook-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);
    unlinkSync(join(repoRoot, '.git', 'hooks', 'pre-push'));

    const git = new FakeLifecycleGitService(repoRoot, [], {
      [PUMUKI_CONFIG_KEYS.installed]: 'true',
    });
    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
    });

    assert.equal(report.issues.length, 1);
    assert.equal(report.issues[0]?.severity, 'warning');
    assert.match(report.issues[0]?.message ?? '', /installed=true/i);
    assert.equal(doctorHasBlockingIssues(report), false);
  });
});

test('runLifecycleDoctor marca warning si hay hooks gestionados pero lifecycle no está instalado', async () => {
  await withTempDir('pumuki-doctor-hooks-without-state-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);

    const git = new FakeLifecycleGitService(repoRoot, [], {
      [PUMUKI_CONFIG_KEYS.installed]: 'false',
    });
    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
    });

    assert.equal(report.issues.length, 1);
    assert.equal(report.issues[0]?.severity, 'warning');
    assert.match(report.issues[0]?.message ?? '', /not marked as installed/i);
    assert.equal(doctorHasBlockingIssues(report), false);
  });
});

test('runLifecycleDoctor queda limpio cuando estado y hooks son consistentes', async () => {
  await withTempDir('pumuki-doctor-clean-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);

    const git = new FakeLifecycleGitService(repoRoot, [], {
      [PUMUKI_CONFIG_KEYS.installed]: 'true',
      [PUMUKI_CONFIG_KEYS.version]: '6.3.11',
      [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit,pre-push',
    });
    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
    });

    assert.deepEqual(report.issues, []);
    assert.equal(doctorHasBlockingIssues(report), false);
  });
});

test('runLifecycleDoctor usa process.cwd por defecto y conserva metadatos de lifecycle', async () => {
  await withTempDir('pumuki-doctor-default-cwd-', async (repoRoot) => {
    const git = new FakeLifecycleGitService(repoRoot, [], {
      [PUMUKI_CONFIG_KEYS.installed]: 'true',
      [PUMUKI_CONFIG_KEYS.version]: '6.3.11',
      [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit,pre-push',
      [PUMUKI_CONFIG_KEYS.installedAt]: '2026-02-17T00:00:00.000Z',
    });
    const defaultCwd = tmpdir();
    const report = withCwd(defaultCwd, () =>
      runLifecycleDoctor({
        git,
      })
    );

    assert.equal(report.packageVersion, getCurrentPumukiVersion());
    assert.equal(report.lifecycleState.installed, 'true');
    assert.equal(report.lifecycleState.version, '6.3.11');
    assert.equal(report.lifecycleState.hooks, 'pre-commit,pre-push');
    assert.equal(report.lifecycleState.installedAt, '2026-02-17T00:00:00.000Z');
    assert.equal(git.resolveRepoRootCalls.length >= 1, true);
    assert.equal(realpathSync(git.resolveRepoRootCalls[0] ?? defaultCwd), realpathSync(defaultCwd));
  });
});

test('runLifecycleDoctor reporta error y warning cuando hay tracked node_modules y hooks huérfanos', async () => {
  await withTempDir('pumuki-doctor-mixed-issues-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);
    const git = new FakeLifecycleGitService(repoRoot, ['node_modules/pkg/index.js'], {
      [PUMUKI_CONFIG_KEYS.installed]: 'false',
    });

    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
    });

    assert.equal(report.issues.length, 2);
    assert.equal(report.issues[0]?.severity, 'error');
    assert.equal(report.issues[1]?.severity, 'warning');
    assert.equal(doctorHasBlockingIssues(report), true);
  });
});
