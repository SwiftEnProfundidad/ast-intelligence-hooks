import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import type { ILifecycleGitService } from '../gitService';
import { installPumukiHooks } from '../hookManager';
import type { ILifecycleNpmService } from '../npmService';
import { getCurrentPumukiPackageName } from '../packageInfo';
import { runLifecycleRemove } from '../remove';

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

class FakeLifecycleNpmService implements ILifecycleNpmService {
  readonly calls: Array<{ args: ReadonlyArray<string>; cwd: string }> = [];

  runNpm(args: ReadonlyArray<string>, cwd: string): string {
    this.calls.push({ args, cwd });
    return '';
  }
}

test('runLifecycleRemove sin dependencia de pumuki evita npm uninstall y limpia trazas', async () => {
  await withTempDir('pumuki-remove-no-dependency-', async (repoRoot) => {
    const packageName = getCurrentPumukiPackageName();
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    mkdirSync(join(repoRoot, 'node_modules', packageName), { recursive: true });
    mkdirSync(join(repoRoot, 'node_modules', '@trace', 'dep'), { recursive: true });
    mkdirSync(join(repoRoot, 'node_modules', 'dayjs'), { recursive: true });
    installPumukiHooks(repoRoot);

    writeFileSync(
      join(repoRoot, 'package.json'),
      JSON.stringify(
        {
          name: 'fixture',
          version: '1.0.0',
          dependencies: {
            dayjs: '1.11.13',
          },
        },
        null,
        2
      ),
      'utf8'
    );
    writeFileSync(
      join(repoRoot, 'node_modules', packageName, 'package.json'),
      JSON.stringify(
        {
          name: packageName,
          version: '0.0.0',
          dependencies: {
            '@trace/dep': '1.0.0',
          },
        },
        null,
        2
      ),
      'utf8'
    );
    writeFileSync(
      join(repoRoot, 'node_modules', '@trace', 'dep', 'package.json'),
      JSON.stringify({
        name: '@trace/dep',
        version: '1.0.0',
      }),
      'utf8'
    );
    writeFileSync(
      join(repoRoot, 'node_modules', 'dayjs', 'package.json'),
      JSON.stringify({
        name: 'dayjs',
        version: '1.11.13',
      }),
      'utf8'
    );
    writeFileSync(join(repoRoot, '.ai_evidence.json'), '{}\n', 'utf8');

    const git = new FakeLifecycleGitService(repoRoot);
    const npm = new FakeLifecycleNpmService();
    const result = runLifecycleRemove({
      cwd: repoRoot,
      git,
      npm,
    });

    assert.equal(result.repoRoot, repoRoot);
    assert.equal(result.packageRemoved, false);
    assert.deepEqual(result.changedHooks, ['pre-commit', 'pre-push']);
    assert.deepEqual(result.removedArtifacts, ['.ai_evidence.json']);
    assert.equal(npm.calls.length, 0);
    assert.equal(existsSync(join(repoRoot, '.git/hooks/pre-commit')), false);
    assert.equal(existsSync(join(repoRoot, '.git/hooks/pre-push')), false);
    assert.equal(existsSync(join(repoRoot, 'node_modules', packageName)), true);
    assert.equal(existsSync(join(repoRoot, 'node_modules', '@trace', 'dep')), true);
    assert.equal(existsSync(join(repoRoot, 'node_modules', 'dayjs')), true);
  });
});

test('runLifecycleRemove con dependencia declarada de pumuki invoca npm uninstall', async () => {
  await withTempDir('pumuki-remove-dependency-', async (repoRoot) => {
    const packageName = getCurrentPumukiPackageName();
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);
    writeFileSync(join(repoRoot, '.ai_evidence.json'), '{}\n', 'utf8');
    writeFileSync(
      join(repoRoot, 'package.json'),
      JSON.stringify(
        {
          name: 'fixture',
          version: '1.0.0',
          dependencies: {
            [packageName]: '6.3.11',
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const git = new FakeLifecycleGitService(repoRoot);
    const npm = new FakeLifecycleNpmService();
    const result = runLifecycleRemove({
      cwd: repoRoot,
      git,
      npm,
    });

    assert.equal(result.packageRemoved, true);
    assert.deepEqual(result.changedHooks, ['pre-commit', 'pre-push']);
    assert.deepEqual(result.removedArtifacts, ['.ai_evidence.json']);
    assert.equal(npm.calls.length, 1);
    assert.deepEqual(npm.calls[0]?.args, ['uninstall', packageName]);
    assert.equal(npm.calls[0]?.cwd, repoRoot);
    assert.equal(existsSync(join(repoRoot, '.git/hooks/pre-commit')), false);
    assert.equal(existsSync(join(repoRoot, '.git/hooks/pre-push')), false);
  });
});
