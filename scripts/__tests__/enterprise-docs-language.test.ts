import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';

const DISALLOWED_SPANISH_TOKENS = [
  'objetivo',
  'contexto',
  'reglas',
  'tarea',
  'pendiente',
  'pendientes',
  'siguiente paso',
] as const;

const loadTrackedActiveMarkdownFiles = (repoRoot: string): string[] => {
  const tracked = execFileSync('git', ['ls-files'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return tracked
    .filter((path) => {
      if (path === 'README.md') {
        return true;
      }
      if (!path.startsWith('docs/') || !path.endsWith('.md')) {
        return false;
      }
      if (path.startsWith('docs/validation/')) {
        return false;
      }
      if (path.startsWith('docs/archive/')) {
        return false;
      }
      return true;
    })
    .sort();
};

test('active enterprise docs remain English-only', () => {
  const repoRoot = resolve(__dirname, '..', '..');
  const files = loadTrackedActiveMarkdownFiles(repoRoot);
  const violations: string[] = [];

  for (const file of files) {
    const content = readFileSync(join(repoRoot, file), 'utf8').toLowerCase();

    if (content.includes('¿') || content.includes('¡')) {
      violations.push(`${file}: contains Spanish punctuation`);
    }

    for (const token of DISALLOWED_SPANISH_TOKENS) {
      if (content.includes(token)) {
        violations.push(`${file}: contains Spanish token "${token}"`);
      }
    }
  }

  assert.deepEqual(violations, []);
});
