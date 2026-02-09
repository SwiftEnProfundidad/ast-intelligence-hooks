import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();

const read = (relativePath: string): string => {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
};

const lines = (relativePath: string): number => {
  const bytes = statSync(join(repoRoot, relativePath)).size;
  if (bytes === 0) {
    return 0;
  }

  return read(relativePath).split('\n').length;
};

test('framework menu modules keep SRP-oriented size contracts', () => {
  const limits: ReadonlyArray<{ path: string; maxLines: number }> = [
    { path: 'scripts/framework-menu.ts', maxLines: 180 },
    { path: 'scripts/framework-menu-actions.ts', maxLines: 280 },
    { path: 'scripts/framework-menu-builders.ts', maxLines: 320 },
    { path: 'scripts/framework-menu-runners.ts', maxLines: 90 },
    { path: 'scripts/framework-menu-prompts.ts', maxLines: 90 },
  ];

  const violations = limits
    .map((entry) => ({ ...entry, actualLines: lines(entry.path) }))
    .filter((entry) => entry.actualLines > entry.maxLines)
    .map((entry) => `${entry.path} => ${entry.actualLines} lines (max ${entry.maxLines})`);

  assert.deepEqual(violations, []);
});

test('framework menu process execution stays isolated in runner common module', () => {
  const shouldNotExecuteProcesses = [
    'scripts/framework-menu.ts',
    'scripts/framework-menu-actions.ts',
    'scripts/framework-menu-builders.ts',
    'scripts/framework-menu-prompts.ts',
    'scripts/framework-menu-prompts-adapter.ts',
    'scripts/framework-menu-prompts-consumer.ts',
    'scripts/framework-menu-prompts-phase5.ts',
    'scripts/framework-menu-prompt-types.ts',
  ];

  const offenders = shouldNotExecuteProcesses.filter((path) => {
    return read(path).includes('execFileSync(');
  });

  assert.deepEqual(offenders, []);
});

test('framework menu interactive input stays isolated in prompt modules', () => {
  const menuQuestionMatches = read('scripts/framework-menu.ts').match(/\.question\(/g) ?? [];
  assert.equal(menuQuestionMatches.length, 1);

  const shouldNotAskQuestions = [
    'scripts/framework-menu-actions.ts',
    'scripts/framework-menu-runners.ts',
    'scripts/framework-menu-runners-adapter.ts',
    'scripts/framework-menu-runners-consumer.ts',
    'scripts/framework-menu-runners-phase5.ts',
    'scripts/framework-menu-runners-validation.ts',
    'scripts/framework-menu-runner-common.ts',
    'scripts/framework-menu-builders.ts',
  ];

  const offenders = shouldNotAskQuestions.filter((path) => {
    return read(path).includes('.question(');
  });

  assert.deepEqual(offenders, []);
});
