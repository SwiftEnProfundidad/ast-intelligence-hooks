import {
  assertNoFatalOutput,
  assertSuccess,
  runCommand,
} from './package-install-smoke-runner-common';
import { resolveConsumerPumukiCommand } from './package-install-smoke-command-resolution-lib';
import { pushCommandLog, type SmokeWorkspace } from './package-install-smoke-workspace-lib';

const normalizeStatus = (value: string): string =>
  value
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .join('\n');

const getShortStatus = (workspace: SmokeWorkspace): string => {
  const statusResult = runCommand({
    cwd: workspace.consumerRepo,
    executable: 'git',
    args: ['status', '--short'],
  });
  pushCommandLog(workspace.commandLog, statusResult);
  assertSuccess(statusResult, 'git status --short snapshot');
  return normalizeStatus(statusResult.stdout);
};

export const captureLifecycleStatusSnapshot = (workspace: SmokeWorkspace): string =>
  getShortStatus(workspace);

export const runLifecycleInstallStep = (workspace: SmokeWorkspace): void => {
  const command = resolveConsumerPumukiCommand({
    consumerRepo: workspace.consumerRepo,
    binary: 'pumuki',
    args: ['install'],
  });
  const result = runCommand({
    cwd: workspace.consumerRepo,
    executable: command.executable,
    args: command.args,
    env: {
      PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS: '1',
      PUMUKI_SYSTEM_NOTIFICATIONS: '0',
      PUMUKI_NOTIFICATIONS: '0',
      PUMUKI_SKIP_OPENSPEC_BOOTSTRAP: '1',
    },
  });
  pushCommandLog(workspace.commandLog, result);
  assertNoFatalOutput(result, 'pumuki lifecycle install');
  assertSuccess(result, 'pumuki lifecycle install');
};

export const runLifecyclePreWriteStep = (workspace: SmokeWorkspace): void => {
  const contextCommand = resolveConsumerPumukiCommand({
    consumerRepo: workspace.consumerRepo,
    binary: 'pumuki',
    args: ['context', 'init'],
  });
  const contextResult = runCommand({
    cwd: workspace.consumerRepo,
    executable: contextCommand.executable,
    args: contextCommand.args,
    env: {
      PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS: '1',
      PUMUKI_SYSTEM_NOTIFICATIONS: '0',
      PUMUKI_NOTIFICATIONS: '0',
    },
  });
  pushCommandLog(workspace.commandLog, contextResult);
  assertNoFatalOutput(contextResult, 'pumuki context init');
  assertSuccess(contextResult, 'pumuki context init');

  const command = resolveConsumerPumukiCommand({
    consumerRepo: workspace.consumerRepo,
    binary: 'pumuki-pre-write',
  });
  const result = runCommand({
    cwd: workspace.consumerRepo,
    executable: command.executable,
    args: command.args,
    env: {
      PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS: '1',
      PUMUKI_SYSTEM_NOTIFICATIONS: '0',
      PUMUKI_NOTIFICATIONS: '0',
      PUMUKI_SDD_BYPASS: '1',
    },
  });
  pushCommandLog(workspace.commandLog, result);
  assertNoFatalOutput(result, 'pumuki lifecycle pre-write');
  assertSuccess(result, 'pumuki lifecycle pre-write');
};

export const runLifecycleUninstallStep = (workspace: SmokeWorkspace): void => {
  const command = resolveConsumerPumukiCommand({
    consumerRepo: workspace.consumerRepo,
    binary: 'pumuki',
    args: ['uninstall', '--purge-artifacts'],
  });
  const result = runCommand({
    cwd: workspace.consumerRepo,
    executable: command.executable,
    args: command.args,
    env: {
      PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS: '1',
      PUMUKI_SYSTEM_NOTIFICATIONS: '0',
      PUMUKI_NOTIFICATIONS: '0',
    },
  });
  pushCommandLog(workspace.commandLog, result);
  assertNoFatalOutput(result, 'pumuki lifecycle uninstall');
  assertSuccess(result, 'pumuki lifecycle uninstall');
};

export const assertLifecycleStatusMatchesSnapshot = (params: {
  workspace: SmokeWorkspace;
  snapshot: string;
}): string => {
  const current = getShortStatus(params.workspace);
  if (params.snapshot !== current) {
    throw new Error(
      [
        'pumuki lifecycle smoke left repository status dirty after uninstall.',
        `before install:\n${params.snapshot || '(clean)'}`,
        `after uninstall:\n${current || '(clean)'}`,
      ].join('\n\n')
    );
  }
  return current;
};

export const assertLifecycleStatusRoundTrip = (workspace: SmokeWorkspace): {
  beforeInstall: string;
  afterUninstall: string;
} => {
  const beforeInstall = getShortStatus(workspace);
  runLifecycleInstallStep(workspace);
  runLifecycleUninstallStep(workspace);
  const afterUninstall = getShortStatus(workspace);

  if (beforeInstall !== afterUninstall) {
    throw new Error(
      [
        'pumuki lifecycle smoke left repository status dirty after uninstall.',
        `before install:\n${beforeInstall || '(clean)'}`,
        `after uninstall:\n${afterUninstall || '(clean)'}`,
      ].join('\n\n')
    );
  }

  return {
    beforeInstall,
    afterUninstall,
  };
};
