import { isMutedAt } from './framework-menu-system-notifications-config';
import type {
  SystemNotificationEmitResult,
  SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';

export const resolveSystemNotificationGate = (params: {
  config: SystemNotificationsConfig;
  nowMs: number;
  platform: NodeJS.Platform;
}): SystemNotificationEmitResult | null => {
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
