import { extractDialogButton } from './framework-menu-system-notifications-macos-runner';

export const parseAppleScriptDialogSelection = (stdout: string): string | null =>
  extractDialogButton(stdout);
