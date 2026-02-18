import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { getCurrentPumukiPackageName } from '../packageInfo';
import { parseLifecycleCliArgs, runLifecycleCli } from '../cli';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const createGitRepo = (trackedNodeModules = false): string => {
  const repo = join(tmpdir(), `pumuki-lifecycle-cli-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(repo, { recursive: true });
  runGit(repo, ['init', '-b', 'main']);
  runGit(repo, ['config', 'user.email', 'pumuki-test@example.com']);
  runGit(repo, ['config', 'user.name', 'Pumuki Test']);
  writeFileSync(join(repo, '.gitignore'), 'node_modules/\n', 'utf8');
  writeFileSync(join(repo, 'README.md'), '# fixture\n', 'utf8');
  runGit(repo, ['add', '.']);
  runGit(repo, ['commit', '-m', 'chore: fixture']);

  if (trackedNodeModules) {
    mkdirSync(join(repo, 'node_modules'), { recursive: true });
    writeFileSync(join(repo, 'node_modules', 'tracked.txt'), 'tracked\n', 'utf8');
    runGit(repo, ['add', '-f', 'node_modules/tracked.txt']);
    runGit(repo, ['commit', '-m', 'test: tracked node_modules']);
  }

  return repo;
};

const withSilentConsole = async <T>(callback: () => Promise<T>): Promise<T> => {
  const originalLog = console.log;
  const originalError = console.error;
  console.log = () => {};
  console.error = () => {};
  try {
    return await callback();
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
};

test('parseLifecycleCliArgs interpreta comandos y flags soportados', () => {
  const packageName = getCurrentPumukiPackageName();

  assert.deepEqual(parseLifecycleCliArgs(['install']), {
    command: 'install',
    purgeArtifacts: false,
    updateSpec: undefined,
    json: false,
  });
  assert.deepEqual(parseLifecycleCliArgs(['uninstall', '--purge-artifacts']), {
    command: 'uninstall',
    purgeArtifacts: true,
    updateSpec: undefined,
    json: false,
  });
  assert.deepEqual(parseLifecycleCliArgs(['update', `--spec= ${packageName}@next `]), {
    command: 'update',
    purgeArtifacts: false,
    updateSpec: `${packageName}@next`,
    json: false,
  });
  assert.deepEqual(parseLifecycleCliArgs(['update', '--latest']), {
    command: 'update',
    purgeArtifacts: false,
    updateSpec: undefined,
    json: false,
  });
});

test('parseLifecycleCliArgs soporta subcomandos SDD', () => {
  assert.deepEqual(parseLifecycleCliArgs(['sdd', 'status', '--json']), {
    command: 'sdd',
    purgeArtifacts: false,
    json: true,
    sddCommand: 'status',
  });
  assert.deepEqual(parseLifecycleCliArgs(['sdd', 'validate', '--stage=ci']), {
    command: 'sdd',
    purgeArtifacts: false,
    json: false,
    sddCommand: 'validate',
    sddStage: 'CI',
  });
  assert.deepEqual(
    parseLifecycleCliArgs([
      'sdd',
      'session',
      '--open',
      '--change=add-auth-feature',
      '--ttl-minutes=60',
    ]),
    {
      command: 'sdd',
      purgeArtifacts: false,
      json: false,
      sddCommand: 'session',
      sddSessionAction: 'open',
      sddChangeId: 'add-auth-feature',
      sddTtlMinutes: 60,
    }
  );
});

test('parseLifecycleCliArgs rechaza help implícito y flags no soportados', () => {
  assert.throws(() => parseLifecycleCliArgs([]), /Pumuki lifecycle commands/i);
  assert.throws(() => parseLifecycleCliArgs(['-h']), /Pumuki lifecycle commands/i);
  assert.throws(() => parseLifecycleCliArgs(['unknown']), /Unknown command/i);
  assert.throws(
    () => parseLifecycleCliArgs(['install', '--bad-flag']),
    /Unsupported argument/i
  );
});

test('runLifecycleCli retorna 1 ante argumentos inválidos', async () => {
  const code = await withSilentConsole(() => runLifecycleCli(['--bad']));
  assert.equal(code, 1);
});

test('runLifecycleCli ejecuta flujo install/doctor/status/remove/uninstall en repo válido', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();

  try {
    process.chdir(repo);
    const installCode = await withSilentConsole(() => runLifecycleCli(['install']));
    assert.equal(installCode, 0);

    writeFileSync(join(repo, '.ai_evidence.json'), '{}\n', 'utf8');
    const doctorCode = await withSilentConsole(() => runLifecycleCli(['doctor']));
    assert.equal(doctorCode, 0);

    const statusCode = await withSilentConsole(() => runLifecycleCli(['status']));
    assert.equal(statusCode, 0);

    const removeCode = await withSilentConsole(() => runLifecycleCli(['remove']));
    assert.equal(removeCode, 0);

    const uninstallCode = await withSilentConsole(() =>
      runLifecycleCli(['uninstall', '--purge-artifacts'])
    );
    assert.equal(uninstallCode, 0);
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli retorna 1 para update cuando doctor bloquea baseline inseguro', async () => {
  const repo = createGitRepo(true);
  const previousCwd = process.cwd();
  const packageName = getCurrentPumukiPackageName();

  try {
    process.chdir(repo);
    const code = await withSilentConsole(() =>
      runLifecycleCli(['update', `--spec=${packageName}@next`])
    );
    assert.equal(code, 1);
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});
