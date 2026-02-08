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

test('legacy windsurf script names remain compatibility aliases to adapter scripts', () => {
  const scripts = loadScripts();

  assert.equal(
    scripts['validate:windsurf-hooks-local'],
    'npm run validate:adapter-hooks-local'
  );
  assert.equal(
    scripts['print:windsurf-hooks-config'],
    'npm run print:adapter-hooks-config'
  );
  assert.equal(
    scripts['install:windsurf-hooks-config'],
    'npm run install:adapter-hooks-config'
  );
  assert.equal(
    scripts['verify:windsurf-hooks-runtime'],
    'npm run verify:adapter-hooks-runtime'
  );
  assert.equal(
    scripts['assess:windsurf-hooks-session'],
    'npm run assess:adapter-hooks-session'
  );
  assert.equal(
    scripts['assess:windsurf-hooks-session:any'],
    'npm run assess:adapter-hooks-session:any'
  );
});
