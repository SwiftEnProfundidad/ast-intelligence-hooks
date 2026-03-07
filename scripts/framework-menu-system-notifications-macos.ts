import {
  type PumukiCriticalNotificationEvent,
  type SystemNotificationEmitResult,
  type SystemNotificationCommandRunner,
  type SystemNotificationCommandRunnerWithOutput,
  type SystemNotificationPayload,
  type SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';
import { resolveBlockedDialogEnabled } from './framework-menu-system-notifications-macos-dialog';
import { deliverMacOsNotificationBanner } from './framework-menu-system-notifications-macos-banner-delivery';
import { maybeDispatchBlockedMacOsDialog } from './framework-menu-system-notifications-macos-blocked-dispatch';
import { finalizeMacOsNotificationDelivery } from './framework-menu-system-notifications-macos-result';

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
  const bannerResult = deliverMacOsNotificationBanner({
    payload: params.payload,
    runCommand: params.runCommand,
  });

  maybeDispatchBlockedMacOsDialog({
    event: params.event,
    repoRoot: params.repoRoot,
    config: params.config,
    env: params.env,
    nowMs: params.nowMs,
    runCommandWithOutput: params.runCommandWithOutput,
    applyDialogChoice: params.applyDialogChoice,
  });

  return finalizeMacOsNotificationDelivery(bannerResult);
};
