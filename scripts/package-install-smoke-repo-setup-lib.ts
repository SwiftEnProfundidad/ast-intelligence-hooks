import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { SmokeMode } from './package-install-smoke-contract';
import {
  writeBaselineFile,
  writeRangePayloadFiles,
  writeStagedOnlyFile,
  writeStagedOnlyViolationFile,
} from './package-install-smoke-fixtures-lib';
import {
  assertSuccess,
  ensureDirectory,
  runCommand,
} from './package-install-smoke-runner-common';
import {
  pushCommandLog,
  type SmokeWorkspace,
} from './package-install-smoke-workspace-lib';

const runGitStep = (
  workspace: SmokeWorkspace,
  args: string[],
  context: string,
  cwd = workspace.consumerRepo
): void => {
  assertSuccess(runCommand({ cwd, executable: 'git', args }), context);
};

const runNpmStep = (
  workspace: SmokeWorkspace,
  args: string[],
  context: string
): void => {
  assertSuccess(
    runCommand({ cwd: workspace.consumerRepo, executable: 'npm', args }),
    context
  );
};

export const createTarball = (
  workspace: SmokeWorkspace
): { id: string; tarballPath: string } => {
  const packResult = runCommand({
    cwd: workspace.repoRoot,
    executable: 'npm',
    args: ['pack', '--json'],
  });
  pushCommandLog(workspace.commandLog, packResult);
  assertSuccess(packResult, 'npm pack --json');

  const packInfo = JSON.parse(packResult.stdout) as Array<{ filename: string; id: string }>;
  if (!Array.isArray(packInfo) || packInfo.length === 0 || !packInfo[0]?.filename) {
    throw new Error('npm pack --json did not return a valid tarball payload');
  }

  const tarballPath = join(workspace.repoRoot, packInfo[0].filename);
  if (!existsSync(tarballPath)) {
    throw new Error(`Packed tarball not found at ${tarballPath}`);
  }

  return { id: packInfo[0].id, tarballPath };
};

export const setupConsumerRepository = (
  workspace: SmokeWorkspace,
  mode: SmokeMode
): void => {
  ensureDirectory(workspace.consumerRepo);

  runGitStep(workspace, ['init', '-b', 'main'], 'git init');
  runGitStep(
    workspace,
    ['config', 'user.email', 'pumuki-smoke@example.com'],
    'git config user.email'
  );
  runGitStep(
    workspace,
    ['config', 'user.name', 'Pumuki Smoke'],
    'git config user.name'
  );
  runNpmStep(workspace, ['init', '-y'], 'npm init');
  runNpmStep(workspace, ['install', workspace.tarballPath ?? ''], 'npm install <tarball>');

  const installCheck = runCommand({
    cwd: workspace.consumerRepo,
    executable: 'node',
    args: ['-e', "const p=require('pumuki-ast-hooks'); console.log(p.name,p.version);"],
  });
  pushCommandLog(workspace.commandLog, installCheck);
  assertSuccess(installCheck, 'package require smoke');

  writeBaselineFile(workspace.consumerRepo);
  runGitStep(workspace, ['add', '.'], 'git add baseline');
  runGitStep(workspace, ['commit', '-m', 'chore: baseline'], 'git commit baseline');

  runGitStep(
    workspace,
    ['init', '--bare', workspace.bareRemote],
    'git init --bare',
    workspace.tmpRoot
  );
  runGitStep(workspace, ['remote', 'add', 'origin', workspace.bareRemote], 'git remote add origin');
  runGitStep(workspace, ['push', '-u', 'origin', 'main'], 'git push origin main');
  runGitStep(workspace, ['checkout', '-b', 'feature/package-smoke'], 'git checkout feature branch');
  runGitStep(
    workspace,
    ['branch', '--set-upstream-to=origin/main', 'feature/package-smoke'],
    'git branch --set-upstream-to'
  );

  if (mode === 'block') {
    writeRangePayloadFiles(workspace.consumerRepo);
    runGitStep(workspace, ['add', '.'], 'git add range payload');
    runGitStep(
      workspace,
      ['commit', '-m', 'test: range payload for package smoke'],
      'git commit range payload'
    );
  }
};

export const writeStagedPayload = (
  workspace: SmokeWorkspace,
  mode: SmokeMode
): void => {
  const stagedFile =
    mode === 'block'
      ? writeStagedOnlyViolationFile(workspace.consumerRepo)
      : writeStagedOnlyFile(workspace.consumerRepo);
  runGitStep(workspace, ['add', stagedFile], 'git add staged-only payload');
};
