import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import type { ILifecycleGitService } from '../gitService';
import type { ILifecycleNpmService } from '../npmService';
import { getCurrentPumukiPackageName } from '../packageInfo';
import { runLifecycleUpdate } from '../update';

class FakeLifecycleGitService implements ILifecycleGitService {
  readonly setCalls: Array<{ cwd: string; key: string; value: string }> = [];
  readonly unsetCalls: Array<{ cwd: string; key: string }> = [];
  private readonly trackedQueue: Array<ReadonlyArray<string>>;

  constructor(
    private readonly repoRoot: string,
    trackedResponses: ReadonlyArray<ReadonlyArray<string>> = [[]]
  ) {
    this.trackedQueue = [...trackedResponses];
  }

  runGit(): string {
    return '';
  }

  resolveRepoRoot(): string {
    return this.repoRoot;
  }

  statusShort(): string {
    return '';
  }

  trackedNodeModulesPaths(): ReadonlyArray<string> {
    if (this.trackedQueue.length <= 1) {
      return this.trackedQueue[0] ?? [];
    }
    const next = this.trackedQueue.shift();
    return next ?? [];
  }

  pathTracked(): boolean {
    return false;
  }

  applyLocalConfig(cwd: string, key: string, value: string): void {
    this.setCalls.push({ cwd, key, value });
  }

  clearLocalConfig(cwd: string, key: string): void {
    this.unsetCalls.push({ cwd, key });
  }

  localConfig(): string | undefined {
    return undefined;
  }
}

class FakeLifecycleNpmService implements ILifecycleNpmService {
  readonly calls: Array<{ args: ReadonlyArray<string>; cwd: string }> = [];

  runNpm(args: ReadonlyArray<string>, cwd: string): void {
    this.calls.push({ args, cwd });
  }
}

test('runLifecycleUpdate bloquea cuando doctor detecta rutas trackeadas en node_modules', async () => {
  await withTempDir('pumuki-update-blocked-', async (repoRoot) => {
    const git = new FakeLifecycleGitService(repoRoot, [['node_modules/pkg/index.js']]);
    const npm = new FakeLifecycleNpmService();

    assert.throws(
      () =>
        runLifecycleUpdate({
          cwd: repoRoot,
          git,
          npm,
        }),
      /pumuki update blocked by repository safety checks/i
    );
    assert.equal(npm.calls.length, 0);
  });
});

test('runLifecycleUpdate usa --save-dev con target por defecto cuando pumuki no está declarado', async () => {
  await withTempDir('pumuki-update-default-target-', async (repoRoot) => {
    const packageName = getCurrentPumukiPackageName();
    mkdirSync(join(repoRoot, '.git'), { recursive: true });
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

    const git = new FakeLifecycleGitService(repoRoot, [[], []]);
    const npm = new FakeLifecycleNpmService();
    const result = runLifecycleUpdate({
      cwd: repoRoot,
      git,
      npm,
    });

    assert.equal(result.repoRoot, repoRoot);
    assert.equal(result.targetSpec, `${packageName}@latest`);
    assert.deepEqual(npm.calls[0]?.args, ['install', '--save-dev', '--save-exact', `${packageName}@latest`]);
    assert.equal(result.reinstallHooksChanged.length > 0, true);
    assert.equal(result.openSpecCompatibility.migratedLegacyPackage, false);
    assert.deepEqual(result.openSpecCompatibility.actions, []);
  });
});

test('runLifecycleUpdate usa dependencies y respeta targetSpec explícito', async () => {
  await withTempDir('pumuki-update-deps-', async (repoRoot) => {
    const packageName = getCurrentPumukiPackageName();
    mkdirSync(join(repoRoot, '.git'), { recursive: true });
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

    const git = new FakeLifecycleGitService(repoRoot, [[], []]);
    const npm = new FakeLifecycleNpmService();
    const result = runLifecycleUpdate({
      cwd: repoRoot,
      targetSpec: `  ${packageName}@next  `,
      git,
      npm,
    });

    assert.equal(result.targetSpec, `${packageName}@next`);
    assert.deepEqual(npm.calls[0]?.args, ['install', '--save-exact', `${packageName}@next`]);
    assert.equal(result.openSpecCompatibility.migratedLegacyPackage, false);
    assert.deepEqual(result.openSpecCompatibility.actions, []);
  });
});

