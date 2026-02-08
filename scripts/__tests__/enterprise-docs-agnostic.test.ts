import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';

const PROVIDER_TERMS = [
  'windsurf',
  'cursor',
  'codeium',
  'vscode',
] as const;

const loadTrackedMarkdownFiles = (repoRoot: string): string[] => {
  const tracked = execFileSync('git', ['ls-files'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const activeDocs = tracked.filter((path) => {
    if (path === 'README.md') {
      return true;
    }
    if (!path.startsWith('docs/')) {
      return false;
    }
    if (!path.endsWith('.md')) {
      return false;
    }
    if (path.startsWith('docs/validation/')) {
      return false;
    }
    if (path.startsWith('docs/archive/')) {
      return false;
    }
    return true;
  });

  return activeDocs.sort();
};

test('active enterprise docs remain IDE/provider agnostic', () => {
  const repoRoot = resolve(__dirname, '..', '..');
  const files = loadTrackedMarkdownFiles(repoRoot);
  const violations: string[] = [];

  for (const file of files) {
    const content = readFileSync(join(repoRoot, file), 'utf8').toLowerCase();
    for (const term of PROVIDER_TERMS) {
      if (!content.includes(term)) {
        continue;
      }
      violations.push(`${file}: contains provider term "${term}"`);
    }
  }

  assert.deepEqual(violations, []);
});
