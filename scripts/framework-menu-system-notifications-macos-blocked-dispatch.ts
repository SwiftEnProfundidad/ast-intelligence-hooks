import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';
import { shouldDispatchBlockedMacOsDialog } from './framework-menu-system-notifications-macos-blocked-dispatch-gate';
import { resolveBlockedMacOsDialogRunner } from './framework-menu-system-notifications-macos-blocked-dispatch-runner';
import { maybeHandleBlockedMacOsDialog } from './framework-menu-system-notifications-macos-dialog';
import type {
  SystemNotificationCommandRunnerWithOutput,
} from './framework-menu-system-notifications-types';

export const maybeDispatchBlockedMacOsDialog = (params: {
  event: PumukiCriticalNotificationEvent;
  repoRoot?: string;
  config: SystemNotificationsConfig;
  env: NodeJS.ProcessEnv;
  nowMs: number;
  runCommandWithOutput?: SystemNotificationCommandRunnerWithOutput;
  applyDialogChoice: (params: {
    repoRoot: string;
    config: SystemNotificationsConfig;
    button: string;
    nowMs: number;
  }) => void;
}): void => {
  if (!shouldDispatchBlockedMacOsDialog(params)) {
    return;
  }

  maybeHandleBlockedMacOsDialog({
    event: params.event,
    repoRoot: params.repoRoot,
    config: params.config,
    env: params.env,
    nowMs: params.nowMs,
    runCommandWithOutput: resolveBlockedMacOsDialogRunner(params.runCommandWithOutput),
    applyDialogChoice: params.applyDialogChoice,
  });
};
