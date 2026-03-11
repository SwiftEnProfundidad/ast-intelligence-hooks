import type { SystemNotificationPayload } from './framework-menu-system-notifications-types';
import { buildDisplayNotificationScript } from './framework-menu-system-notifications-macos-applescript-banner';

export const buildMacOsBannerCommandArgs = (
  payload: SystemNotificationPayload,
): ReadonlyArray<string> => ['-e', buildDisplayNotificationScript(payload)];
