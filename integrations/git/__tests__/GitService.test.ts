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

test('GitService.getRepoFacts ignora paths trackeados que ya no existen en working tree', async () => {
  await withTempDir('pumuki-git-repo-facts-missing-', async (repoRoot) => {
    mkdirSync(join(repoRoot, 'src'), { recursive: true });
    writeFileSync(join(repoRoot, 'src', 'present.ts'), 'const present = true;', 'utf8');
    const service = new GitService();
    const mutableService = service as GitService & {
      runGit(args: ReadonlyArray<string>, cwd?: string): string;
      resolveRepoRoot(): string;
    };
    mutableService.runGit = (args: ReadonlyArray<string>): string => {
      const command = args.join(' ');
      if (command === 'ls-files') {
        return ['src/present.ts', 'src/missing.ts'].join('\n');
      }
      throw new Error(`comando git no esperado: ${command}`);
    };
    mutableService.resolveRepoRoot = () => repoRoot;

    const result = service.getRepoFacts(['.ts']);

    assert.deepEqual(result, [
      {
        kind: 'FileChange',
        path: 'src/present.ts',
        changeType: 'modified',
        source: 'git:repo:working-tree',
      },
      {
        kind: 'FileContent',
        path: 'src/present.ts',
        content: 'const present = true;',
        source: 'git:repo:working-tree',
      },
    ]);
  });
});

test('GitService.getUnstagedFacts incluye diff indice→working tree pero no untracked por defecto', async () => {
  await withTempDir('pumuki-git-unstaged-facts-', async (repoRoot) => {
    mkdirSync(join(repoRoot, 'src'), { recursive: true });
    writeFileSync(join(repoRoot, 'src', 'wip.ts'), 'export const x = 1;\n', 'utf8');
    writeFileSync(join(repoRoot, 'src', 'new.ts'), 'export const y = 2;\n', 'utf8');
    const service = new GitService();
    const calls: string[] = [];
    const mutableService = service as GitService & {
      runGit(args: ReadonlyArray<string>, cwd?: string): string;
      resolveRepoRoot(): string;
    };
    mutableService.runGit = (args: ReadonlyArray<string>): string => {
      const command = args.join(' ');
      calls.push(command);
      if (command === 'diff --name-status') {
        return ['M\tsrc/wip.ts'].join('\n');
      }
      if (command === 'ls-files --others --exclude-standard') {
        return ['src/new.ts', 'src/ignored.swift'].join('\n');
      }
      throw new Error(`comando git no esperado: ${command}`);
    };
    mutableService.resolveRepoRoot = () => repoRoot;

    const result = service.getUnstagedFacts(['.ts']);

    assert.deepEqual(result, [
      {
        kind: 'FileChange',
        path: 'src/wip.ts',
        changeType: 'modified',
        source: 'git:unstaged',
      },
      {
        kind: 'FileContent',
        path: 'src/wip.ts',
        content: 'export const x = 1;\n',
        source: 'git:unstaged',
      },
    ]);
    assert.deepEqual(calls, ['diff --name-status']);
  });
});

test('GitService.getUnstagedFacts incluye untracked cuando se solicita explícitamente', async () => {
  await withTempDir('pumuki-git-unstaged-facts-explicit-', async (repoRoot) => {
    mkdirSync(join(repoRoot, 'src'), { recursive: true });
    writeFileSync(join(repoRoot, 'src', 'wip.ts'), 'export const x = 1;\n', 'utf8');
    writeFileSync(join(repoRoot, 'src', 'new.ts'), 'export const y = 2;\n', 'utf8');
    const service = new GitService();
    const calls: string[] = [];
    const mutableService = service as GitService & {
      runGit(args: ReadonlyArray<string>, cwd?: string): string;
      resolveRepoRoot(): string;
    };
    mutableService.runGit = (args: ReadonlyArray<string>): string => {
      const command = args.join(' ');
      calls.push(command);
      if (command === 'diff --name-status') {
        return ['M\tsrc/wip.ts'].join('\n');
      }
      if (command === 'ls-files --others --exclude-standard') {
        return ['src/new.ts', 'src/ignored.swift'].join('\n');
      }
      throw new Error(`comando git no esperado: ${command}`);
    };
    mutableService.resolveRepoRoot = () => repoRoot;

    const result = service.getUnstagedFacts(['.ts'], true);

    assert.deepEqual(result, [
      {
        kind: 'FileChange',
        path: 'src/wip.ts',
        changeType: 'modified',
        source: 'git:unstaged',
      },
      {
        kind: 'FileContent',
        path: 'src/wip.ts',
        content: 'export const x = 1;\n',
        source: 'git:unstaged',
      },
      {
        kind: 'FileChange',
        path: 'src/new.ts',
        changeType: 'added',
        source: 'git:unstaged',
      },
      {
        kind: 'FileContent',
        path: 'src/new.ts',
        content: 'export const y = 2;\n',
        source: 'git:unstaged',
      },
    ]);
    assert.deepEqual(calls, ['diff --name-status', 'ls-files --others --exclude-standard']);
  });
});

