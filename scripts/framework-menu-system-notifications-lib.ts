import type {
  PumukiCriticalNotificationEvent,
  PumukiNotificationStage,
  SystemNotificationCommandRunner,
  SystemNotificationCommandRunnerWithOutput,
  SystemNotificationEmitResult,
  SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';
import {
  applyDialogChoice,
  buildSystemNotificationsConfigFromSelection,
  isMutedAt,
  persistSystemNotificationsConfig,
  readSystemNotificationsConfig,
} from './framework-menu-system-notifications-config';
import { deliverMacOsNotification } from './framework-menu-system-notifications-macos';
import { buildSystemNotificationPayload } from './framework-menu-system-notifications-payloads';

export {
  buildSystemNotificationsConfigFromSelection,
  buildSystemNotificationPayload,
  persistSystemNotificationsConfig,
  readSystemNotificationsConfig,
};
export type {
  PumukiCriticalNotificationEvent,
  PumukiNotificationStage,
  SystemNotificationEmitResult,
  SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';

export const emitSystemNotification = (params: {
  event: PumukiCriticalNotificationEvent;
  platform?: NodeJS.Platform;
  runCommand?: SystemNotificationCommandRunner;
  runCommandWithOutput?: SystemNotificationCommandRunnerWithOutput;
  repoRoot?: string;
  config?: SystemNotificationsConfig;
  env?: NodeJS.ProcessEnv;
  now?: () => number;
}): SystemNotificationEmitResult => {
  const config =
    params.config ??
    (params.repoRoot
      ? readSystemNotificationsConfig(params.repoRoot)
      : buildSystemNotificationsConfigFromSelection(true));
  if (!config.enabled) {
    return { delivered: false, reason: 'disabled' };
  }
  const nowMs = (params.now ?? Date.now)();
  if (isMutedAt(config, nowMs)) {
    return { delivered: false, reason: 'muted' };
  }

  const platform = params.platform ?? process.platform;
  if (platform !== 'darwin') {
    return { delivered: false, reason: 'unsupported-platform' };
  }

  const payload = buildSystemNotificationPayload(params.event, {
    repoRoot: params.repoRoot,
    projectLabel: params.env?.PUMUKI_PROJECT_LABEL,
  });
  return deliverMacOsNotification({
    event: params.event,
    payload,
    repoRoot: params.repoRoot,
    config,
    env: params.env ?? process.env,
    nowMs,
    runCommand: params.runCommand,
    runCommandWithOutput: params.runCommandWithOutput,
    applyDialogChoice,
  });
};
