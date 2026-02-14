import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

type PackageJsonLike = {
  scripts?: Record<string, string>;
};

const loadScripts = (): Record<string, string> => {
  const packageJsonPath = resolve(__dirname, '..', '..', 'package.json');
  const parsed = JSON.parse(
    readFileSync(packageJsonPath, 'utf8')
  ) as PackageJsonLike;
  return parsed.scripts ?? {};
};

test('package scripts remain provider-agnostic', () => {
  const scripts = loadScripts();
  const providerScopedKeys = Object.keys(scripts).filter((key) =>
    key.toLowerCase().includes('windsurf')
  );

  assert.deepEqual(providerScopedKeys, []);
});
