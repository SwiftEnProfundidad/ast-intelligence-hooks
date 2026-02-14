import {
  assertSuccess,
  runCommand,
} from './package-install-smoke-runner-common';
import type { SmokeWorkspace } from './package-install-smoke-workspace-lib';

export const runGitStep = (
  workspace: SmokeWorkspace,
  args: string[],
  context: string,
  cwd = workspace.consumerRepo
): void => {
  assertSuccess(runCommand({ cwd, executable: 'git', args }), context);
};

export const initializeConsumerGitRepository = (
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

export const configureRemoteAndFeatureBranch = (
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
