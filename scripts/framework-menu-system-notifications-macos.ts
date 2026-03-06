import {
  type PumukiCriticalNotificationEvent,
  type SystemNotificationCommandRunner,
  type SystemNotificationCommandRunnerWithOutput,
  type SystemNotificationEmitResult,
  type SystemNotificationPayload,
  type SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';
import { buildDisplayNotificationScript, runBlockedDialogWithAppleScript } from './framework-menu-system-notifications-macos-applescript';
import {
  runSystemCommand,
  runSystemCommandWithOutput,
} from './framework-menu-system-notifications-macos-runner';
import {
  resolveBlockedDialogMode,
  runBlockedDialogWithSwiftHelper,
} from './framework-menu-system-notifications-macos-swift';
import {
  resolveBlockedCauseSummary,
  resolveBlockedRemediation,
  resolveProjectLabel,
} from './framework-menu-system-notifications-payloads';

const isTruthyFlag = (value?: string): boolean => {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

export const resolveBlockedDialogEnabled = (params: {
  env: NodeJS.ProcessEnv;
  config: SystemNotificationsConfig;
}): boolean => {
  const raw = params.env.PUMUKI_MACOS_BLOCKED_DIALOG;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return isTruthyFlag(raw);
  }
  return params.config.blockedDialogEnabled !== false;
};

export { runSystemCommand, runSystemCommandWithOutput } from './framework-menu-system-notifications-macos-runner';

export const deliverMacOsNotification = (params: {
  event: PumukiCriticalNotificationEvent;
  payload: SystemNotificationPayload;
  repoRoot?: string;
  config: SystemNotificationsConfig;
  env: NodeJS.ProcessEnv;
  nowMs: number;
  runCommand?: SystemNotificationCommandRunner;
  runCommandWithOutput?: SystemNotificationCommandRunnerWithOutput;
  applyDialogChoice: (params: {
    repoRoot: string;
    config: SystemNotificationsConfig;
    button: string;
    nowMs: number;
  }) => void;
}): SystemNotificationEmitResult => {
  const runner = params.runCommand ?? runSystemCommand;
  const exitCode = runner('osascript', ['-e', buildDisplayNotificationScript(params.payload)]);
  if (exitCode !== 0) {
    return { delivered: false, reason: 'command-failed' };
  }

  if (
    params.event.kind === 'gate.blocked'
    && resolveBlockedDialogEnabled({ env: params.env, config: params.config })
    && params.repoRoot
  ) {
    const causeCode = params.event.causeCode ?? 'GATE_BLOCKED';
    const cause = resolveBlockedCauseSummary(params.event, causeCode);
    const remediation = resolveBlockedRemediation(params.event, causeCode);
    const projectLabel = resolveProjectLabel({
      repoRoot: params.repoRoot,
      projectLabel: params.env.PUMUKI_PROJECT_LABEL,
    });
    const dialogTitle = projectLabel
      ? `🔴 Pumuki bloqueado · ${projectLabel}`
      : '🔴 Pumuki bloqueado';
    const dialogRunner = params.runCommandWithOutput ?? runSystemCommandWithOutput;
    const dialogMode = resolveBlockedDialogMode(params.env);
    let selectedButton: string | null = null;

    if (dialogMode !== 'applescript') {
      const swiftDialog = runBlockedDialogWithSwiftHelper({
        repoRoot: params.repoRoot,
        title: dialogTitle,
        cause,
        remediation,
        runner: dialogRunner,
      });
      selectedButton = swiftDialog.selectedButton;
      if (swiftDialog.commandFailed) {
        const fallbackDialog = runBlockedDialogWithAppleScript({
          title: dialogTitle,
          cause,
          remediation,
          runner: dialogRunner,
        });
        selectedButton = fallbackDialog.selectedButton;
      }
    } else {
      const fallbackDialog = runBlockedDialogWithAppleScript({
        title: dialogTitle,
        cause,
        remediation,
        runner: dialogRunner,
      });
      selectedButton = fallbackDialog.selectedButton;
    }

    if (selectedButton) {
      params.applyDialogChoice({
        repoRoot: params.repoRoot,
        config: params.config,
        button: selectedButton,
        nowMs: params.nowMs,
      });
    }
  }

  return { delivered: true, reason: 'delivered' };
};
