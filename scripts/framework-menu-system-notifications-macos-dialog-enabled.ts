import type { SystemNotificationsConfig } from './framework-menu-system-notifications-types';

const isTruthyFlag = (value?: string): boolean => {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

export const resolveBlockedDialogEnabled = (params: {
  env: NodeJS.ProcessEnv;
  config: SystemNotificationsConfig;
}): boolean => {
  const raw = params.env.PUMUKI_MACOS_BLOCKED_DIALOG;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return isTruthyFlag(raw);
  }
  return params.config.blockedDialogEnabled !== false;
};
