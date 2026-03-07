import type { SystemNotificationCommandRunner } from './framework-menu-system-notifications-types';

export const runMacOsBannerCommand = (params: {
  runner: SystemNotificationCommandRunner;
  args: ReadonlyArray<string>;
}): number => params.runner('osascript', params.args);
