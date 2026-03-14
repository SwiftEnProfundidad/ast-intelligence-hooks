import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseGitflowAheadBehind,
  parseGitflowStatusShort,
} from '../gitflow-cli-snapshot';

test('parseGitflowAheadBehind normaliza ausencia o ruido a cero', () => {
  assert.deepEqual(parseGitflowAheadBehind(undefined), { ahead: 0, behind: 0 });
  assert.deepEqual(parseGitflowAheadBehind('foo bar'), { ahead: 0, behind: 0 });
  assert.deepEqual(parseGitflowAheadBehind('-3 2'), { ahead: 2, behind: 0 });
});

test('parseGitflowAheadBehind interpreta el formato left-right count de git', () => {
  assert.deepEqual(parseGitflowAheadBehind('4 7'), { ahead: 7, behind: 4 });
});

test('parseGitflowStatusShort resume staged, unstaged y dirty desde git status short', () => {
  const parsed = parseGitflowStatusShort(['MM foo.ts', ' M bar.ts', 'M  baz.ts', '?? scratch.txt'].join('\n'));

  assert.deepEqual(parsed, {
    dirty: true,
    staged: 2,
    unstaged: 3,
  });
});

test('parseGitflowStatusShort deja el worktree limpio cuando no hay lineas', () => {
  assert.deepEqual(parseGitflowStatusShort(''), {
    dirty: false,
    staged: 0,
    unstaged: 0,
  });
});
