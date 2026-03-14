export type SystemNotificationCommandRunner = (
  command: string,
  args: ReadonlyArray<string>
) => number;

export type SystemNotificationCommandRunnerWithOutput = (
  command: string,
  args: ReadonlyArray<string>
) => {
  exitCode: number;
  stdout: string;
};

export type BlockedDialogMode = 'auto' | 'applescript' | 'swift-floating';

export const SWIFT_BLOCKED_DIALOG_SCRIPT_RELATIVE_PATH = '.pumuki/runtime/pumuki-blocked-dialog.swift';
export const BLOCKED_DIALOG_KEEP = 'Mantener activas';
export const BLOCKED_DIALOG_MUTE_30 = 'Silenciar 30 min';
export const BLOCKED_DIALOG_DISABLE = 'Desactivar';
export const BLOCKED_DIALOG_TIMEOUT_SECONDS = 15;
