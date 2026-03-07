import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationCommandRunnerWithOutput,
  SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';
import { maybeHandleBlockedMacOsDialog } from './framework-menu-system-notifications-macos-dialog';
import { runSystemCommandWithOutput } from './framework-menu-system-notifications-macos-runner';

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
  if (params.event.kind !== 'gate.blocked' || !params.repoRoot) {
    return;
  }

  maybeHandleBlockedMacOsDialog({
    event: params.event,
    repoRoot: params.repoRoot,
    config: params.config,
    env: params.env,
    nowMs: params.nowMs,
    runCommandWithOutput: params.runCommandWithOutput ?? runSystemCommandWithOutput,
    applyDialogChoice: params.applyDialogChoice,
  });
};