test('runLifecycleUpdate ejecuta rollback si falla reinstall tras update', async () => {
  await withTempDir('pumuki-update-rollback-', async (repoRoot) => {
    const packageName = getCurrentPumukiPackageName();
    mkdirSync(join(repoRoot, '.git'), { recursive: true });
    writeFileSync(
      join(repoRoot, 'package.json'),
      JSON.stringify(
        {
          name: 'fixture',
          version: '1.0.0',
          devDependencies: {
            [packageName]: '6.3.11',
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const git = new FakeLifecycleGitService(repoRoot, [[], ['node_modules/unsafe/path.js']]);
    const npm = new FakeLifecycleNpmService();

    assert.throws(
      () =>
        runLifecycleUpdate({
          cwd: repoRoot,
          targetSpec: `${packageName}@next`,
          git,
          npm,
        }),
      /pumuki install blocked by repository safety checks/i
    );

    assert.equal(npm.calls.length, 2);
    assert.deepEqual(npm.calls[0]?.args, ['install', '--save-dev', '--save-exact', `${packageName}@next`]);
    assert.deepEqual(npm.calls[1]?.args, ['install', '--save-dev', '--save-exact', `${packageName}@6.3.11`]);
  });
});

test('runLifecycleUpdate migra openspec legacy en dependencies a @fission-ai/openspec', async () => {
  await withTempDir('pumuki-update-openspec-legacy-', async (repoRoot) => {
    const packageName = getCurrentPumukiPackageName();
    mkdirSync(join(repoRoot, '.git'), { recursive: true });
    writeFileSync(
      join(repoRoot, 'package.json'),
      JSON.stringify(
        {
          name: 'fixture',
          version: '1.0.0',
          dependencies: {
            [packageName]: '6.3.11',
            openspec: '^0.0.0',
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const git = new FakeLifecycleGitService(repoRoot, [[], []]);
    const npm = new FakeLifecycleNpmService();
    const result = runLifecycleUpdate({
      cwd: repoRoot,
      git,
      npm,
    });

    assert.equal(result.openSpecCompatibility.migratedLegacyPackage, true);
    assert.equal(result.openSpecCompatibility.migratedFrom, 'dependencies');
    assert.deepEqual(result.openSpecCompatibility.actions, [
      'npm-uninstall:openspec',
      'npm-install:@fission-ai/openspec@latest',
    ]);

    assert.deepEqual(npm.calls[0]?.args, ['install', '--save-exact', `${packageName}@latest`]);
    assert.deepEqual(npm.calls[1]?.args, ['uninstall', 'openspec']);
    assert.deepEqual(npm.calls[2]?.args, [
      'install',
      '--save-exact',
      '@fission-ai/openspec@latest',
    ]);
  });
});

test('runLifecycleUpdate no hace scaffold openspec durante reinstall de hooks (bootstrap desactivado)', async () => {
  await withTempDir('pumuki-update-no-bootstrap-scaffold-', async (repoRoot) => {
    const packageName = getCurrentPumukiPackageName();
    mkdirSync(join(repoRoot, '.git'), { recursive: true });
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

    const git = new FakeLifecycleGitService(repoRoot, [[], []]);
    const npm = new FakeLifecycleNpmService();
    const result = runLifecycleUpdate({
      cwd: repoRoot,
      git,
      npm,
    });

    assert.equal(result.reinstallHooksChanged.length > 0, true);
    assert.equal(result.openSpecCompatibility.migratedLegacyPackage, false);
    assert.equal(existsSync(join(repoRoot, 'openspec')), false);
  });
});
