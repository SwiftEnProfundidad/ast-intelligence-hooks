import assert from 'node:assert/strict';
import test from 'node:test';
import { collectWorktreeAtomicSlices } from '../worktreeAtomicSlices';

const createGitStub = (statusOutput: string) => ({
  runGit(args: ReadonlyArray<string>): string {
    assert.deepEqual(args, ['status', '--short', '--untracked-files=all']);
    return statusOutput;
  },
});

test('collectWorktreeAtomicSlices agrupa por scope y genera comandos de staging', () => {
  const plan = collectWorktreeAtomicSlices({
    repoRoot: '/tmp/repo',
    maxSlices: 3,
    maxFilesPerSlice: 3,
    git: createGitStub([
      ' M apps/backend/src/service.ts',
      ' M apps/backend/src/controller.ts',
      ' M apps/backend/src/dto.ts',
      ' M apps/ios/App/Feature.swift',
      '?? docs/notes.md',
      'R  old/name.ts -> apps/backend/src/renamed.ts',
    ].join('\n')) as never,
  });

  assert.equal(plan.total_files, 6);
  assert.equal(plan.slices.length, 3);
  assert.equal(plan.slices[0]?.scope, 'apps/backend');
  assert.equal(plan.slices[0]?.files.length, 3);
  assert.equal(plan.slices[0]?.staged_command.startsWith('git add -- '), true);
  assert.equal(plan.slices.some((slice) => slice.scope === 'apps/ios'), true);
  assert.equal(plan.slices.some((slice) => slice.scope === 'docs'), true);
});

test('collectWorktreeAtomicSlices devuelve plan vacío cuando no hay cambios', () => {
  const plan = collectWorktreeAtomicSlices({
    repoRoot: '/tmp/repo',
    git: createGitStub('') as never,
  });
  assert.equal(plan.total_files, 0);
  assert.deepEqual(plan.slices, []);
});
