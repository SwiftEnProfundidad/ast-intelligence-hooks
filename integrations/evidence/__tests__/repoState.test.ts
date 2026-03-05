import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { captureRepoState } from '../repoState';
import { getCurrentPumukiVersion } from '../../lifecycle/packageInfo';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const createGitRepo = (): string => {
  const repo = join(tmpdir(), `pumuki-repo-state-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(repo, { recursive: true });
  runGit(repo, ['init', '-b', 'main']);
  runGit(repo, ['config', 'user.email', 'pumuki-test@example.com']);
  runGit(repo, ['config', 'user.name', 'Pumuki Test']);
  writeFileSync(join(repo, 'README.md'), '# fixture\n', 'utf8');
  runGit(repo, ['add', '.']);
  runGit(repo, ['commit', '-m', 'chore: fixture']);
  return repo;
};

test('captureRepoState refleja hard mode config persistida en archivo determinista', () => {
  const repo = createGitRepo();
  try {
    mkdirSync(join(repo, '.pumuki'), { recursive: true });
    writeFileSync(
      join(repo, '.pumuki', 'hard-mode.json'),
      JSON.stringify({ enabled: true, profile: 'critical-high' }, null, 2),
      'utf8'
    );

    const repoState = captureRepoState(repo);
    const hardMode = (repoState.lifecycle as { hard_mode?: unknown }).hard_mode;

    assert.deepEqual(hardMode, {
      enabled: true,
      profile: 'critical-high',
      config_path: '.pumuki/hard-mode.json',
    });
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('captureRepoState prioriza versión instalada del consumer sobre lifecycle git config y alinea lifecycle_version', () => {
  const repo = createGitRepo();
  try {
    // Simula lifecycle config legado con versión antigua.
    runGit(repo, ['config', '--local', 'pumuki.version', '0.0.1']);

    const rootPackage = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8')
    ) as { name?: string };
    const packageName = rootPackage.name ?? 'pumuki';
    const packageRoot = join(repo, 'node_modules', packageName);
    mkdirSync(packageRoot, { recursive: true });
    writeFileSync(
      join(packageRoot, 'package.json'),
      JSON.stringify({ name: packageName, version: '9.9.9' }, null, 2),
      'utf8'
    );

    const repoState = captureRepoState(repo);

    assert.equal(repoState.lifecycle.package_version, '9.9.9');
    assert.equal(repoState.lifecycle.lifecycle_version, '9.9.9');
    assert.equal(repoState.lifecycle.package_version_source, 'consumer-node-modules');
    assert.equal(repoState.lifecycle.package_version_runtime, getCurrentPumukiVersion());
    assert.equal(repoState.lifecycle.package_version_installed, '9.9.9');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
