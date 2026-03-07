import type {
  SystemNotificationCommandRunner,
  SystemNotificationEmitResult,
  SystemNotificationPayload,
} from './framework-menu-system-notifications-types';
import { buildDisplayNotificationScript } from './framework-menu-system-notifications-macos-applescript';
import { runSystemCommand } from './framework-menu-system-notifications-macos-runner';

export const deliverMacOsBanner = (params: {
  payload: SystemNotificationPayload;
  runCommand?: SystemNotificationCommandRunner;
}): SystemNotificationEmitResult => {
  const runner = params.runCommand ?? runSystemCommand;
  const exitCode = runner('osascript', ['-e', buildDisplayNotificationScript(params.payload)]);
  if (exitCode !== 0) {
    return { delivered: false, reason: 'command-failed' };
  }
  return { delivered: true, reason: 'delivered' };
};
