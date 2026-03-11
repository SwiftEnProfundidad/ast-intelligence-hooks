import type {
  PumukiCriticalNotificationEvent,
  PumukiNotificationStage,
  SystemNotificationCommandRunner,
  SystemNotificationCommandRunnerWithOutput,
  SystemNotificationEmitResult,
  SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';
import {
  buildSystemNotificationsConfigFromSelection,
  persistSystemNotificationsConfig,
  readSystemNotificationsConfig,
} from './framework-menu-system-notifications-config';
import { dispatchSystemNotification } from './framework-menu-system-notifications-dispatch';
import { resolveEffectiveSystemNotificationsConfig } from './framework-menu-system-notifications-effective-config';
import { resolveSystemNotificationGate } from './framework-menu-system-notifications-gate';
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
  const config = resolveEffectiveSystemNotificationsConfig({
    repoRoot: params.repoRoot,
    config: params.config,
  });
  const nowMs = (params.now ?? Date.now)();
  const platform = params.platform ?? process.platform;
  const gateResult = resolveSystemNotificationGate({
    config,
    nowMs,
    platform,
  });
  if (gateResult) {
    return gateResult;
  }

  const payload = buildSystemNotificationPayload(params.event, {
    repoRoot: params.repoRoot,
    projectLabel: params.env?.PUMUKI_PROJECT_LABEL,
  });
  return dispatchSystemNotification({
    event: params.event,
    payload,
    repoRoot: params.repoRoot,
    config,
    env: params.env ?? process.env,
    nowMs,
    runCommand: params.runCommand,
    runCommandWithOutput: params.runCommandWithOutput,
  });
};
