import assert from 'node:assert/strict';
import { mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { PUMUKI_CONFIG_KEYS } from '../constants';
import type { ILifecycleGitService } from '../gitService';
import { installPumukiHooks } from '../hookManager';
import { doctorHasBlockingIssues, runLifecycleDoctor } from '../doctor';

class FakeLifecycleGitService implements ILifecycleGitService {
  constructor(
    private readonly repoRoot: string,
    private readonly trackedNodeModulesPaths: ReadonlyArray<string> = [],
    private readonly state: Record<string, string | undefined> = {}
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
    return this.trackedNodeModulesPaths;
  }

  isPathTracked(): boolean {
    return false;
  }

  setLocalConfig(): void {}

  unsetLocalConfig(): void {}

  getLocalConfig(_cwd: string, key: string): string | undefined {
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
