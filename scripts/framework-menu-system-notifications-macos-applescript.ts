import {
  BLOCKED_DIALOG_DISABLE,
  BLOCKED_DIALOG_KEEP,
  BLOCKED_DIALOG_MUTE_30,
  type SystemNotificationCommandRunnerWithOutput,
  type SystemNotificationPayload,
} from './framework-menu-system-notifications-types';
import { extractDialogButton } from './framework-menu-system-notifications-macos-runner';

export const escapeAppleScriptString = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ').trim();

export const buildDisplayNotificationScript = (payload: SystemNotificationPayload): string => {
  const title = escapeAppleScriptString(payload.title);
  const message = escapeAppleScriptString(payload.message);
  const subtitleFragment = payload.subtitle
    ? ` subtitle "${escapeAppleScriptString(payload.subtitle)}"`
    : '';
  const soundFragment = payload.soundName
    ? ` sound name "${escapeAppleScriptString(payload.soundName)}"`
    : '';
  return `display notification "${message}" with title "${title}"${subtitleFragment}${soundFragment}`;
};

export const buildDisplayDialogScript = (params: {
  title: string;
  cause: string;
  remediation: string;
}): string => {
  const title = escapeAppleScriptString(params.title);
  const cause = escapeAppleScriptString(params.cause);
  const remediation = escapeAppleScriptString(params.remediation);
  const message = escapeAppleScriptString(`Causa: ${cause}\n\nSolución: ${remediation}`);
  return `display dialog "${message}" with title "${title}" buttons {"${BLOCKED_DIALOG_DISABLE}", "${BLOCKED_DIALOG_MUTE_30}", "${BLOCKED_DIALOG_KEEP}"} default button "${BLOCKED_DIALOG_KEEP}" with icon stop giving up after 15`;
};

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
    selectedButton: extractDialogButton(dialogResult.stdout),
    commandFailed: false,
  };
};
