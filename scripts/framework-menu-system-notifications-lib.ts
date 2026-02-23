import { execFileSync as runBinarySync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

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
};

export type SystemNotificationsConfig = {
  enabled: boolean;
  channel: 'macos';
};

export type SystemNotificationEmitResult =
  | { delivered: true; reason: 'delivered' }
  | { delivered: false; reason: 'disabled' | 'unsupported-platform' | 'command-failed' };

type SystemNotificationCommandRunner = (
  command: string,
  args: ReadonlyArray<string>
) => number;

const SYSTEM_NOTIFICATIONS_CONFIG_PATH = '.pumuki/system-notifications.json';

const escapeAppleScriptString = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ').trim();

const buildDisplayNotificationScript = (payload: SystemNotificationPayload): string => {
  const title = escapeAppleScriptString(payload.title);
  const message = escapeAppleScriptString(payload.message);
  const subtitleFragment = payload.subtitle
    ? ` subtitle "${escapeAppleScriptString(payload.subtitle)}"`
    : '';
  return `display notification "${message}" with title "${title}"${subtitleFragment}`;
};

const runSystemCommand: SystemNotificationCommandRunner = (command, args) => {
  try {
    runBinarySync(command, [...args], { stdio: 'ignore' });
    return 0;
  } catch {
    return 1;
  }
};

export const buildSystemNotificationsConfigFromSelection = (
  enabled: boolean
): SystemNotificationsConfig => ({
  enabled,
  channel: 'macos',
});

export const persistSystemNotificationsConfig = (repoRoot: string, enabled: boolean): string => {
  const configPath = join(repoRoot, SYSTEM_NOTIFICATIONS_CONFIG_PATH);
  mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
  writeFileSync(
    configPath,
    `${JSON.stringify(buildSystemNotificationsConfigFromSelection(enabled), null, 2)}\n`,
    'utf8'
  );
  return configPath;
};

export const readSystemNotificationsConfig = (repoRoot: string): SystemNotificationsConfig => {
  const configPath = join(repoRoot, SYSTEM_NOTIFICATIONS_CONFIG_PATH);
  if (!existsSync(configPath)) {
    return buildSystemNotificationsConfigFromSelection(true);
  }

  try {
    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as {
      enabled?: unknown;
      channel?: unknown;
    };
    return {
      enabled: parsed.enabled === true,
      channel: 'macos',
    };
  } catch {
    return buildSystemNotificationsConfigFromSelection(true);
  }
};

export const buildSystemNotificationPayload = (
  event: PumukiCriticalNotificationEvent
): SystemNotificationPayload => {
  if (event.kind === 'audit.summary') {
    if (event.criticalViolations > 0) {
      return {
        title: 'AST Audit Complete',
        message: `🔴 ${event.criticalViolations} CRITICAL, ${event.highViolations} HIGH violations`,
      };
    }
    if (event.highViolations > 0) {
      return {
        title: 'AST Audit Complete',
        message: `🟡 ${event.highViolations} HIGH violations found`,
      };
    }
    if (event.totalViolations > 0) {
      return {
        title: 'AST Audit Complete',
        message: `🔵 ${event.totalViolations} violations (no blockers)`,
      };
    }
    return {
      title: 'AST Audit Complete',
      message: '✅ No violations found',
    };
  }

  if (event.kind === 'gate.blocked') {
    return {
      title: 'Pumuki · Gate BLOCK',
      subtitle: event.stage,
      message: `Detected ${event.totalViolations} blocking violations in stage ${event.stage}.`,
    };
  }

  if (event.kind === 'evidence.stale') {
    return {
      title: 'Pumuki · Evidence Stale',
      message: `${event.evidencePath} is stale (${event.ageMinutes} minutes old). Refresh evidence before continue.`,
    };
  }

  return {
    title: 'Pumuki · Git-Flow Violation',
    message: `Branch ${event.currentBranch} violates git-flow (${event.reason}).`,
  };
};

export const emitSystemNotification = (params: {
  event: PumukiCriticalNotificationEvent;
  platform?: NodeJS.Platform;
  runCommand?: SystemNotificationCommandRunner;
  repoRoot?: string;
  config?: SystemNotificationsConfig;
}): SystemNotificationEmitResult => {
  const config =
    params.config ??
    (params.repoRoot
      ? readSystemNotificationsConfig(params.repoRoot)
      : buildSystemNotificationsConfigFromSelection(true));
  if (!config.enabled) {
    return { delivered: false, reason: 'disabled' };
  }

  const platform = params.platform ?? process.platform;
  if (platform !== 'darwin') {
    return { delivered: false, reason: 'unsupported-platform' };
  }

  const runner = params.runCommand ?? runSystemCommand;
  const payload = buildSystemNotificationPayload(params.event);
  const script = buildDisplayNotificationScript(payload);
  const exitCode = runner('osascript', ['-e', script]);

  if (exitCode !== 0) {
    return { delivered: false, reason: 'command-failed' };
  }

  return { delivered: true, reason: 'delivered' };
};
