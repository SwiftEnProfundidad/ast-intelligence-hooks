import type { SystemNotificationsConfig } from './framework-menu-system-notifications-types';

export const applyBlockedDialogSelection = (params: {
  repoRoot: string;
  config: SystemNotificationsConfig;
  selectedButton: string | null;
  nowMs: number;
  applyDialogChoice: (params: {
    repoRoot: string;
    config: SystemNotificationsConfig;
    button: string;
    nowMs: number;
  }) => void;
}): void => {
  if (!params.selectedButton) {
    return;
  }

  params.applyDialogChoice({
    repoRoot: params.repoRoot,
    config: params.config,
    button: params.selectedButton,
    nowMs: params.nowMs,
  });
};
