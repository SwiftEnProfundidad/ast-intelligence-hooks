import type {
  BlockedDialogMode,
  SystemNotificationCommandRunnerWithOutput,
} from './framework-menu-system-notifications-types';
import { runBlockedDialogWithAppleScript } from './framework-menu-system-notifications-macos-applescript';
import { runBlockedDialogWithSwiftHelper } from './framework-menu-system-notifications-macos-swift';

type SwiftBlockedDialogRunner = typeof runBlockedDialogWithSwiftHelper;
type AppleScriptBlockedDialogRunner = typeof runBlockedDialogWithAppleScript;

export const dispatchBlockedDialogByMode = (params: {
  dialogMode: BlockedDialogMode;
  repoRoot: string;
  title: string;
  cause: string;
  remediation: string;
  runner: SystemNotificationCommandRunnerWithOutput;
  runSwiftDialog?: SwiftBlockedDialogRunner;
  runAppleScriptDialog?: AppleScriptBlockedDialogRunner;
}): string | null => {
  const runAppleScriptDialog =
    params.runAppleScriptDialog ?? runBlockedDialogWithAppleScript;
  if (params.dialogMode === 'applescript') {
    return runAppleScriptDialog({
      title: params.title,
      cause: params.cause,
      remediation: params.remediation,
      runner: params.runner,
    }).selectedButton;
  }

  const runSwiftDialog = params.runSwiftDialog ?? runBlockedDialogWithSwiftHelper;
  const swiftDialog = runSwiftDialog({
    repoRoot: params.repoRoot,
    title: params.title,
    cause: params.cause,
    remediation: params.remediation,
    runner: params.runner,
  });
  if (!swiftDialog.commandFailed) {
    return swiftDialog.selectedButton;
  }

  return runAppleScriptDialog({
    title: params.title,
    cause: params.cause,
    remediation: params.remediation,
    runner: params.runner,
  }).selectedButton;
};
