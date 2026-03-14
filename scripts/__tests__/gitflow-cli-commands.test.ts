import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGitflowUsage,
  isGitflowCommand,
  runGitflowCommand,
} from '../gitflow-cli-commands';
import type { GitflowSnapshot } from '../gitflow-cli-types';

const createSnapshot = (overrides?: Partial<GitflowSnapshot>): GitflowSnapshot => {
  return {
    available: true,
    branch: 'feature/pumuki-gitflow',
    upstream: 'origin/feature/pumuki-gitflow',
    ahead: 0,
    behind: 0,
    dirty: false,
    staged: 0,
    unstaged: 0,
    ...overrides,
  };
};

test('isGitflowCommand reconoce el contrato visible de comandos', () => {
  assert.equal(isGitflowCommand('check'), true);
  assert.equal(isGitflowCommand('status'), true);
  assert.equal(isGitflowCommand('workflow'), true);
  assert.equal(isGitflowCommand('reset'), true);
  assert.equal(isGitflowCommand('invalid'), false);
  assert.equal(isGitflowCommand(undefined), false);
});

test('buildGitflowUsage enumera comandos soportados', () => {
  const usage = buildGitflowUsage().join('\n');

  assert.match(usage, /usage:\s*gitflow <check\|status\|workflow\|reset>/i);
  assert.match(usage, /check\s+validate git-flow guardrails/i);
  assert.match(usage, /workflow\s+print recommended next steps/i);
});

test('runGitflowCommand workflow en rama protegida añade recomendaciones accionables', () => {
  const outcome = runGitflowCommand(
    'workflow',
    createSnapshot({
      branch: 'main',
      upstream: null,
      dirty: true,
      staged: 2,
      unstaged: 1,
    })
  );

  const output = outcome.lines.join('\n');

  assert.equal(outcome.exitCode, 0);
  assert.match(output, /rama protegida detectada \(main\)/i);
  assert.match(output, /git checkout -b feature\//i);
  assert.match(output, /git push --set-upstream origin <branch>/i);
  assert.match(output, /worktree sucio: agrupa cambios y usa commits atomicos/i);
});

test('runGitflowCommand check bloquea si no hay repositorio git disponible', () => {
  const outcome = runGitflowCommand(
    'check',
    createSnapshot({
      available: false,
      branch: null,
      upstream: null,
    })
  );

  assert.equal(outcome.exitCode, 1);
  assert.deepEqual(outcome.lines.slice(0, 3), [
    'GITFLOW CHECK',
    'status: BLOCK',
    'reason: current directory is not a git repository',
  ]);
});

test('runGitflowCommand reset mantiene contrato no destructivo', () => {
  const outcome = runGitflowCommand('reset', createSnapshot());

  assert.equal(outcome.exitCode, 0);
  assert.match(outcome.lines.join('\n'), /mode:\s*non-destructive/i);
  assert.match(outcome.lines.join('\n'), /No automatic git reset is performed/i);
});
