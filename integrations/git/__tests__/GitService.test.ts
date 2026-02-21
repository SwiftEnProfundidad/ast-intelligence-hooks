import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { GitService } from '../GitService';
import { withTempDir } from '../../__tests__/helpers/tempDir';

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

test('GitService.getRepoFacts carga snapshot del working tree filtrado por extension', async () => {
  await withTempDir('pumuki-git-repo-facts-', async (repoRoot) => {
    mkdirSync(join(repoRoot, 'src'), { recursive: true });
    writeFileSync(join(repoRoot, 'src', 'a.ts'), 'const a = 1;', 'utf8');
    writeFileSync(join(repoRoot, 'src', 'b.ts'), 'const b = 2;', 'utf8');
    const service = new GitService();
    const calls: string[] = [];
    const mutableService = service as GitService & {
      runGit(args: ReadonlyArray<string>, cwd?: string): string;
      resolveRepoRoot(): string;
    };
    mutableService.runGit = (args: ReadonlyArray<string>): string => {
      const command = args.join(' ');
      calls.push(command);
      if (command === 'ls-files') {
        return ['src/a.ts', 'src/ignored.swift', 'src/b.ts'].join('\n');
      }
      throw new Error(`comando git no esperado: ${command}`);
    };
    mutableService.resolveRepoRoot = () => repoRoot;

    const result = service.getRepoFacts(['.ts']);

    assert.deepEqual(result, [
      {
        kind: 'FileChange',
        path: 'src/a.ts',
        changeType: 'modified',
        source: 'git:repo:working-tree',
      },
      {
        kind: 'FileContent',
        path: 'src/a.ts',
        content: 'const a = 1;',
        source: 'git:repo:working-tree',
      },
      {
        kind: 'FileChange',
        path: 'src/b.ts',
        changeType: 'modified',
        source: 'git:repo:working-tree',
      },
      {
        kind: 'FileContent',
        path: 'src/b.ts',
        content: 'const b = 2;',
        source: 'git:repo:working-tree',
      },
    ]);
    assert.deepEqual(calls, ['ls-files']);
  });
});

test('GitService.getRepoAndStagedFacts carga snapshot del index', () => {
  const service = new GitService();
  const calls: string[] = [];
  const mutableService = service as GitService & {
    runGit(args: ReadonlyArray<string>, cwd?: string): string;
  };
  mutableService.runGit = (args: ReadonlyArray<string>): string => {
    const command = args.join(' ');
    calls.push(command);
    if (command === 'ls-files') {
      return ['src/staged.ts', 'src/ignored.swift'].join('\n');
    }
    if (command === 'show :src/staged.ts') {
      return 'const staged = true;';
    }
    throw new Error(`comando git no esperado: ${command}`);
  };

  const result = service.getRepoAndStagedFacts(['.ts']);

  assert.deepEqual(result, [
    {
      kind: 'FileChange',
      path: 'src/staged.ts',
      changeType: 'modified',
      source: 'git:repo+staged',
    },
    {
      kind: 'FileContent',
      path: 'src/staged.ts',
      content: 'const staged = true;',
      source: 'git:repo+staged',
    },
  ]);
  assert.deepEqual(calls, [
    'ls-files',
    'show :src/staged.ts',
  ]);
});

test('GitService.getStagedAndUnstagedFacts agrega tracked y untracked del working tree', async () => {
  await withTempDir('pumuki-git-working-tree-', async (repoRoot) => {
    mkdirSync(join(repoRoot, 'src'), { recursive: true });
    writeFileSync(join(repoRoot, 'src', 'tracked.ts'), 'export const tracked = true;\n', 'utf8');
    writeFileSync(join(repoRoot, 'src', 'new.ts'), 'export const created = true;\n', 'utf8');
    const service = new GitService();
    const calls: string[] = [];
    const mutableService = service as GitService & {
      runGit(args: ReadonlyArray<string>, cwd?: string): string;
      resolveRepoRoot(): string;
    };
    mutableService.runGit = (args: ReadonlyArray<string>): string => {
      const command = args.join(' ');
      calls.push(command);
      if (command === 'diff --name-status HEAD') {
        return ['M\tsrc/tracked.ts'].join('\n');
      }
      if (command === 'ls-files --others --exclude-standard') {
        return ['src/new.ts', 'src/ignored.swift'].join('\n');
      }
      throw new Error(`comando git no esperado: ${command}`);
    };
    mutableService.resolveRepoRoot = () => repoRoot;

    const result = service.getStagedAndUnstagedFacts(['.ts']);

    assert.deepEqual(result, [
      {
        kind: 'FileChange',
        path: 'src/tracked.ts',
        changeType: 'modified',
        source: 'git:working-tree',
      },
      {
        kind: 'FileContent',
        path: 'src/tracked.ts',
        content: 'export const tracked = true;\n',
        source: 'git:working-tree',
      },
      {
        kind: 'FileChange',
        path: 'src/new.ts',
        changeType: 'added',
        source: 'git:working-tree',
      },
      {
        kind: 'FileContent',
        path: 'src/new.ts',
        content: 'export const created = true;\n',
        source: 'git:working-tree',
      },
    ]);
    assert.deepEqual(calls, [
      'diff --name-status HEAD',
      'ls-files --others --exclude-standard',
    ]);
  });
});
