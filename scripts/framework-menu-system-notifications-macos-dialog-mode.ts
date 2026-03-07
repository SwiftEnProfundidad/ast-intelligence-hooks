import type { SystemNotificationCommandRunnerWithOutput } from './framework-menu-system-notifications-types';
import { runBlockedDialogWithAppleScript } from './framework-menu-system-notifications-macos-applescript';
import {
  resolveBlockedDialogMode,
  runBlockedDialogWithSwiftHelper,
} from './framework-menu-system-notifications-macos-swift';

export const runBlockedDialogByMode = (params: {
  env: NodeJS.ProcessEnv;
  repoRoot: string;
  title: string;
  cause: string;
  remediation: string;
  runner: SystemNotificationCommandRunnerWithOutput;
}): string | null => {
  const dialogMode = resolveBlockedDialogMode(params.env);

  if (dialogMode === 'applescript') {
    return runBlockedDialogWithAppleScript({
      title: params.title,
      cause: params.cause,
      remediation: params.remediation,
      runner: params.runner,
    }).selectedButton;
  }

  const swiftDialog = runBlockedDialogWithSwiftHelper({
    repoRoot: params.repoRoot,
    title: params.title,
    cause: params.cause,
    remediation: params.remediation,
    runner: params.runner,
  });
  if (!swiftDialog.commandFailed) {
    return swiftDialog.selectedButton;
  }

  return runBlockedDialogWithAppleScript({
    title: params.title,
    cause: params.cause,
    remediation: params.remediation,
    runner: params.runner,
  }).selectedButton;
};
