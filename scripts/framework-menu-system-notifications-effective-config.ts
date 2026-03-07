import type { SystemNotificationsConfig } from './framework-menu-system-notifications-types';
import {
  buildSystemNotificationsConfigFromSelection,
  readSystemNotificationsConfig,
} from './framework-menu-system-notifications-config';

export const resolveEffectiveSystemNotificationsConfig = (params: {
  repoRoot?: string;
  config?: SystemNotificationsConfig;
}): SystemNotificationsConfig => {
  if (params.config) {
    return params.config;
  }
  if (params.repoRoot) {
    return readSystemNotificationsConfig(params.repoRoot);
  }
  return buildSystemNotificationsConfigFromSelection(true);
};
