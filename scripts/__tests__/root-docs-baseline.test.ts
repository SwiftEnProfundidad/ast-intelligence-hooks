import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

const ROOT_MARKDOWN_BASELINE = [
  'AGENTS.md',
  'ARCHITECTURE.md',
  'CHANGELOG.md',
  'CLAUDE.md',
  'PUMUKI.md',
  'README.md',
] as const;

const loadTrackedRootMarkdownFiles = (): string[] => {
  const tracked = execFileSync('git', ['ls-files'], {
    encoding: 'utf8',
  })
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return tracked
    .filter((path) => path.endsWith('.md'))
    .filter((path) => !path.includes('/'))
    .sort();
};

test('repository root markdown files match canonical enterprise baseline', () => {
  const actual = loadTrackedRootMarkdownFiles();
  const expected = [...ROOT_MARKDOWN_BASELINE].sort();
  assert.deepEqual(actual, expected);
});
