import assert from 'node:assert/strict';
import test from 'node:test';
import { GitService } from '../GitService';

test('GitService.getStagedFacts filtra por extension y evita leer contenido de borrados', () => {
  const service = new GitService();
  const calls: string[] = [];
  const mutableService = service as GitService & {
    runGit(args: ReadonlyArray<string>, cwd?: string): string;
  };
  mutableService.runGit = (args: ReadonlyArray<string>): string => {
    const command = args.join(' ');
    calls.push(command);
    if (command === 'diff --cached --name-status') {
      return [
        'A\tsrc/a.ts',
        'M\tsrc/ignored.swift',
        'D\tsrc/deleted.ts',
        'M\tsrc/b.ts',
      ].join('\n');
    }
    if (command === 'show :src/a.ts') {
      return 'const a = 1;';
    }
    if (command === 'show :src/b.ts') {
      return 'const b = 2;';
    }
    throw new Error(`comando git no esperado: ${command}`);
  };

  const result = service.getStagedFacts(['.ts']);

  assert.deepEqual(result, [
    {
      kind: 'FileChange',
      path: 'src/a.ts',
      changeType: 'added',
      source: 'git:staged',
    },
    {
      kind: 'FileContent',
      path: 'src/a.ts',
      content: 'const a = 1;',
      source: 'git:staged',
    },
    {
      kind: 'FileChange',
      path: 'src/deleted.ts',
      changeType: 'deleted',
      source: 'git:staged',
    },
    {
      kind: 'FileChange',
      path: 'src/b.ts',
      changeType: 'modified',
      source: 'git:staged',
    },
    {
      kind: 'FileContent',
      path: 'src/b.ts',
      content: 'const b = 2;',
      source: 'git:staged',
    },
  ]);
  assert.deepEqual(calls, [
    'diff --cached --name-status',
    'show :src/a.ts',
    'show :src/b.ts',
  ]);
});

test('GitService.resolveRepoRoot retorna path recortado cuando git responde ok', () => {
  const service = new GitService();
  let capturedArgs: ReadonlyArray<string> | undefined;
  const mutableService = service as GitService & {
    runGit(args: ReadonlyArray<string>, cwd?: string): string;
  };
  mutableService.runGit = (args: ReadonlyArray<string>): string => {
    capturedArgs = args;
    return '/repo/root\n';
  };

  const result = service.resolveRepoRoot();

  assert.equal(result, '/repo/root');
  assert.deepEqual(capturedArgs, ['rev-parse', '--show-toplevel']);
});

test('GitService.resolveRepoRoot usa process.cwd() si runGit falla', () => {
  const service = new GitService();
  const mutableService = service as GitService & {
    runGit(args: ReadonlyArray<string>, cwd?: string): string;
  };
  mutableService.runGit = (): string => {
    throw new Error('git no disponible');
  };

  const result = service.resolveRepoRoot();

  assert.equal(result, process.cwd());
});
