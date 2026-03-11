import type {
  SystemNotificationCommandRunnerWithOutput,
} from './framework-menu-system-notifications-types';
import { runSystemCommandWithOutput } from './framework-menu-system-notifications-macos-runner';

export const resolveBlockedMacOsDialogRunner = (
  runCommandWithOutput?: SystemNotificationCommandRunnerWithOutput,
): SystemNotificationCommandRunnerWithOutput =>
  runCommandWithOutput ?? runSystemCommandWithOutput;
