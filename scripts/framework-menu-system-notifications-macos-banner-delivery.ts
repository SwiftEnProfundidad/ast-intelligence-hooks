import type {
  SystemNotificationCommandRunner,
  SystemNotificationEmitResult,
  SystemNotificationPayload,
} from './framework-menu-system-notifications-types';
import { deliverMacOsBanner } from './framework-menu-system-notifications-macos-banner';
import { runSystemCommand } from './framework-menu-system-notifications-macos-runner';

export const deliverMacOsNotificationBanner = (params: {
  payload: SystemNotificationPayload;
  runCommand?: SystemNotificationCommandRunner;
}): SystemNotificationEmitResult =>
  deliverMacOsBanner({
    payload: params.payload,
    runCommand: params.runCommand ?? runSystemCommand,
  });
