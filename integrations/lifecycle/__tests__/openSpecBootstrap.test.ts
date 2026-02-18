import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import type { ILifecycleNpmService } from '../npmService';
import {
  runOpenSpecBootstrap,
  runOpenSpecCompatibilityMigration,
} from '../openSpecBootstrap';

class FakeLifecycleNpmService implements ILifecycleNpmService {
  readonly calls: Array<{ args: ReadonlyArray<string>; cwd: string }> = [];

  runNpm(args: ReadonlyArray<string>, cwd: string): void {
    this.calls.push({ args, cwd });
  }
}

test('runOpenSpecBootstrap instala OpenSpec y scaffold de proyecto cuando falta todo', async () => {
  await withTempDir('pumuki-openspec-bootstrap-full-', async (repoRoot) => {
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

    const npm = new FakeLifecycleNpmService();
    const result = runOpenSpecBootstrap({
      repoRoot,
      npm,
    });

    assert.equal(npm.calls.length, 1);
    assert.deepEqual(npm.calls[0]?.args, [
      'install',
      '--save-dev',
      '--save-exact',
      '@fission-ai/openspec@latest',
    ]);
    assert.equal(npm.calls[0]?.cwd, repoRoot);

    assert.equal(result.projectInitialized, true);
    assert.equal(result.actions.includes('scaffold:openspec-project'), true);
    assert.equal(
      result.actions.includes('npm-install:@fission-ai/openspec@latest'),
      true
    );
    assert.deepEqual(result.managedArtifacts, [
      'openspec/project.md',
      'openspec/changes/archive/.gitkeep',
      'openspec/specs/.gitkeep',
    ]);

    assert.equal(existsSync(join(repoRoot, 'openspec', 'changes')), true);
    assert.equal(existsSync(join(repoRoot, 'openspec', 'changes', 'archive')), true);
    assert.equal(existsSync(join(repoRoot, 'openspec', 'specs')), true);
    assert.equal(existsSync(join(repoRoot, 'openspec', 'project.md')), true);
    assert.match(
      readFileSync(join(repoRoot, 'openspec', 'project.md'), 'utf8'),
      /bootstrapped by Pumuki/i
    );
  });
});

test('runOpenSpecBootstrap no instala npm sin package.json y deja traza de skip', async () => {
  await withTempDir('pumuki-openspec-bootstrap-no-pkg-', async (repoRoot) => {
    const npm = new FakeLifecycleNpmService();
    const result = runOpenSpecBootstrap({
      repoRoot,
      npm,
    });

    assert.equal(npm.calls.length, 0);
    assert.equal(result.packageInstalled, false);
    assert.equal(result.skippedReason, 'NO_PACKAGE_JSON');
    assert.equal(result.projectInitialized, true);
    assert.equal(result.actions.includes('scaffold:openspec-project'), true);
    assert.equal(existsSync(join(repoRoot, 'openspec', 'project.md')), true);
    assert.deepEqual(result.managedArtifacts, [
      'openspec/project.md',
      'openspec/changes/archive/.gitkeep',
      'openspec/specs/.gitkeep',
    ]);
  });
});

test('runOpenSpecCompatibilityMigration no hace nada cuando no hay openspec legacy', async () => {
  await withTempDir('pumuki-openspec-compat-noop-', async (repoRoot) => {
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
    const npm = new FakeLifecycleNpmService();
    const result = runOpenSpecCompatibilityMigration({
      repoRoot,
      npm,
    });

    assert.equal(result.migratedLegacyPackage, false);
    assert.deepEqual(result.actions, []);
    assert.equal(npm.calls.length, 0);
  });
});

test('runOpenSpecCompatibilityMigration migra openspec legacy en devDependencies', async () => {
  await withTempDir('pumuki-openspec-compat-devdeps-', async (repoRoot) => {
    writeFileSync(
      join(repoRoot, 'package.json'),
      JSON.stringify(
        {
          name: 'fixture',
          version: '1.0.0',
          devDependencies: {
            openspec: '^0.0.0',
          },
        },
        null,
        2
      ),
      'utf8'
    );
    const npm = new FakeLifecycleNpmService();
    const result = runOpenSpecCompatibilityMigration({
      repoRoot,
      npm,
    });

    assert.equal(result.migratedLegacyPackage, true);
    assert.equal(result.migratedFrom, 'devDependencies');
    assert.deepEqual(result.actions, [
      'npm-uninstall:openspec',
      'npm-install:@fission-ai/openspec@latest',
    ]);
    assert.deepEqual(npm.calls[0]?.args, ['uninstall', 'openspec']);
    assert.deepEqual(npm.calls[1]?.args, [
      'install',
      '--save-dev',
      '--save-exact',
      '@fission-ai/openspec@latest',
    ]);
  });
});
