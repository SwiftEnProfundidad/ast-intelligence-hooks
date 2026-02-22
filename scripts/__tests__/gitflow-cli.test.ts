import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

const gitflowBinPath = resolve(process.cwd(), 'bin/gitflow');

const runGit = (cwd: string, args: ReadonlyArray<string>): string => {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
};

const initRepo = (cwd: string): void => {
  runGit(cwd, ['init']);
  runGit(cwd, ['config', 'user.email', 'pumuki@example.com']);
  runGit(cwd, ['config', 'user.name', 'Pumuki Bot']);
  writeFileSync(join(cwd, 'README.md'), '# temp\n', 'utf8');
  runGit(cwd, ['add', 'README.md']);
  runGit(cwd, ['commit', '-m', 'init']);
};

const checkoutBranch = (cwd: string, branchName: string): void => {
  runGit(cwd, ['checkout', '-b', branchName]);
};

const runGitflow = (
  cwd: string,
  args: ReadonlyArray<string>
): ReturnType<typeof spawnSync> => {
  return spawnSync('bash', [gitflowBinPath, ...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
};

test('gitflow check reporta PASS en feature branch limpio', async () => {
  await withTempDir('pumuki-gitflow-check-', async (repoRoot) => {
    initRepo(repoRoot);
    checkoutBranch(repoRoot, 'feature/t6-gitflow-cli');

    const result = runGitflow(repoRoot, ['check']);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /gitflow check/i);
    assert.match(result.stdout, /status:\s*PASS/i);
  });
});

test('gitflow status imprime estado de branch, upstream y worktree', async () => {
  await withTempDir('pumuki-gitflow-status-', async (repoRoot) => {
    initRepo(repoRoot);
    checkoutBranch(repoRoot, 'feature/t6-status');

    const result = runGitflow(repoRoot, ['status']);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /branch:\s*feature\/t6-status/i);
    assert.match(result.stdout, /upstream:\s*/i);
    assert.match(result.stdout, /worktree:\s*clean/i);
  });
});

test('gitflow workflow en rama protegida recomienda crear feature branch', async () => {
  await withTempDir('pumuki-gitflow-workflow-', async (repoRoot) => {
    initRepo(repoRoot);
    runGit(repoRoot, ['branch', '-M', 'main']);

    const result = runGitflow(repoRoot, ['workflow']);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /gitflow workflow/i);
    assert.match(result.stdout, /rama protegida/i);
    assert.match(result.stdout, /git checkout -b feature\//i);
  });
});

test('gitflow reset mantiene comportamiento no destructivo', async () => {
  await withTempDir('pumuki-gitflow-reset-', async (repoRoot) => {
    initRepo(repoRoot);
    checkoutBranch(repoRoot, 'feature/t6-reset');

    const result = runGitflow(repoRoot, ['reset']);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /gitflow reset/i);
    assert.match(result.stdout, /non-destructive/i);
  });
});

test('gitflow rechaza comando invalido y muestra uso', async () => {
  await withTempDir('pumuki-gitflow-invalid-', async (repoRoot) => {
    initRepo(repoRoot);
    checkoutBranch(repoRoot, 'feature/t6-invalid');

    const result = runGitflow(repoRoot, ['invalid-command']);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /usage:\s*gitflow/i);
    assert.match(result.stderr, /check\|status\|workflow\|reset/i);
  });
});
