import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import type { IGitService } from '../GitService';
import { resolveFactsForGateScope } from '../runPlatformGateFacts';

const DEFAULT_EXTENSIONS = ['.swift', '.ts', '.tsx', '.js', '.jsx', '.kt', '.kts'];

const buildGitStub = (params?: {
  runGit?: (args: ReadonlyArray<string>, cwd?: string) => string;
  getStagedFacts?: (extensions: ReadonlyArray<string>) => ReadonlyArray<Fact>;
  resolveRepoRoot?: () => string;
}): IGitService => {
  return {
    runGit: params?.runGit ?? (() => ''),
    getStagedFacts: params?.getStagedFacts ?? (() => []),
    resolveRepoRoot: params?.resolveRepoRoot ?? (() => process.cwd()),
  };
};

test('resolveFactsForGateScope usa extensiones por defecto en scope staged', async () => {
  let capturedExtensions: ReadonlyArray<string> = [];
  const stagedFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'src/a.ts',
      changeType: 'modified',
      source: 'git:staged',
    },
  ];
  const git = buildGitStub({
    getStagedFacts: (extensions) => {
      capturedExtensions = extensions;
      return stagedFacts;
    },
  });

  const result = await resolveFactsForGateScope({
    scope: { kind: 'staged' },
    git,
  });

  assert.deepEqual(capturedExtensions, DEFAULT_EXTENSIONS);
  assert.deepEqual(result, stagedFacts);
});

test('resolveFactsForGateScope respeta extensiones custom en scope staged', async () => {
  let capturedExtensions: ReadonlyArray<string> = [];
  const git = buildGitStub({
    getStagedFacts: (extensions) => {
      capturedExtensions = extensions;
      return [];
    },
  });

  await resolveFactsForGateScope({
    scope: { kind: 'staged', extensions: ['.ts'] },
    git,
  });

  assert.deepEqual(capturedExtensions, ['.ts']);
});

test('resolveFactsForGateScope resuelve facts para scope range', async () => {
  const runGitCalls: Array<string> = [];
  const git = buildGitStub({
    getStagedFacts: () => {
      throw new Error('getStagedFacts no debe usarse en scope range');
    },
    runGit: (args) => {
      runGitCalls.push(args.join(' '));
      if (args[0] === 'diff') {
        return ['A\tsrc/a.ts', 'M\tsrc/ignored.swift', 'D\tsrc/deleted.ts'].join('\n');
      }
      if (args[0] === 'show') {
        if (args[1] === 'HEAD:src/a.ts') {
          return 'const a = 1;';
        }
        throw new Error(`show no esperado: ${args[1]}`);
      }
      throw new Error(`comando git no esperado: ${args.join(' ')}`);
    },
  });

  const result = await resolveFactsForGateScope({
    scope: {
      kind: 'range',
      fromRef: 'main',
      toRef: 'HEAD',
      extensions: ['.ts'],
    },
    git,
  });

  assert.deepEqual(result, [
    {
      kind: 'FileChange',
      path: 'src/a.ts',
      changeType: 'added',
      source: 'git:range:main..HEAD',
    },
    {
      kind: 'FileContent',
      path: 'src/a.ts',
      content: 'const a = 1;',
      source: 'git:range:main..HEAD',
    },
    {
      kind: 'FileChange',
      path: 'src/deleted.ts',
      changeType: 'deleted',
      source: 'git:range:main..HEAD',
    },
  ]);
  assert.deepEqual(runGitCalls, [
    'diff --name-status main..HEAD',
    'show HEAD:src/a.ts',
  ]);
});
