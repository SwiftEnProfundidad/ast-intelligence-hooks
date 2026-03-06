export type PumukiNotificationStage = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI' | 'PRE_WRITE';

export type PumukiCriticalNotificationEvent =
  | {
      kind: 'audit.summary';
      totalViolations: number;
      criticalViolations: number;
      highViolations: number;
    }
  | {
      kind: 'gate.blocked';
      stage: PumukiNotificationStage;
      totalViolations: number;
      causeCode?: string;
      causeMessage?: string;
      remediation?: string;
    }
  | {
      kind: 'evidence.stale';
      evidencePath: string;
      ageMinutes: number;
    }
  | {
      kind: 'gitflow.violation';
      currentBranch: string;
      reason: string;
    };

export type SystemNotificationPayload = {
  title: string;
  message: string;
  subtitle?: string;
  soundName?: string;
};

export type SystemNotificationsConfig = {
  enabled: boolean;
  channel: 'macos';
  muteUntil?: string;
  blockedDialogEnabled?: boolean;
};

export type SystemNotificationEmitResult =
  | { delivered: true; reason: 'delivered' }
  | { delivered: false; reason: 'disabled' | 'muted' | 'unsupported-platform' | 'command-failed' };

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

export const SYSTEM_NOTIFICATIONS_CONFIG_PATH = '.pumuki/system-notifications.json';
export const SWIFT_BLOCKED_DIALOG_SCRIPT_RELATIVE_PATH = '.pumuki/runtime/pumuki-blocked-dialog.swift';
export const BLOCKED_DIALOG_KEEP = 'Mantener activas';
export const BLOCKED_DIALOG_MUTE_30 = 'Silenciar 30 min';
export const BLOCKED_DIALOG_DISABLE = 'Desactivar';
export const BLOCKED_DIALOG_TIMEOUT_SECONDS = 15;
