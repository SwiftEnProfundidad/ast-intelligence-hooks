import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';

const DOC_INDEX_FILES = [
  'docs/README.md',
  'docs/validation/README.md',
  'docs/rule-packs/README.md',
] as const;

const ROOT_DOC_POINTERS = [
  'README.md',
  'ARCHITECTURE.md',
  'CHANGELOG.md',
  'AGENTS.md',
  'CLAUDE.md',
  'PUMUKI.md',
] as const;

const EXCLUDED_PATH_PREFIXES = [
  'docs/validation/archive/',
] as const;

const loadTrackedMarkdownDocs = (repoRoot: string): string[] => {
  const tracked = execFileSync('git', ['ls-files'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return tracked
    .filter((path) => path.startsWith('docs/') && path.endsWith('.md'))
    .filter((path) => !DOC_INDEX_FILES.includes(path as (typeof DOC_INDEX_FILES)[number]))
    .filter(
      (path) =>
        !EXCLUDED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))
    )
    .sort();
};

const isIndexed = (path: string, indexText: string): boolean => {
  const relFromDocs = path.replace(/^docs\//, '');
  const fileName = path.split('/').at(-1) ?? path;
  return (
    indexText.includes(`\`${path}\``) ||
    indexText.includes(`\`${relFromDocs}\``) ||
    indexText.includes(`\`${fileName}\``)
  );
};

test('all active docs markdown files are referenced by official documentation indexes', () => {
  const repoRoot = resolve(__dirname, '..', '..');
  const docsFiles = loadTrackedMarkdownDocs(repoRoot);
  const indexText = DOC_INDEX_FILES.map((path) =>
    readFileSync(join(repoRoot, path), 'utf8')
  ).join('\n');

  const missing = docsFiles.filter((path) => !isIndexed(path, indexText));
  assert.deepEqual(missing, []);
});

test('docs index references canonical root-level governance docs', () => {
  const repoRoot = resolve(__dirname, '..', '..');
  const indexText = readFileSync(join(repoRoot, 'docs/README.md'), 'utf8');
  const missing = ROOT_DOC_POINTERS.filter((path) => !indexText.includes(`\`${path}\``));
  assert.deepEqual(missing, []);
});
