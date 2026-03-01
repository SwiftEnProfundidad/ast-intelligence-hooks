import assert from 'node:assert/strict';
import { existsSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { PUMUKI_CONFIG_KEYS } from '../constants';
import type { ILifecycleGitService } from '../gitService';
import { installPumukiHooks } from '../hookManager';
import type { ILifecycleNpmService } from '../npmService';
import { getCurrentPumukiPackageName } from '../packageInfo';
import { runLifecycleRemove } from '../remove';
import { OPENSPEC_NPM_PACKAGE_NAME } from '../../sdd/openSpecCli';

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
  readonly isPathTrackedCalls: Array<{ cwd: string; path: string }> = [];
  readonly resolveRepoRootCalls: string[] = [];

  constructor(
    private readonly repoRoot: string,
    private readonly trackedPaths: ReadonlySet<string> = new Set(),
    private readonly localConfigValues: Readonly<Record<string, string | undefined>> = {}
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
    return [];
  }

  pathTracked(_cwd: string, path: string): boolean {
    this.isPathTrackedCalls.push({
      cwd: _cwd,
      path,
    });
    return this.trackedPaths.has(path);
  }

  applyLocalConfig(): void {}

  clearLocalConfig(cwd: string, key: string): void {
    this.unsetCalls.push({ cwd, key });
  }

  localConfig(_cwd: string, key: string): string | undefined {
    return this.localConfigValues[key];
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

test('runLifecycleRemove propaga purge de artefactos consultando tracking git', async () => {
  await withTempDir('pumuki-remove-purge-artifacts-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);
    writeFileSync(join(repoRoot, '.ai_evidence.json'), '{}\n', 'utf8');
    writeFileSync(
      join(repoRoot, 'package.json'),
      JSON.stringify(
        {
          name: 'fixture',
          version: '1.0.0',
        },
        null,
        2
      ),
      'utf8'
    );

    const git = new FakeLifecycleGitService(repoRoot, new Set(['.ai_evidence.json']));
    const npm = new FakeLifecycleNpmService();
    const result = runLifecycleRemove({
      cwd: repoRoot,
      git,
      npm,
    });

    assert.equal(result.packageRemoved, false);
    assert.deepEqual(result.removedArtifacts, []);
    assert.equal(existsSync(join(repoRoot, '.ai_evidence.json')), true);
    assert.equal(npm.calls.length, 0);
    assert.equal(git.isPathTrackedCalls.length >= 1, true);
    assert.equal(
      git.isPathTrackedCalls.some(
        (call) => call.cwd === repoRoot && call.path.toLowerCase() === '.ai_evidence.json'
      ),
      true
    );
  });
});

test('runLifecycleRemove usa process.cwd cuando no recibe cwd explícito', async () => {
  await withTempDir('pumuki-remove-default-cwd-', async (repoRoot) => {
    writeFileSync(
      join(repoRoot, 'package.json'),
      JSON.stringify(
        {
          name: 'fixture',
          version: '1.0.0',
        },
        null,
        2
      ),
      'utf8'
    );

    const git = new FakeLifecycleGitService(repoRoot);
    const npm = new FakeLifecycleNpmService();
    const defaultCwd = tmpdir();
    const result = withCwd(defaultCwd, () =>
      runLifecycleRemove({
        git,
        npm,
      })
    );

    assert.equal(result.repoRoot, repoRoot);
    assert.equal(git.resolveRepoRootCalls.length >= 1, true);
    assert.equal(realpathSync(git.resolveRepoRootCalls[0] ?? defaultCwd), realpathSync(defaultCwd));
  });
});

test('runLifecycleRemove desinstala openspec cuando fue bootstrap gestionado por pumuki', async () => {
  await withTempDir('pumuki-remove-managed-openspec-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);
    writeFileSync(join(repoRoot, '.ai_evidence.json'), '{}\n', 'utf8');
    writeFileSync(
      join(repoRoot, 'package.json'),
      JSON.stringify(
        {
          name: 'fixture',
          version: '1.0.0',
          devDependencies: {
            [OPENSPEC_NPM_PACKAGE_NAME]: '1.2.0',
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const git = new FakeLifecycleGitService(
      repoRoot,
      new Set(),
      {
        [PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts]:
          'openspec/project.md,openspec/changes/archive/.gitkeep,openspec/specs/.gitkeep',
      }
    );
    const npm = new FakeLifecycleNpmService();
    const result = runLifecycleRemove({
      cwd: repoRoot,
      git,
      npm,
    });

    assert.equal(result.packageRemoved, false);
    assert.equal(npm.calls.length, 1);
    assert.deepEqual(npm.calls[0]?.args, ['uninstall', OPENSPEC_NPM_PACKAGE_NAME]);
    assert.equal(npm.calls[0]?.cwd, repoRoot);
  });
});
