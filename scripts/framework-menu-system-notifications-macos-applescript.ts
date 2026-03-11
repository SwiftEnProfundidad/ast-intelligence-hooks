import {
  type SystemNotificationCommandRunnerWithOutput,
} from './framework-menu-system-notifications-types';
export {
  escapeAppleScriptString,
  buildDisplayNotificationScript,
} from './framework-menu-system-notifications-macos-applescript-banner';
export { buildDisplayDialogScript } from './framework-menu-system-notifications-macos-applescript-dialog';
export { parseAppleScriptDialogSelection } from './framework-menu-system-notifications-macos-applescript-parse';
import { buildDisplayDialogScript } from './framework-menu-system-notifications-macos-applescript-dialog';
import { parseAppleScriptDialogSelection } from './framework-menu-system-notifications-macos-applescript-parse';

export const runBlockedDialogWithAppleScript = (params: {
  title: string;
  cause: string;
  remediation: string;
  runner: SystemNotificationCommandRunnerWithOutput;
}): {
  selectedButton: string | null;
  commandFailed: boolean;
} => {
  const dialogScript = buildDisplayDialogScript({
    title: params.title,
    cause: params.cause,
    remediation: params.remediation,
  });
  const dialogResult = params.runner('osascript', ['-e', dialogScript]);
  if (dialogResult.exitCode !== 0) {
    return {
      selectedButton: null,
      commandFailed: true,
    };
  }
  return {
    selectedButton: parseAppleScriptDialogSelection(dialogResult.stdout),
    commandFailed: false,
  };
};
