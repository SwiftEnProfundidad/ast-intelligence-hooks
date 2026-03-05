import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  assertNoFatalOutput,
  assertSuccess,
  runCommand,
} from './package-install-smoke-runner-common';
import {
  pushCommandLog,
  type SmokeWorkspace,
} from './package-install-smoke-workspace-lib';
import { resolveConsumerPumukiCommand } from './package-install-smoke-command-resolution-lib';
import packageJson from '../package.json';

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
  writeFileSync(
    join(workspace.consumerRepo, '.gitignore'),
    'node_modules/\n.ai_evidence.json\n',
    'utf8'
  );
  runNpmStep(workspace, ['install', workspace.tarballPath ?? ''], 'npm install <tarball>');
};

export const verifyInstalledPackageCanBeRequired = (
  workspace: SmokeWorkspace
): void => {
  const packageName = packageJson.name;
  const installCheck = runCommand({
    cwd: workspace.consumerRepo,
    executable: 'node',
    args: ['-e', `const p=require('${packageName}'); console.log(p.name,p.version);`],
  });
  pushCommandLog(workspace.commandLog, installCheck);
  assertSuccess(installCheck, 'package require smoke');
};

export const verifyInstalledPumukiBinaryVersion = (
  workspace: SmokeWorkspace
): void => {
  const noInstallVersionCheck = runCommand({
    cwd: workspace.consumerRepo,
    executable: 'npx',
    args: ['--no-install', 'pumuki', '--version'],
  });
  pushCommandLog(workspace.commandLog, noInstallVersionCheck);

  const noInstallPassed =
    noInstallVersionCheck.exitCode === 0
    && !/Cannot find module|ERR_MODULE_NOT_FOUND|failed to resolve tsx runtime/.test(
      noInstallVersionCheck.combined
    );
  if (noInstallPassed) {
    assertNoFatalOutput(noInstallVersionCheck, 'pumuki --version smoke');
    return;
  }

  const fallback = resolveConsumerPumukiCommand({
    consumerRepo: workspace.consumerRepo,
    binary: 'pumuki',
    args: ['--version'],
  });
  const fallbackCheck = runCommand({
    cwd: workspace.consumerRepo,
    executable: fallback.executable,
    args: fallback.args,
  });
  pushCommandLog(workspace.commandLog, fallbackCheck);
  assertSuccess(
    fallbackCheck,
    `pumuki --version smoke fallback (${fallback.resolution})`
  );
  assertNoFatalOutput(
    fallbackCheck,
    `pumuki --version smoke fallback (${fallback.resolution})`
  );
};
