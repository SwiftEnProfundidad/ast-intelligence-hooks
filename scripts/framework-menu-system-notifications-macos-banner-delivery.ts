import type {
  SystemNotificationEmitResult,
} from './framework-menu-system-notifications-types';
import {
  dispatchMacOsNotificationBanner,
} from './framework-menu-system-notifications-macos-banner-delivery-dispatch';
import type {
  MacOsBannerDeliveryParams,
} from './framework-menu-system-notifications-macos-banner-delivery-runner';
import {
  resolveMacOsBannerDeliveryRunner,
} from './framework-menu-system-notifications-macos-banner-delivery-runner';

export const deliverMacOsNotificationBanner = (params: {
  payload: MacOsBannerDeliveryParams['payload'];
  runCommand?: MacOsBannerDeliveryParams['runCommand'];
}): SystemNotificationEmitResult =>
  dispatchMacOsNotificationBanner({
    payload: params.payload,
    runner: resolveMacOsBannerDeliveryRunner(params),
  });
