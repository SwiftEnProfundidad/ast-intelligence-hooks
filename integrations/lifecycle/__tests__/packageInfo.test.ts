import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import {
  getCurrentPumukiPackageName,
  getCurrentPumukiVersion,
  resolvePumukiVersionMetadata,
} from '../packageInfo';

test('getCurrentPumukiPackageName devuelve el nombre real del package', () => {
  const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
    name?: string;
  };

  assert.equal(typeof packageJson.name, 'string');
  assert.equal(getCurrentPumukiPackageName(), packageJson.name);
  assert.match(getCurrentPumukiPackageName(), /^[a-z0-9][a-z0-9-]*$/);
});

test('getCurrentPumukiVersion devuelve versión semver del package actual', () => {
  const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
    version?: string;
  };

  assert.equal(typeof packageJson.version, 'string');
  assert.equal(getCurrentPumukiVersion(), packageJson.version);
  assert.match(getCurrentPumukiVersion(), /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
});

test('packageInfo expone valores deterministas en llamadas repetidas', () => {
  const firstName = getCurrentPumukiPackageName();
  const secondName = getCurrentPumukiPackageName();
  const firstVersion = getCurrentPumukiVersion();
  const secondVersion = getCurrentPumukiVersion();

  assert.equal(firstName, secondName);
  assert.equal(firstVersion, secondVersion);
});

test('packageInfo devuelve nombre y versión no vacíos ni con espacios laterales', () => {
  const packageName = getCurrentPumukiPackageName();
  const packageVersion = getCurrentPumukiVersion();

  assert.equal(packageName.trim(), packageName);
  assert.equal(packageVersion.trim(), packageVersion);
  assert.ok(packageName.length > 0);
  assert.ok(packageVersion.length > 0);
});

test('getCurrentPumukiVersion prioriza versión instalada en node_modules del repo consumidor', async () => {
  await withTempDir('pumuki-package-info-', async (repoRoot) => {
    const packageRoot = join(repoRoot, 'node_modules', getCurrentPumukiPackageName());
    mkdirSync(packageRoot, { recursive: true });
    writeFileSync(
      join(packageRoot, 'package.json'),
      JSON.stringify({ name: getCurrentPumukiPackageName(), version: '9.9.9' }, null, 2),
      'utf8'
    );

    assert.equal(getCurrentPumukiVersion({ repoRoot }), '9.9.9');
  });
});

test('getCurrentPumukiVersion usa fallback al versionado runtime si no hay instalación local', async () => {
  await withTempDir('pumuki-package-info-fallback-', async (repoRoot) => {
    assert.equal(getCurrentPumukiVersion({ repoRoot }), getCurrentPumukiVersion());
  });
});

test('resolvePumukiVersionMetadata expone source/runtime/install de forma explícita', async () => {
  await withTempDir('pumuki-package-info-meta-', async (repoRoot) => {
    const fallback = resolvePumukiVersionMetadata({ repoRoot });
    assert.equal(fallback.source, 'runtime-package');
    assert.equal(fallback.consumerInstalledVersion, null);
    assert.equal(fallback.runtimeVersion, getCurrentPumukiVersion());
    assert.equal(fallback.resolvedVersion, fallback.runtimeVersion);

    const packageRoot = join(repoRoot, 'node_modules', getCurrentPumukiPackageName());
    mkdirSync(packageRoot, { recursive: true });
    writeFileSync(
      join(packageRoot, 'package.json'),
      JSON.stringify({ name: getCurrentPumukiPackageName(), version: '8.8.8' }, null, 2),
      'utf8'
    );

    const installed = resolvePumukiVersionMetadata({ repoRoot });
    assert.equal(installed.source, 'consumer-node-modules');
    assert.equal(installed.consumerInstalledVersion, '8.8.8');
    assert.equal(installed.runtimeVersion, fallback.runtimeVersion);
    assert.equal(installed.resolvedVersion, '8.8.8');
  });
});
