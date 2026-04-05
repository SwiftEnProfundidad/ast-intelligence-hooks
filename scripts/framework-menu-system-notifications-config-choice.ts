import {
  BLOCKED_DIALOG_DISABLE,
  BLOCKED_DIALOG_KEEP,
  BLOCKED_DIALOG_MUTE_30,
  type SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';
import { writeSystemNotificationsConfigFile } from './framework-menu-system-notifications-config-file';

export const applyDialogChoice = (params: {
  repoRoot: string;
  config: SystemNotificationsConfig;
  button: string;
  nowMs: number;
}): void => {
  if (params.button === BLOCKED_DIALOG_KEEP) {
    return;
  }
  if (params.button === BLOCKED_DIALOG_DISABLE) {
    writeSystemNotificationsConfigFile(params.repoRoot, {
      enabled: false,
      channel: params.config.channel,
      blockedDialogEnabled: params.config.blockedDialogEnabled === true,
    });
    return;
  }
  if (params.button === BLOCKED_DIALOG_MUTE_30) {
    const muteUntil = new Date(params.nowMs + 30 * 60_000).toISOString();
    writeSystemNotificationsConfigFile(params.repoRoot, {
      enabled: true,
      channel: params.config.channel,
      muteUntil,
      blockedDialogEnabled: params.config.blockedDialogEnabled === true,
    });
  }
};
