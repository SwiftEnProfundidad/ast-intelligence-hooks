import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import type { IGitService } from '../GitService';
import { countScannedFilesFromFacts, resolveFactsForGateScope } from '../runPlatformGateFacts';

const DEFAULT_EXTENSIONS = ['.swift', '.ts', '.tsx', '.js', '.jsx', '.kt', '.kts'];

const buildGitStub = (params?: {
  runGit?: (args: ReadonlyArray<string>, cwd?: string) => string;
  getStagedFacts?: (extensions: ReadonlyArray<string>) => ReadonlyArray<Fact>;
  getRepoFacts?: (extensions: ReadonlyArray<string>) => ReadonlyArray<Fact>;
  getRepoAndStagedFacts?: (extensions: ReadonlyArray<string>) => ReadonlyArray<Fact>;
  getStagedAndUnstagedFacts?: (extensions: ReadonlyArray<string>) => ReadonlyArray<Fact>;
  resolveRepoRoot?: () => string;
}): IGitService => {
  return {
    runGit: params?.runGit ?? (() => ''),
    getStagedFacts: params?.getStagedFacts ?? (() => []),
    getRepoFacts: params?.getRepoFacts ?? (() => []),
    getRepoAndStagedFacts: params?.getRepoAndStagedFacts ?? (() => []),
    getStagedAndUnstagedFacts: params?.getStagedAndUnstagedFacts ?? (() => []),
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

test('resolveFactsForGateScope resuelve facts para scope repo', async () => {
  let capturedExtensions: ReadonlyArray<string> = [];
  const repoFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'src/domain/entity.ts',
      changeType: 'modified',
      source: 'git:repo:HEAD',
    },
  ];
  const git = buildGitStub({
    getRepoFacts: (extensions) => {
      capturedExtensions = extensions;
      return repoFacts;
    },
  });

  const result = await resolveFactsForGateScope({
    scope: { kind: 'repo' },
    git,
  });

  assert.deepEqual(capturedExtensions, DEFAULT_EXTENSIONS);
  assert.deepEqual(result, repoFacts);
});

test('resolveFactsForGateScope resuelve facts para scope repo+staged', async () => {
  let capturedExtensions: ReadonlyArray<string> = [];
  const repoAndStagedFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'src/app/useCase.ts',
      changeType: 'modified',
      source: 'git:repo+staged',
    },
  ];
  const git = buildGitStub({
    getRepoAndStagedFacts: (extensions) => {
      capturedExtensions = extensions;
      return repoAndStagedFacts;
    },
  });

  const result = await resolveFactsForGateScope({
    scope: { kind: 'repoAndStaged', extensions: ['.ts'] },
    git,
  });

  assert.deepEqual(capturedExtensions, ['.ts']);
  assert.deepEqual(result, repoAndStagedFacts);
});

test('resolveFactsForGateScope resuelve facts para scope staged+unstaged', async () => {
  let capturedExtensions: ReadonlyArray<string> = [];
  const workingTreeFacts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'src/ui/banner.tsx',
      changeType: 'modified',
      source: 'git:working-tree',
    },
  ];
  const git = buildGitStub({
    getStagedAndUnstagedFacts: (extensions) => {
      capturedExtensions = extensions;
      return workingTreeFacts;
    },
  });

  const result = await resolveFactsForGateScope({
    scope: { kind: 'workingTree' },
    git,
  });

  assert.deepEqual(capturedExtensions, DEFAULT_EXTENSIONS);
  assert.deepEqual(result, workingTreeFacts);
});

test('countScannedFilesFromFacts prioriza FileContent y deduplica paths', () => {
  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'src/a.ts',
      changeType: 'modified',
      source: 'git:repo:HEAD',
    },
    {
      kind: 'FileContent',
      path: 'src/a.ts',
      content: 'export const a = 1;',
      source: 'git:repo:HEAD',
    },
    {
      kind: 'FileContent',
      path: 'src/b.ts',
      content: 'export const b = 2;',
      source: 'git:repo:HEAD',
    },
    {
      kind: 'FileChange',
      path: 'src/b.ts',
      changeType: 'modified',
      source: 'git:repo:HEAD',
    },
  ];

  assert.equal(countScannedFilesFromFacts(facts), 2);
});

test('countScannedFilesFromFacts usa FileChange cuando no hay FileContent', () => {
  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'FileChange',
      path: 'src/a.ts',
      changeType: 'modified',
      source: 'git:range:origin/main..HEAD',
    },
    {
      kind: 'FileChange',
      path: 'src/a.ts',
      changeType: 'deleted',
      source: 'git:range:origin/main..HEAD',
    },
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ts.console-log.ast',
      severity: 'WARN',
      code: 'TS_CONSOLE_LOG',
      message: 'Avoid console.log',
      filePath: 'src/a.ts',
      source: 'heuristics:ast',
    },
  ];

  assert.equal(countScannedFilesFromFacts(facts), 1);
});
