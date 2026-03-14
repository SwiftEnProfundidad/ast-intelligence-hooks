import type { SystemNotificationEmitResult } from './framework-menu-system-notifications-types';

export const finalizeMacOsNotificationDelivery = (
  bannerResult: SystemNotificationEmitResult
): SystemNotificationEmitResult => {
  if (!bannerResult.delivered) {
    return bannerResult;
  }

  return { delivered: true, reason: 'delivered' };
};
