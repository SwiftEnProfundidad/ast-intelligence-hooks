import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectSelfWorktreeHygieneFromStatus } from '../self-worktree-hygiene-lib';

test('inspectSelfWorktreeHygieneFromStatus no bloquea un worktree pequeno y acotado', () => {
  const report = inspectSelfWorktreeHygieneFromStatus({
    repoRoot: '/repo',
    statusOutput: ['M  integrations/git/stageRunners.ts', 'M  integrations/git/runPlatformGate.ts'].join('\n'),
    maxFiles: 10,
    maxScopes: 2,
  });

  assert.equal(report.blocked, false);
  assert.equal(report.changedFiles, 2);
  assert.equal(report.changedScopes, 1);
  assert.deepEqual(report.violations, []);
});

test('inspectSelfWorktreeHygieneFromStatus bloquea por demasiados scopes y sugiere slices accionables', () => {
  const report = inspectSelfWorktreeHygieneFromStatus({
    repoRoot: '/repo',
    statusOutput: [
      'M  docs/README.md',
      'M  integrations/git/stageRunners.ts',
      'M  scripts/watch-consumer-backlog.ts',
    ].join('\n'),
    maxFiles: 10,
    maxScopes: 2,
  });

  assert.equal(report.blocked, true);
  assert.equal(report.changedFiles, 3);
  assert.equal(report.changedScopes, 3);
  assert.equal(report.violations.length, 1);
  assert.equal(report.violations[0]?.code, 'SELF_WORKTREE_TOO_MANY_SCOPES');
  assert.match(report.violations[0]?.remediation ?? '', /Slices sugeridos:/i);
  assert.equal(report.slices.length, 3);
});

test('inspectSelfWorktreeHygieneFromStatus bloquea por demasiados archivos sin contar doble un MM', () => {
  const report = inspectSelfWorktreeHygieneFromStatus({
    repoRoot: '/repo',
    statusOutput: [
      'MM PUMUKI.md',
      'M  README.md',
      '?? scripts/check-self-worktree-hygiene.ts',
    ].join('\n'),
    maxFiles: 2,
    maxScopes: 10,
  });

  assert.equal(report.changedFiles, 3);
  assert.equal(report.changedScopes, 2);
  assert.equal(report.blocked, true);
  assert.equal(report.violations.length, 1);
  assert.equal(report.violations[0]?.code, 'SELF_WORKTREE_TOO_MANY_FILES');
});

test('inspectSelfWorktreeHygieneFromStatus normaliza renombres al path de destino', () => {
  const report = inspectSelfWorktreeHygieneFromStatus({
    repoRoot: '/repo',
    statusOutput: 'R  docs/OLD.md -> docs/product/NEW.md',
    maxFiles: 10,
    maxScopes: 10,
  });

  assert.equal(report.changedFiles, 1);
  assert.equal(report.changedScopes, 1);
  assert.equal(report.slices[0]?.scope, 'docs');
  assert.deepEqual(report.slices[0]?.files, ['docs/product/NEW.md']);
});