test('GitService.getUnstagedFacts incluye untracked cuando PUMUKI_INCLUDE_UNTRACKED_WORKTREE=1', async () => {
  await withTempDir('pumuki-git-unstaged-facts-env-', async (repoRoot) => {
    mkdirSync(join(repoRoot, 'src'), { recursive: true });
    writeFileSync(join(repoRoot, 'src', 'wip.ts'), 'export const x = 1;\n', 'utf8');
    writeFileSync(join(repoRoot, 'src', 'new.ts'), 'export const y = 2;\n', 'utf8');
    const previousEnv = process.env.PUMUKI_INCLUDE_UNTRACKED_WORKTREE;
    const service = new GitService();
    const calls: string[] = [];
    const mutableService = service as GitService & {
      runGit(args: ReadonlyArray<string>, cwd?: string): string;
      resolveRepoRoot(): string;
    };
    mutableService.runGit = (args: ReadonlyArray<string>): string => {
      const command = args.join(' ');
      calls.push(command);
      if (command === 'diff --name-status') {
        return ['M\tsrc/wip.ts'].join('\n');
      }
      if (command === 'ls-files --others --exclude-standard') {
        return ['src/new.ts', 'src/ignored.swift'].join('\n');
      }
      throw new Error(`comando git no esperado: ${command}`);
    };
    mutableService.resolveRepoRoot = () => repoRoot;

    process.env.PUMUKI_INCLUDE_UNTRACKED_WORKTREE = '1';
    try {
      const result = service.getUnstagedFacts(['.ts']);

      assert.deepEqual(result, [
        {
          kind: 'FileChange',
          path: 'src/wip.ts',
          changeType: 'modified',
          source: 'git:unstaged',
        },
        {
          kind: 'FileContent',
          path: 'src/wip.ts',
          content: 'export const x = 1;\n',
          source: 'git:unstaged',
        },
        {
          kind: 'FileChange',
          path: 'src/new.ts',
          changeType: 'added',
          source: 'git:unstaged',
        },
        {
          kind: 'FileContent',
          path: 'src/new.ts',
          content: 'export const y = 2;\n',
          source: 'git:unstaged',
        },
      ]);
      assert.deepEqual(calls, ['diff --name-status', 'ls-files --others --exclude-standard']);
    } finally {
      if (previousEnv === undefined) {
        delete process.env.PUMUKI_INCLUDE_UNTRACKED_WORKTREE;
      } else {
        process.env.PUMUKI_INCLUDE_UNTRACKED_WORKTREE = previousEnv;
      }
    }
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

test('GitService.getStagedAndUnstagedFacts agrega tracked pero no untracked por defecto', async () => {
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
      if (command === 'rev-parse --verify HEAD') {
        return 'abc123';
      }
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
    ]);
    assert.deepEqual(calls, [
      'rev-parse --verify HEAD',
      'diff --name-status HEAD',
    ]);
  });
});

