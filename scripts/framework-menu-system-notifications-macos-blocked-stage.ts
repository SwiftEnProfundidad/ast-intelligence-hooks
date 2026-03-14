import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationCommandRunnerWithOutput,
  SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';
import { maybeDispatchBlockedMacOsDialog } from './framework-menu-system-notifications-macos-blocked-dispatch';

export const emitMacOsBlockedDialogStage = (params: {
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
}): void =>
  maybeDispatchBlockedMacOsDialog({
    event: params.event,
    repoRoot: params.repoRoot,
    config: params.config,
    env: params.env,
    nowMs: params.nowMs,
    runCommandWithOutput: params.runCommandWithOutput,
    applyDialogChoice: params.applyDialogChoice,
  });
