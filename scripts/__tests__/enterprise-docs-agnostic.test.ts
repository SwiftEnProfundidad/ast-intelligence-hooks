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

const ROOT_ACTIVE_DOCS = new Set([
  'README.md',
  'ARCHITECTURE.md',
  'CHANGELOG.md',
  'CLAUDE.md',
]);

const markdownCodeSpanPattern = /`[^`\n]+`/g;

const loadTrackedMarkdownFiles = (repoRoot: string): string[] => {
  const tracked = execFileSync('git', ['ls-files'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const activeDocs = tracked.filter((path) => {
    if (ROOT_ACTIVE_DOCS.has(path)) {
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
    if (path.startsWith('docs/codex-skills/')) {
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
    const content = readFileSync(join(repoRoot, file), 'utf8')
      .replace(markdownCodeSpanPattern, '')
      .toLowerCase();
    for (const term of PROVIDER_TERMS) {
      if (!content.includes(term)) {
        continue;
      }
      violations.push(`${file}: contains provider term "${term}"`);
    }
  }

  assert.deepEqual(violations, []);
});
