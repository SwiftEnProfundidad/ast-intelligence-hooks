import { isMutedAt } from './framework-menu-system-notifications-config';
import type {
  SystemNotificationEmitResult,
  SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';
import { isTruthyEnvValue } from './framework-menu-system-notifications-env';

const isDisabledEnvValue = (value?: string): boolean => {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off';
};

export const resolveSystemNotificationGate = (params: {
  config: SystemNotificationsConfig;
  nowMs: number;
  env?: NodeJS.ProcessEnv;
}): SystemNotificationEmitResult | null => {
  if (
    isTruthyEnvValue(params.env?.PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS) ||
    isDisabledEnvValue(params.env?.PUMUKI_SYSTEM_NOTIFICATIONS) ||
    isDisabledEnvValue(params.env?.PUMUKI_NOTIFICATIONS)
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