test('GitService.getStagedAndUnstagedFacts incluye untracked cuando se habilita por entorno', async () => {
  await withTempDir('pumuki-git-working-tree-with-env-', async (repoRoot) => {
    mkdirSync(join(repoRoot, 'src'), { recursive: true });
    writeFileSync(join(repoRoot, 'src', 'tracked.ts'), 'export const tracked = true;\n', 'utf8');
    writeFileSync(join(repoRoot, 'src', 'new.ts'), 'export const created = true;\n', 'utf8');
    const previousEnv = process.env.PUMUKI_INCLUDE_UNTRACKED_WORKTREE;
    const service = new GitService();
    const calls: string[] = [];
    const mutableService = service as GitService & {
      runGit(args: ReadonlyArray<string>, cwd?: string): string;
      resolveRepoRoot(): string;
    };
    mutableService.runGit = (args: ReadonlyArray<string>): string => {
      const command = args.join(' ');
      calls.push(command);
      if (command === 'rev-parse --verify HEAD') {
        return 'abc123';
      }
      if (command === 'diff --name-status HEAD') {
        return ['M\tsrc/tracked.ts'].join('\n');
      }
      if (command === 'ls-files --others --exclude-standard') {
        return ['src/new.ts', 'src/ignored.swift'].join('\n');
      }
      throw new Error(`comando git no esperado: ${command}`);
    };
    mutableService.resolveRepoRoot = () => repoRoot;

    process.env.PUMUKI_INCLUDE_UNTRACKED_WORKTREE = '1';
    try {
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
        'rev-parse --verify HEAD',
        'diff --name-status HEAD',
        'ls-files --others --exclude-standard',
      ]);
    } finally {
      if (previousEnv === undefined) {
        delete process.env.PUMUKI_INCLUDE_UNTRACKED_WORKTREE;
      } else {
        process.env.PUMUKI_INCLUDE_UNTRACKED_WORKTREE = previousEnv;
      }
    }
  });
});

test('GitService.getStagedAndUnstagedFacts soporta repos sin HEAD en commit inicial', async () => {
  await withTempDir('pumuki-git-working-tree-initial-', async (repoRoot) => {
    mkdirSync(join(repoRoot, 'src'), { recursive: true });
    writeFileSync(join(repoRoot, 'src', 'bootstrap.ts'), 'export const bootstrap = true;\n', 'utf8');
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
      if (command === 'rev-parse --verify HEAD') {
        throw new Error("fatal: argumento ambiguo 'HEAD'");
      }
      if (command === 'diff --cached --name-status') {
        return ['A\tsrc/bootstrap.ts'].join('\n');
      }
      if (command === 'diff --name-status') {
        return ['M\tsrc/bootstrap.ts'].join('\n');
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
        path: 'src/bootstrap.ts',
        changeType: 'modified',
        source: 'git:working-tree',
      },
      {
        kind: 'FileContent',
        path: 'src/bootstrap.ts',
        content: 'export const bootstrap = true;\n',
        source: 'git:working-tree',
      },
    ]);
    assert.deepEqual(calls, [
      'rev-parse --verify HEAD',
      'diff --cached --name-status',
      'diff --name-status',
    ]);
  });
});

test('GitService.getStagedAndUnstagedFacts incluye untracked inicial cuando se habilita por entorno', async () => {
  await withTempDir('pumuki-git-working-tree-initial-env-', async (repoRoot) => {
    const previousEnv = process.env.PUMUKI_INCLUDE_UNTRACKED_WORKTREE;
    mkdirSync(join(repoRoot, 'src'), { recursive: true });
    writeFileSync(join(repoRoot, 'src', 'bootstrap.ts'), 'export const bootstrap = true;\n', 'utf8');
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
      if (command === 'rev-parse --verify HEAD') {
        throw new Error("fatal: argumento ambiguo 'HEAD'");
      }
      if (command === 'diff --cached --name-status') {
        return ['A\tsrc/bootstrap.ts'].join('\n');
      }
      if (command === 'diff --name-status') {
        return ['M\tsrc/bootstrap.ts'].join('\n');
      }
      if (command === 'ls-files --others --exclude-standard') {
        return ['src/new.ts', 'src/ignored.swift'].join('\n');
      }
      throw new Error(`comando git no esperado: ${command}`);
    };
    mutableService.resolveRepoRoot = () => repoRoot;

    process.env.PUMUKI_INCLUDE_UNTRACKED_WORKTREE = '1';
    try {
      const result = service.getStagedAndUnstagedFacts(['.ts']);

      assert.deepEqual(result, [
        {
          kind: 'FileChange',
          path: 'src/bootstrap.ts',
          changeType: 'modified',
          source: 'git:working-tree',
        },
        {
          kind: 'FileContent',
          path: 'src/bootstrap.ts',
          content: 'export const bootstrap = true;\n',
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
        'rev-parse --verify HEAD',
        'diff --cached --name-status',
        'diff --name-status',
        'ls-files --others --exclude-standard',
      ]);
    } finally {
      if (previousEnv === undefined) {
        delete process.env.PUMUKI_INCLUDE_UNTRACKED_WORKTREE;
      } else {
        process.env.PUMUKI_INCLUDE_UNTRACKED_WORKTREE = previousEnv;
      }
    }
  });
});
