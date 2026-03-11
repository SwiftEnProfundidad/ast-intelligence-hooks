import type {
  SystemNotificationCommandRunner,
  SystemNotificationEmitResult,
  SystemNotificationPayload,
} from './framework-menu-system-notifications-types';
import { deliverMacOsBanner } from './framework-menu-system-notifications-macos-banner';

export const dispatchMacOsNotificationBanner = (params: {
  payload: SystemNotificationPayload;
  runner: SystemNotificationCommandRunner;
}): SystemNotificationEmitResult =>
  deliverMacOsBanner({
    payload: params.payload,
    runCommand: params.runner,
  });
