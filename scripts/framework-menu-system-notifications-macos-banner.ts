import type {
  SystemNotificationCommandRunner,
  SystemNotificationPayload,
} from './framework-menu-system-notifications-types';
import { buildMacOsBannerCommandArgs } from './framework-menu-system-notifications-macos-banner-script';
import { resolveMacOsBannerResult } from './framework-menu-system-notifications-macos-banner-result';
import { runMacOsBannerCommand } from './framework-menu-system-notifications-macos-banner-run';
import { runSystemCommand } from './framework-menu-system-notifications-macos-runner';

export const deliverMacOsBanner = (params: {
  payload: SystemNotificationPayload;
  runCommand?: SystemNotificationCommandRunner;
}) => {
  const runner = params.runCommand ?? runSystemCommand;
  const args = buildMacOsBannerCommandArgs(params.payload);
  const exitCode = runMacOsBannerCommand({ runner, args });
  return resolveMacOsBannerResult(exitCode);
};
