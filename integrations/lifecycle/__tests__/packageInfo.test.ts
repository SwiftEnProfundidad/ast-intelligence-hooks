import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { getCurrentPumukiPackageName, getCurrentPumukiVersion } from '../packageInfo';

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
