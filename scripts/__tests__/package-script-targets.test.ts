import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

type PackageJsonLike = {
  scripts?: Record<string, string>;
};

type MissingScriptTarget = {
  name: string;
  command: string;
  target: string;
};

const loadScripts = (): Record<string, string> => {
  const packageJsonPath = resolve(process.cwd(), 'package.json');
  const parsed = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJsonLike;
  return parsed.scripts ?? {};
};

const resolveLocalTarget = (command: string): string | null => {
  const match = command.match(/^(node|bash)\s+([^\s]+)/);
  if (!match) {
    return null;
  }
  const target = match[2]?.trim();
  if (!target || target.startsWith('-')) {
    return null;
  }
  return target;
};

const findMissingTargets = (scripts: Record<string, string>): ReadonlyArray<MissingScriptTarget> => {
  const missing: MissingScriptTarget[] = [];
  for (const [name, command] of Object.entries(scripts)) {
    const target = resolveLocalTarget(command);
    if (!target) {
      continue;
    }
    const absoluteTargetPath = resolve(process.cwd(), target);
    if (!existsSync(absoluteTargetPath)) {
      missing.push({ name, command, target });
    }
  }
  return missing;
};

test('package scripts no referencian rutas locales inexistentes', () => {
  const scripts = loadScripts();
  const missingTargets = findMissingTargets(scripts);
  assert.deepEqual(missingTargets, []);
});
