import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BLOCKED_DIALOG_DISABLE,
  BLOCKED_DIALOG_KEEP,
  BLOCKED_DIALOG_MUTE_30,
  SYSTEM_NOTIFICATIONS_CONFIG_PATH,
  type SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';

const persistSystemNotificationsConfigFile = (
  repoRoot: string,
  config: SystemNotificationsConfig
): string => {
  const configPath = join(repoRoot, SYSTEM_NOTIFICATIONS_CONFIG_PATH);
  mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return configPath;
};

export const buildSystemNotificationsConfigFromSelection = (
  enabled: boolean
): SystemNotificationsConfig => ({
  enabled,
  channel: 'macos',
  blockedDialogEnabled: true,
});

export const persistSystemNotificationsConfig = (repoRoot: string, enabled: boolean): string => {
  return persistSystemNotificationsConfigFile(
    repoRoot,
    buildSystemNotificationsConfigFromSelection(enabled)
  );
};

export const readSystemNotificationsConfig = (repoRoot: string): SystemNotificationsConfig => {
  const configPath = join(repoRoot, SYSTEM_NOTIFICATIONS_CONFIG_PATH);
  if (!existsSync(configPath)) {
    return buildSystemNotificationsConfigFromSelection(true);
  }

  try {
    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as {
      enabled?: unknown;
      channel?: unknown;
      muteUntil?: unknown;
      blockedDialogEnabled?: unknown;
    };
    const config: SystemNotificationsConfig = {
      enabled: parsed.enabled === true,
      channel: 'macos',
      blockedDialogEnabled: parsed.blockedDialogEnabled !== false,
    };
    if (typeof parsed.muteUntil === 'string' && parsed.muteUntil.trim().length > 0) {
      config.muteUntil = parsed.muteUntil;
    }
    return config;
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
    persistSystemNotificationsConfigFile(params.repoRoot, {
      enabled: false,
      channel: params.config.channel,
      blockedDialogEnabled: params.config.blockedDialogEnabled !== false,
    });
    return;
  }
  if (params.button === BLOCKED_DIALOG_MUTE_30) {
    const minutes = 30;
    const muteUntil = new Date(params.nowMs + minutes * 60_000).toISOString();
    persistSystemNotificationsConfigFile(params.repoRoot, {
      enabled: true,
      channel: params.config.channel,
      muteUntil,
      blockedDialogEnabled: params.config.blockedDialogEnabled !== false,
    });
  }
};
