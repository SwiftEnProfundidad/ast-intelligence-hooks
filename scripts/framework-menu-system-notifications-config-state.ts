import type { SystemNotificationsConfig } from './framework-menu-system-notifications-types';
import { readSystemNotificationsConfigFile, writeSystemNotificationsConfigFile } from './framework-menu-system-notifications-config-file';

type RawSystemNotificationsConfig = {
  enabled?: unknown;
  channel?: unknown;
  muteUntil?: unknown;
  blockedDialogEnabled?: unknown;
};

export const buildSystemNotificationsConfigFromSelection = (
  enabled: boolean
): SystemNotificationsConfig => ({
  enabled,
  channel: 'macos',
  blockedDialogEnabled: enabled,
});

export const normalizeSystemNotificationsConfig = (
  raw: RawSystemNotificationsConfig
): SystemNotificationsConfig => {
  const enabled = raw.enabled === true;
  const blockedDialogEnabled =
    raw.blockedDialogEnabled === true
      ? true
      : raw.blockedDialogEnabled === false
        ? false
        : enabled;
  const config: SystemNotificationsConfig = {
    enabled,
    channel: 'macos',
    blockedDialogEnabled,
  };
  if (typeof raw.muteUntil === 'string' && raw.muteUntil.trim().length > 0) {
    config.muteUntil = raw.muteUntil;
  }
  return config;
};

export const persistSystemNotificationsConfig = (repoRoot: string, enabled: boolean): string => {
  return writeSystemNotificationsConfigFile(
    repoRoot,
    buildSystemNotificationsConfigFromSelection(enabled)
  );
};

export const readSystemNotificationsConfig = (repoRoot: string): SystemNotificationsConfig => {
  const content = readSystemNotificationsConfigFile(repoRoot);
  if (!content) {
    return buildSystemNotificationsConfigFromSelection(true);
  }

  try {
    return normalizeSystemNotificationsConfig(JSON.parse(content) as RawSystemNotificationsConfig);
  } catch {
    return buildSystemNotificationsConfigFromSelection(true);
  }
};

export const isMutedAt = (config: SystemNotificationsConfig, nowMs: number): boolean => {
  if (!config.muteUntil) {
    return false;
  }
  const parsed = Date.parse(config.muteUntil);
  if (!Number.isFinite(parsed)) {
    return false;
  }
  return parsed > nowMs;
};
