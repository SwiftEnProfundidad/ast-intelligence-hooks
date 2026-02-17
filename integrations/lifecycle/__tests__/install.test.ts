import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { PUMUKI_CONFIG_KEYS } from '../constants';
import { runLifecycleInstall } from '../install';
import { getCurrentPumukiVersion } from '../packageInfo';

const withCwd = <T>(cwd: string, fn: () => T): T => {
  const previous = process.cwd();
  process.chdir(cwd);
  try {
    return fn();
  } finally {
    process.chdir(previous);
  }
};

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const readLocalConfig = (cwd: string, key: string): string | undefined => {
  try {
    return runGit(cwd, ['config', '--local', '--get', key]).trim();
  } catch {
    return undefined;
  }
};

const createGitRepo = (): string => {
  const repo = join(tmpdir(), `pumuki-install-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(repo, { recursive: true });
  runGit(repo, ['init', '-b', 'main']);
  runGit(repo, ['config', 'user.email', 'pumuki-test@example.com']);
  runGit(repo, ['config', 'user.name', 'Pumuki Test']);
  writeFileSync(join(repo, '.gitignore'), 'node_modules/\n', 'utf8');
  writeFileSync(join(repo, 'README.md'), '# fixture\n', 'utf8');
  runGit(repo, ['add', '.']);
  runGit(repo, ['commit', '-m', 'chore: fixture']);
  return repo;
};

test('runLifecycleInstall instala hooks y persiste estado lifecycle', () => {
  const repo = createGitRepo();
  try {
    const result = runLifecycleInstall({ cwd: repo });

    assert.equal(realpathSync(result.repoRoot), realpathSync(repo));
    assert.equal(result.version, getCurrentPumukiVersion());
    assert.deepEqual(result.changedHooks, ['pre-commit', 'pre-push']);

    const preCommitPath = join(repo, '.git/hooks/pre-commit');
    const prePushPath = join(repo, '.git/hooks/pre-push');
    assert.equal(existsSync(preCommitPath), true);
    assert.equal(existsSync(prePushPath), true);
    assert.match(readFileSync(preCommitPath, 'utf8'), /pumuki-pre-commit/);
    assert.match(readFileSync(prePushPath, 'utf8'), /pumuki-pre-push/);

    assert.equal(readLocalConfig(repo, PUMUKI_CONFIG_KEYS.installed), 'true');
    assert.equal(readLocalConfig(repo, PUMUKI_CONFIG_KEYS.version), getCurrentPumukiVersion());
    assert.equal(readLocalConfig(repo, PUMUKI_CONFIG_KEYS.hooks), 'pre-commit,pre-push');
    const installedAt = readLocalConfig(repo, PUMUKI_CONFIG_KEYS.installedAt);
    assert.equal(typeof installedAt, 'string');
    assert.equal(Number.isFinite(Date.parse(installedAt ?? '')), true);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleInstall bloquea cuando hay node_modules trackeado y no persiste estado', () => {
  const repo = createGitRepo();
  try {
    const trackedFile = join(repo, 'node_modules', 'tracked.txt');
    mkdirSync(join(repo, 'node_modules'), { recursive: true });
    writeFileSync(trackedFile, 'tracked\n', 'utf8');
    runGit(repo, ['add', '-f', 'node_modules/tracked.txt']);
    runGit(repo, ['commit', '-m', 'test: tracked node_modules']);

    assert.throws(
      () => runLifecycleInstall({ cwd: repo }),
      /blocked by repository safety checks/i
    );

    assert.equal(existsSync(join(repo, '.git/hooks/pre-commit')), false);
    assert.equal(existsSync(join(repo, '.git/hooks/pre-push')), false);
    assert.equal(readLocalConfig(repo, PUMUKI_CONFIG_KEYS.installed), undefined);
    assert.equal(readLocalConfig(repo, PUMUKI_CONFIG_KEYS.version), undefined);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleInstall es idempotente en segunda ejecución sobre repo ya instalado', () => {
  const repo = createGitRepo();
  try {
    const firstInstall = runLifecycleInstall({ cwd: repo });
    const firstInstalledAt = readLocalConfig(repo, PUMUKI_CONFIG_KEYS.installedAt);

    const secondInstall = runLifecycleInstall({ cwd: repo });
    const secondInstalledAt = readLocalConfig(repo, PUMUKI_CONFIG_KEYS.installedAt);

    assert.deepEqual(firstInstall.changedHooks, ['pre-commit', 'pre-push']);
    assert.deepEqual(secondInstall.changedHooks, []);
    assert.equal(secondInstall.version, getCurrentPumukiVersion());
    assert.equal(readLocalConfig(repo, PUMUKI_CONFIG_KEYS.installed), 'true');
    assert.equal(readLocalConfig(repo, PUMUKI_CONFIG_KEYS.hooks), 'pre-commit,pre-push');
    assert.equal(typeof firstInstalledAt, 'string');
    assert.equal(typeof secondInstalledAt, 'string');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleInstall usa process.cwd cuando no recibe cwd explícito', () => {
  const repo = createGitRepo();
  try {
    const result = withCwd(repo, () => runLifecycleInstall());
    assert.equal(realpathSync(result.repoRoot), realpathSync(repo));
    assert.deepEqual(result.changedHooks, ['pre-commit', 'pre-push']);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
