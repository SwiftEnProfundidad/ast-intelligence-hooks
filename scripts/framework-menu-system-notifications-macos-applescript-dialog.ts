import {
  BLOCKED_DIALOG_DISABLE,
  BLOCKED_DIALOG_KEEP,
  BLOCKED_DIALOG_MUTE_30,
} from './framework-menu-system-notifications-types';
import { escapeAppleScriptString } from './framework-menu-system-notifications-macos-applescript-banner';

export const buildDisplayDialogScript = (params: {
  title: string;
  cause: string;
  remediation: string;
}): string => {
  const title = escapeAppleScriptString(params.title);
  const cause = escapeAppleScriptString(params.cause);
  const remediation = escapeAppleScriptString(params.remediation);
  const message = escapeAppleScriptString(`${cause}\n\n${remediation}`);
  return `display dialog "${message}" with title "${title}" buttons {"${BLOCKED_DIALOG_DISABLE}", "${BLOCKED_DIALOG_MUTE_30}", "${BLOCKED_DIALOG_KEEP}"} default button "${BLOCKED_DIALOG_KEEP}" with icon stop giving up after 15`;
};
