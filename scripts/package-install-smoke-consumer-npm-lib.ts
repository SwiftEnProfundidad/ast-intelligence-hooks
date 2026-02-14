import {
  assertSuccess,
  runCommand,
} from './package-install-smoke-runner-common';
import {
  pushCommandLog,
  type SmokeWorkspace,
} from './package-install-smoke-workspace-lib';

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

export const installTarballIntoConsumerRepo = (
  workspace: SmokeWorkspace
): void => {
  runNpmStep(workspace, ['init', '-y'], 'npm init');
  runNpmStep(workspace, ['install', workspace.tarballPath ?? ''], 'npm install <tarball>');
};

export const verifyInstalledPackageCanBeRequired = (
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
