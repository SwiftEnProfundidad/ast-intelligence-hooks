import type { SystemNotificationEmitResult } from './framework-menu-system-notifications-types';

export const resolveMacOsBannerResult = (
  exitCode: number,
): SystemNotificationEmitResult =>
  exitCode === 0
    ? { delivered: true, reason: 'delivered' }
    : { delivered: false, reason: 'command-failed' };
