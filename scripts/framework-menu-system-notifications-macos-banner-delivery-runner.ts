import type {
  SystemNotificationCommandRunner,
  SystemNotificationPayload,
} from './framework-menu-system-notifications-types';
import { runSystemCommand } from './framework-menu-system-notifications-macos-runner';

export type MacOsBannerDeliveryParams = {
  payload: SystemNotificationPayload;
  runCommand?: SystemNotificationCommandRunner;
};

export const resolveMacOsBannerDeliveryRunner = (
  params: MacOsBannerDeliveryParams,
): SystemNotificationCommandRunner => params.runCommand ?? runSystemCommand;
