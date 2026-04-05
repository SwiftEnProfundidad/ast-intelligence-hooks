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
import { isTruthyEnvValue } from './framework-menu-system-notifications-env';
import {
  deliverStderrNotificationBanner,
  isStderrNotificationFallbackDisabled,
} from './framework-menu-system-notifications-stdio-fallback';

export const dispatchSystemNotification = (params: {
  event: PumukiCriticalNotificationEvent;
  payload: SystemNotificationPayload;
  platform: NodeJS.Platform;
  repoRoot?: string;
  config: SystemNotificationsConfig;
  env: NodeJS.ProcessEnv;
  nowMs: number;
  runCommand?: SystemNotificationCommandRunner;
  runCommandWithOutput?: SystemNotificationCommandRunnerWithOutput;
}): SystemNotificationEmitResult => {
  const stderrOff = isStderrNotificationFallbackDisabled(params.env);

  if (params.platform !== 'darwin') {
    if (stderrOff) {
      return { delivered: false, reason: 'unsupported-platform' };
    }
    return deliverStderrNotificationBanner({ payload: params.payload });
  }

  const macResult = deliverMacOsNotification({
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

  if (macResult.delivered && isTruthyEnvValue(params.env.PUMUKI_NOTIFICATION_STDERR_MIRROR)) {
    deliverStderrNotificationBanner({ payload: params.payload });
  }

  if (!macResult.delivered && macResult.reason === 'command-failed' && !stderrOff) {
    return deliverStderrNotificationBanner({ payload: params.payload });
  }

  return macResult;
};
