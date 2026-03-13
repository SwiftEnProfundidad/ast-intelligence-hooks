import { isMutedAt } from './framework-menu-system-notifications-config';
import type {
  SystemNotificationEmitResult,
  SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';

const isTruthyEnvValue = (value?: string): boolean => {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

export const resolveSystemNotificationGate = (params: {
  config: SystemNotificationsConfig;
  nowMs: number;
  platform: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
}): SystemNotificationEmitResult | null => {
  if (isTruthyEnvValue(params.env?.PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS)) {
    return { delivered: false, reason: 'disabled' };
  }
  if (!params.config.enabled) {
    return { delivered: false, reason: 'disabled' };
  }
  if (isMutedAt(params.config, params.nowMs)) {
    return { delivered: false, reason: 'muted' };
  }
  if (params.platform !== 'darwin') {
    return { delivered: false, reason: 'unsupported-platform' };
  }
  return null;
};
