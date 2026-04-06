import {
  BLOCKED_DIALOG_DISABLE,
  BLOCKED_DIALOG_KEEP,
  BLOCKED_DIALOG_MUTE_30,
  type SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';
import { writeSystemNotificationsConfigFile } from './framework-menu-system-notifications-config-file';

export const normalizeBlockedDialogButtonLabel = (raw: string): string => {
  const t = raw.replace(/\r/g, '').trim();
  const lower = t.toLowerCase();
  if (t === BLOCKED_DIALOG_DISABLE || lower.includes('desactivar')) {
    return BLOCKED_DIALOG_DISABLE;
  }
  if (
    t === BLOCKED_DIALOG_MUTE_30
    || (lower.includes('silenciar') && lower.includes('30'))
  ) {
    return BLOCKED_DIALOG_MUTE_30;
  }
  if (t === BLOCKED_DIALOG_KEEP || (lower.includes('mantener') && lower.includes('activ'))) {
    return BLOCKED_DIALOG_KEEP;
  }
  return t;
};

export const applyDialogChoice = (params: {
  repoRoot: string;
  config: SystemNotificationsConfig;
  button: string;
  nowMs: number;
}): void => {
  const button = normalizeBlockedDialogButtonLabel(params.button);
  if (button === BLOCKED_DIALOG_KEEP) {
    return;
  }
  if (button === BLOCKED_DIALOG_DISABLE) {
    writeSystemNotificationsConfigFile(params.repoRoot, {
      enabled: false,
      channel: params.config.channel,
      blockedDialogEnabled: params.config.blockedDialogEnabled === true,
    });
    return;
  }
  if (button === BLOCKED_DIALOG_MUTE_30) {
    const muteUntil = new Date(params.nowMs + 30 * 60_000).toISOString();
    writeSystemNotificationsConfigFile(params.repoRoot, {
      enabled: true,
      channel: params.config.channel,
      muteUntil,
      blockedDialogEnabled: params.config.blockedDialogEnabled === true,
    });
  }
};
