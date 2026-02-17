import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { PUMUKI_MANAGED_BLOCK_END, PUMUKI_MANAGED_BLOCK_START } from '../constants';
import { parseLifecycleCliArgs } from '../cli';
import { runLifecycleInstall } from '../install';
import { runLifecycleUninstall } from '../uninstall';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const createGitRepo = (): string => {
  const repo = join(tmpdir(), `pumuki-lifecycle-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
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

test('parseLifecycleCliArgs parses supported command options', () => {
  const parsed = parseLifecycleCliArgs(['uninstall', '--purge-artifacts']);
  assert.equal(parsed.command, 'uninstall');
  assert.equal(parsed.purgeArtifacts, true);
});

test('runLifecycleInstall and runLifecycleUninstall manage hooks and artifacts cleanly', () => {
  const repo = createGitRepo();
  try {
    const installResult = runLifecycleInstall({ cwd: repo });
    assert.equal(installResult.changedHooks.length > 0, true);

    const preCommitHook = readFileSync(join(repo, '.git/hooks/pre-commit'), 'utf8');
    const prePushHook = readFileSync(join(repo, '.git/hooks/pre-push'), 'utf8');
    assert.match(preCommitHook, new RegExp(PUMUKI_MANAGED_BLOCK_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(preCommitHook, new RegExp(PUMUKI_MANAGED_BLOCK_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(prePushHook, /pumuki-pre-push/);

    writeFileSync(join(repo, '.ai_evidence.json'), '{}\n', 'utf8');
    assert.equal(existsSync(join(repo, '.ai_evidence.json')), true);

    const uninstallResult = runLifecycleUninstall({
      cwd: repo,
      purgeArtifacts: true,
    });
    assert.equal(uninstallResult.removedArtifacts.includes('.ai_evidence.json'), true);
    assert.equal(existsSync(join(repo, '.ai_evidence.json')), false);
    assert.equal(existsSync(join(repo, '.git/hooks/pre-commit')), false);
    assert.equal(existsSync(join(repo, '.git/hooks/pre-push')), false);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleInstall blocks when node_modules is tracked in git', () => {
  const repo = createGitRepo();
  try {
    const nodeModulesDir = join(repo, 'node_modules');
    mkdirSync(nodeModulesDir, { recursive: true });
    writeFileSync(join(nodeModulesDir, 'tracked-file.txt'), 'tracked\n', 'utf8');
    runGit(repo, ['add', '-f', 'node_modules/tracked-file.txt']);
    runGit(repo, ['commit', '-m', 'test: tracked node_modules']);

    assert.throws(
      () => runLifecycleInstall({ cwd: repo }),
      /blocked by repository safety checks/i
    );
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
