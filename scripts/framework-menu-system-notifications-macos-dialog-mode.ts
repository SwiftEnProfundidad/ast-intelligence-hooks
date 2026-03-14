import type { SystemNotificationCommandRunnerWithOutput } from './framework-menu-system-notifications-types';
import { dispatchBlockedDialogByMode } from './framework-menu-system-notifications-macos-dialog-mode-dispatch';
import { resolveMacOsBlockedDialogMode } from './framework-menu-system-notifications-macos-dialog-mode-resolve';

export const runBlockedDialogByMode = (params: {
  env: NodeJS.ProcessEnv;
  repoRoot: string;
  title: string;
  cause: string;
  remediation: string;
  runner: SystemNotificationCommandRunnerWithOutput;
}): string | null => {
  return dispatchBlockedDialogByMode({
    dialogMode: resolveMacOsBlockedDialogMode(params.env),
    repoRoot: params.repoRoot,
    title: params.title,
    cause: params.cause,
    remediation: params.remediation,
    runner: params.runner,
  });
};
