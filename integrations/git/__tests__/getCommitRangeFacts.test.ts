import assert from 'node:assert/strict';
import test from 'node:test';
import type { IGitService } from '../GitService';
import { getFactsForCommitRange } from '../getCommitRangeFacts';

test('getFactsForCommitRange filtra por extension y construye facts con source de rango', async () => {
  const calls: string[] = [];
  const git: IGitService = {
    runGit: (args: ReadonlyArray<string>): string => {
      const command = args.join(' ');
      calls.push(command);
      if (command === 'diff --name-status main..HEAD') {
        return [
          'A\tsrc/a.ts',
          'M\tsrc/ignored.swift',
          'D\tsrc/c.ts',
          'M\tsrc/d.ts',
        ].join('\n');
      }
      if (command === 'show HEAD:src/a.ts') {
        return 'const a = 1;';
      }
      if (command === 'show HEAD:src/d.ts') {
        return 'const d = 2;';
      }
      throw new Error(`comando git no esperado: ${command}`);
    },
    getStagedFacts: () => [],
    resolveRepoRoot: () => process.cwd(),
  };

  const result = await getFactsForCommitRange({
    fromRef: 'main',
    toRef: 'HEAD',
    extensions: ['.ts'],
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
      path: 'src/c.ts',
      changeType: 'deleted',
      source: 'git:range:main..HEAD',
    },
    {
      kind: 'FileChange',
      path: 'src/d.ts',
      changeType: 'modified',
      source: 'git:range:main..HEAD',
    },
    {
      kind: 'FileContent',
      path: 'src/d.ts',
      content: 'const d = 2;',
      source: 'git:range:main..HEAD',
    },
  ]);
  assert.deepEqual(calls, [
    'diff --name-status main..HEAD',
    'show HEAD:src/a.ts',
    'show HEAD:src/d.ts',
  ]);
});

test('getFactsForCommitRange retorna vacio si ningun cambio coincide con extension permitida', async () => {
  const calls: string[] = [];
  const git: IGitService = {
    runGit: (args: ReadonlyArray<string>): string => {
      const command = args.join(' ');
      calls.push(command);
      if (command === 'diff --name-status main..HEAD') {
        return ['M\tsrc/a.swift', 'A\tsrc/b.kt'].join('\n');
      }
      throw new Error(`comando git no esperado: ${command}`);
    },
    getStagedFacts: () => [],
    resolveRepoRoot: () => process.cwd(),
  };

  const result = await getFactsForCommitRange({
    fromRef: 'main',
    toRef: 'HEAD',
    extensions: ['.ts'],
    git,
  });

  assert.deepEqual(result, []);
  assert.deepEqual(calls, ['diff --name-status main..HEAD']);
});
