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

const installTarballIntoConsumerRepo = (
  workspace: SmokeWorkspace
): void => {
  runNpmStep(workspace, ['init', '-y'], 'npm init');
  runNpmStep(workspace, ['install', workspace.tarballPath ?? ''], 'npm install <tarball>');
};

const verifyInstalledPackageCanBeRequired = (
  workspace: SmokeWorkspace
): void => {
  const installCheck = runCommand({
    cwd: workspace.consumerRepo,
    executable: 'node',
    args: ['-e', "const p=require('pumuki-ast-hooks'); console.log(p.name,p.version);"],
  });
  pushCommandLog(workspace.commandLog, installCheck);
  assertSuccess(installCheck, 'package require smoke');
};

const initializeConsumerGitRepository = (
  workspace: SmokeWorkspace
): void => {
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
};

const commitBaseline = (
  workspace: SmokeWorkspace
): void => {
  writeBaselineFile(workspace.consumerRepo);
  runGitStep(workspace, ['add', '.'], 'git add baseline');
  runGitStep(workspace, ['commit', '-m', 'chore: baseline'], 'git commit baseline');
};

const configureRemoteAndFeatureBranch = (
  workspace: SmokeWorkspace
): void => {
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
};

const writeAndCommitRangePayloadForBlockMode = (
  workspace: SmokeWorkspace,
  mode: SmokeMode
): void => {
  if (mode !== 'block') {
    return;
  }

  writeRangePayloadFiles(workspace.consumerRepo);
  runGitStep(workspace, ['add', '.'], 'git add range payload');
  runGitStep(
    workspace,
    ['commit', '-m', 'test: range payload for package smoke'],
    'git commit range payload'
  );
};

export const setupConsumerRepository = (
  workspace: SmokeWorkspace,
  mode: SmokeMode
): void => {
  ensureDirectory(workspace.consumerRepo);

  initializeConsumerGitRepository(workspace);
  installTarballIntoConsumerRepo(workspace);
  verifyInstalledPackageCanBeRequired(workspace);
  commitBaseline(workspace);
  configureRemoteAndFeatureBranch(workspace);
  writeAndCommitRangePayloadForBlockMode(workspace, mode);
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
