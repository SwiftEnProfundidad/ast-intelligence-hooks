import { isMutedAt } from './framework-menu-system-notifications-config';
import type {
  SystemNotificationEmitResult,
  SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';
import {
  isFalsyEnvValue,
  isTruthyEnvValue,
} from './framework-menu-system-notifications-env';

export const resolveSystemNotificationGate = (params: {
  config: SystemNotificationsConfig;
  nowMs: number;
  env?: NodeJS.ProcessEnv;
}): SystemNotificationEmitResult | null => {
  if (
    isTruthyEnvValue(params.env?.PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS) ||
    isFalsyEnvValue(params.env?.PUMUKI_SYSTEM_NOTIFICATIONS) ||
    isFalsyEnvValue(params.env?.PUMUKI_NOTIFICATIONS)
  ) {
    return { delivered: false, reason: 'disabled' };
  }
  if (!params.config.enabled) {
    return { delivered: false, reason: 'disabled' };
  }
  if (isMutedAt(params.config, params.nowMs)) {
    return { delivered: false, reason: 'muted' };
  }
  return null;
};
