export type SystemNotificationsConfig = {
  enabled: boolean;
  channel: 'macos';
  muteUntil?: string;
  blockedDialogEnabled?: boolean;
};

export const SYSTEM_NOTIFICATIONS_CONFIG_PATH = '.pumuki/system-notifications.json';
