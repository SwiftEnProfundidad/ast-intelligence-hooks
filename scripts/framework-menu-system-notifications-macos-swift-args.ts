import {
  BLOCKED_DIALOG_DISABLE,
  BLOCKED_DIALOG_KEEP,
  BLOCKED_DIALOG_MUTE_30,
  BLOCKED_DIALOG_TIMEOUT_SECONDS,
  type BlockedDialogMode,
} from './framework-menu-system-notifications-types';

export const resolveBlockedDialogMode = (env: NodeJS.ProcessEnv): BlockedDialogMode => {
  const raw = env.PUMUKI_MACOS_BLOCKED_DIALOG_MODE?.trim().toLowerCase();
  if (raw === 'applescript' || raw === 'swift-floating') {
    return raw;
  }
  return 'auto';
};

export const buildSwiftFloatingDialogArgs = (params: {
  scriptPath: string;
  title: string;
  cause: string;
  remediation: string;
}): ReadonlyArray<string> => [
  params.scriptPath,
  '--title',
  params.title,
  '--cause',
  params.cause,
  '--remediation',
  params.remediation,
  '--disable-button',
  BLOCKED_DIALOG_DISABLE,
  '--mute-button',
  BLOCKED_DIALOG_MUTE_30,
  '--keep-button',
  BLOCKED_DIALOG_KEEP,
  '--timeout-seconds',
  String(BLOCKED_DIALOG_TIMEOUT_SECONDS),
];
