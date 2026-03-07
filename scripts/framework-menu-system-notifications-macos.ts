import {
  type PumukiCriticalNotificationEvent,
  type SystemNotificationEmitResult,
  type SystemNotificationCommandRunner,
  type SystemNotificationCommandRunnerWithOutput,
  type SystemNotificationPayload,
  type SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';
import { deliverMacOsBanner } from './framework-menu-system-notifications-macos-banner';
import {
  maybeHandleBlockedMacOsDialog,
  resolveBlockedDialogEnabled,
} from './framework-menu-system-notifications-macos-dialog';
import {
  runSystemCommand,
  runSystemCommandWithOutput,
} from './framework-menu-system-notifications-macos-runner';

export { runSystemCommand, runSystemCommandWithOutput } from './framework-menu-system-notifications-macos-runner';
export { resolveBlockedDialogEnabled } from './framework-menu-system-notifications-macos-dialog';

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
  const bannerResult = deliverMacOsBanner({
    payload: params.payload,
    runCommand: params.runCommand ?? runSystemCommand,
  });
  if (!bannerResult.delivered) {
    return bannerResult;
  }

  if (
    params.event.kind === 'gate.blocked'
    && params.repoRoot
  ) {
    maybeHandleBlockedMacOsDialog({
      event: params.event,
      repoRoot: params.repoRoot,
      config: params.config,
      env: params.env,
      nowMs: params.nowMs,
      runCommandWithOutput: params.runCommandWithOutput ?? runSystemCommandWithOutput,
      applyDialogChoice: params.applyDialogChoice,
    });
  }

  return { delivered: true, reason: 'delivered' };
};
