import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SYSTEM_NOTIFICATIONS_CONFIG_PATH, type SystemNotificationsConfig } from './framework-menu-system-notifications-types';

export const resolveSystemNotificationsConfigPath = (repoRoot: string): string => {
  return join(repoRoot, SYSTEM_NOTIFICATIONS_CONFIG_PATH);
};

export const writeSystemNotificationsConfigFile = (
  repoRoot: string,
  config: SystemNotificationsConfig
): string => {
  const configPath = resolveSystemNotificationsConfigPath(repoRoot);
  mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return configPath;
};

export const readSystemNotificationsConfigFile = (repoRoot: string): string | null => {
  const configPath = resolveSystemNotificationsConfigPath(repoRoot);
  if (!existsSync(configPath)) {
    return null;
  }
  return readFileSync(configPath, 'utf8');
};
