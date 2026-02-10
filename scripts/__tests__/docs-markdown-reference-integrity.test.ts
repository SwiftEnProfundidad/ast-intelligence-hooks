import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

const markdownReferencePattern = /`([^`\n]+\.md(?:#[^`\n]+)?)`/g;

const ROOT_ACTIVE_DOCS = new Set([
  'README.md',
  'ARCHITECTURE.md',
  'CHANGELOG.md',
  'CLAUDE.md',
]);

const loadTrackedMarkdownFiles = (repoRoot: string): string[] => {
  return execFileSync('git', ['ls-files'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .map((line) => line.trim())
    .filter((path) => {
      if (ROOT_ACTIVE_DOCS.has(path)) {
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

const isIgnoredReference = (value: string): boolean => {
  const normalized = value.toLowerCase();
  return (
    normalized.includes(' ') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('file://') ||
    normalized.startsWith('.')
  );
};

const toAbsoluteMarkdownPath = (params: {
  repoRoot: string;
  sourcePath: string;
  reference: string;
}): string => {
  const withoutAnchor = params.reference.split('#')[0];

  if (withoutAnchor.startsWith('/')) {
    return withoutAnchor;
  }

  if (withoutAnchor.startsWith('docs/') || withoutAnchor === 'README.md') {
    return resolve(params.repoRoot, withoutAnchor);
  }

  const repoRootCandidate = resolve(params.repoRoot, withoutAnchor);
  if (existsSync(repoRootCandidate)) {
    return repoRootCandidate;
  }

  return resolve(params.repoRoot, dirname(params.sourcePath), withoutAnchor);
};

test('tracked markdown files keep local markdown references valid', () => {
  const repoRoot = resolve(__dirname, '..', '..');
  const files = loadTrackedMarkdownFiles(repoRoot);
  const violations: string[] = [];

  for (const file of files) {
    const content = readFileSync(join(repoRoot, file), 'utf8');
    for (const match of content.matchAll(markdownReferencePattern)) {
      const reference = (match[1] ?? '').trim();
      if (!reference || isIgnoredReference(reference)) {
        continue;
      }

      const absolutePath = toAbsoluteMarkdownPath({
        repoRoot,
        sourcePath: file,
        reference,
      });

      if (!existsSync(absolutePath)) {
        violations.push(`${file}: missing markdown reference \`${reference}\``);
      }
    }
  }

  assert.deepEqual(violations, []);
});
