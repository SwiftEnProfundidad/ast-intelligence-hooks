import assert from 'node:assert/strict';
import test from 'node:test';
import type { IGitService } from '../GitService';
import { collectFileChurnOwnership } from '../collectFileChurnOwnership';

type GitStubCommand = {
  args: ReadonlyArray<string>;
  cwd?: string;
};

const createGitStub = (params: {
  expectedSinceDays: number;
  logOutput: string;
  repoRoot?: string;
}): { git: IGitService; commands: GitStubCommand[] } => {
  const commands: GitStubCommand[] = [];
  const repoRoot = params.repoRoot ?? '/repo';
  const expectedCommand = [
    'log',
    '--no-merges',
    '--numstat',
    '--date=iso-strict',
    '--pretty=format:__PUMUKI_COMMIT__%n%H|%aN|%aE|%aI',
    `--since=${params.expectedSinceDays}.days`,
  ].join(' ');

  const git: IGitService = {
    runGit: (args: ReadonlyArray<string>, cwd?: string): string => {
      commands.push({ args, cwd });
      const command = args.join(' ');
      if (command === expectedCommand) {
        return params.logOutput;
      }
      throw new Error(`comando git no esperado: ${command}`);
    },
    getStagedFacts: () => [],
    getRepoFacts: () => [],
    getRepoAndStagedFacts: () => [],
    getStagedAndUnstagedFacts: () => [],
    resolveRepoRoot: () => repoRoot,
  };

  return { git, commands };
};

test('collectFileChurnOwnership agrega churn y autoria por fichero usando ventana temporal configurable', () => {
  const { git, commands } = createGitStub({
    expectedSinceDays: 30,
    logOutput: [
      '__PUMUKI_COMMIT__',
      'a1|Alice|alice@example.com|2026-02-24T12:00:00+00:00',
      '10\t2\tsrc/a.ts',
      '3\t1\tsrc/b.ts',
      '__PUMUKI_COMMIT__',
      'a2|Bob|bob@example.com|2026-02-23T10:00:00+00:00',
      '5\t0\tsrc/a.ts',
      '-\t-\tassets/logo.png',
      '',
    ].join('\n'),
  });

  const result = collectFileChurnOwnership({
    git,
    sinceDays: 30,
  });

  assert.deepEqual(result, [
    {
      path: 'src/a.ts',
      commits: 2,
      distinctAuthors: 2,
      churnAddedLines: 15,
      churnDeletedLines: 2,
      churnTotalLines: 17,
      lastTouchedAt: '2026-02-24T12:00:00+00:00',
    },
    {
      path: 'src/b.ts',
      commits: 1,
      distinctAuthors: 1,
      churnAddedLines: 3,
      churnDeletedLines: 1,
      churnTotalLines: 4,
      lastTouchedAt: '2026-02-24T12:00:00+00:00',
    },
    {
      path: 'assets/logo.png',
      commits: 1,
      distinctAuthors: 1,
      churnAddedLines: 0,
      churnDeletedLines: 0,
      churnTotalLines: 0,
      lastTouchedAt: '2026-02-23T10:00:00+00:00',
    },
  ]);
  assert.deepEqual(commands, [
    {
      args: [
        'log',
        '--no-merges',
        '--numstat',
        '--date=iso-strict',
        '--pretty=format:__PUMUKI_COMMIT__%n%H|%aN|%aE|%aI',
        '--since=30.days',
      ],
      cwd: '/repo',
    },
  ]);
});

test('collectFileChurnOwnership normaliza paths de rename y filtra por extensiones cuando aplica', () => {
  const { git } = createGitStub({
    expectedSinceDays: 14,
    logOutput: [
      '__PUMUKI_COMMIT__',
      'a3|Alice|alice@example.com|2026-02-25T10:00:00+00:00',
      '4\t3\tsrc/{old-name.ts => new-name.ts}',
      '7\t1\tlegacy.ts => current.ts',
      '2\t2\tdocs/readme.md',
      '',
    ].join('\n'),
  });

  const result = collectFileChurnOwnership({
    git,
    sinceDays: 14,
    extensions: ['.ts'],
  });

  assert.deepEqual(result, [
    {
      path: 'current.ts',
      commits: 1,
      distinctAuthors: 1,
      churnAddedLines: 7,
      churnDeletedLines: 1,
      churnTotalLines: 8,
      lastTouchedAt: '2026-02-25T10:00:00+00:00',
    },
    {
      path: 'src/new-name.ts',
      commits: 1,
      distinctAuthors: 1,
      churnAddedLines: 4,
      churnDeletedLines: 3,
      churnTotalLines: 7,
      lastTouchedAt: '2026-02-25T10:00:00+00:00',
    },
  ]);
});

test('collectFileChurnOwnership usa ventana por defecto de 90 dias', () => {
  const { git, commands } = createGitStub({
    expectedSinceDays: 90,
    logOutput: '',
  });

  const result = collectFileChurnOwnership({ git });

  assert.deepEqual(result, []);
  assert.equal(commands.length, 1);
  assert.deepEqual(commands[0]?.args, [
    'log',
    '--no-merges',
    '--numstat',
    '--date=iso-strict',
    '--pretty=format:__PUMUKI_COMMIT__%n%H|%aN|%aE|%aI',
    '--since=90.days',
  ]);
});

test('collectFileChurnOwnership falla cuando sinceDays no es entero positivo', () => {
  const { git } = createGitStub({
    expectedSinceDays: 90,
    logOutput: '',
  });

  assert.throws(
    () =>
      collectFileChurnOwnership({
        git,
        sinceDays: 0,
      }),
    /sinceDays must be a positive integer/i
  );
});
