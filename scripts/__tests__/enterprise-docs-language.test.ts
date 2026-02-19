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

const ROOT_ACTIVE_DOCS = new Set([
  'README.md',
  'ARCHITECTURE.md',
  'CHANGELOG.md',
  'CLAUDE.md',
]);

const NON_ENGLISH_ALLOWED_DOCS = new Set([
  'docs/REFRACTOR_PROGRESS.md',
  'docs/PUMUKI_FULL_VALIDATION_CHECKLIST.md',
  'docs/PUMUKI_OPENSPEC_SDD_ROADMAP.md',
  'docs/PUMUKI_CYCLE_02_ENTERPRISE_VALIDATION.md',
  'docs/PUMUKI_CYCLE_03_SDD_ACTIVE_VALIDATION.md',
  'docs/PUMUKI_CYCLE_04_GAP_HARDENING.md',
  'docs/PUMUKI_CYCLE_05_ENTERPRISE_OPERATIONS.md',
]);

const markdownCodeSpanPattern = /`[^`\n]+`/g;

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
      if (path.startsWith('docs/codex-skills/')) {
        return false;
      }
      if (NON_ENGLISH_ALLOWED_DOCS.has(path)) {
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
    const content = readFileSync(join(repoRoot, file), 'utf8')
      .replace(markdownCodeSpanPattern, '')
      .toLowerCase();

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
