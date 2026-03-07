import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationCommandRunner,
  SystemNotificationCommandRunnerWithOutput,
  SystemNotificationEmitResult,
  SystemNotificationPayload,
  SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';
import { applyDialogChoice } from './framework-menu-system-notifications-config';
import { deliverMacOsNotification } from './framework-menu-system-notifications-macos';

export const dispatchSystemNotification = (params: {
  event: PumukiCriticalNotificationEvent;
  payload: SystemNotificationPayload;
  repoRoot?: string;
  config: SystemNotificationsConfig;
  env: NodeJS.ProcessEnv;
  nowMs: number;
  runCommand?: SystemNotificationCommandRunner;
  runCommandWithOutput?: SystemNotificationCommandRunnerWithOutput;
}): SystemNotificationEmitResult =>
  deliverMacOsNotification({
    event: params.event,
    payload: params.payload,
    repoRoot: params.repoRoot,
    config: params.config,
    env: params.env,
    nowMs: params.nowMs,
    runCommand: params.runCommand,
    runCommandWithOutput: params.runCommandWithOutput,
    applyDialogChoice,
  });
