import type {
  SystemNotificationCommandRunner,
  SystemNotificationEmitResult,
  SystemNotificationPayload,
} from './framework-menu-system-notifications-types';
import { deliverMacOsNotificationBanner } from './framework-menu-system-notifications-macos-banner-delivery';

export const emitMacOsBannerStage = (params: {
  payload: SystemNotificationPayload;
  runCommand?: SystemNotificationCommandRunner;
}): SystemNotificationEmitResult =>
  deliverMacOsNotificationBanner({
    payload: params.payload,
    runCommand: params.runCommand,
  });
