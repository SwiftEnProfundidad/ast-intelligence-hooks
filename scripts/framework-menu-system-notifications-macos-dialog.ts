import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationCommandRunnerWithOutput,
  SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';
import { runSystemCommandWithOutput } from './framework-menu-system-notifications-macos-runner';
import { runBlockedDialogByMode } from './framework-menu-system-notifications-macos-dialog-mode';
import {
  resolveBlockedCauseSummary,
  resolveBlockedRemediation,
  resolveProjectLabel,
} from './framework-menu-system-notifications-payloads';

const isTruthyFlag = (value?: string): boolean => {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

export const resolveBlockedDialogEnabled = (params: {
  env: NodeJS.ProcessEnv;
  config: SystemNotificationsConfig;
}): boolean => {
  const raw = params.env.PUMUKI_MACOS_BLOCKED_DIALOG;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return isTruthyFlag(raw);
  }
  return params.config.blockedDialogEnabled !== false;
};

export const maybeHandleBlockedMacOsDialog = (params: {
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>;
  repoRoot: string;
  config: SystemNotificationsConfig;
  env: NodeJS.ProcessEnv;
  nowMs: number;
  runCommandWithOutput?: SystemNotificationCommandRunnerWithOutput;
  applyDialogChoice: (params: {
    repoRoot: string;
    config: SystemNotificationsConfig;
    button: string;
    nowMs: number;
  }) => void;
}): void => {
  if (!resolveBlockedDialogEnabled({ env: params.env, config: params.config })) {
    return;
  }

  const causeCode = params.event.causeCode ?? 'GATE_BLOCKED';
  const cause = resolveBlockedCauseSummary(params.event, causeCode);
  const remediation = resolveBlockedRemediation(params.event, causeCode);
  const projectLabel = resolveProjectLabel({
    repoRoot: params.repoRoot,
    projectLabel: params.env.PUMUKI_PROJECT_LABEL,
  });
  const dialogTitle = projectLabel
    ? `🔴 Pumuki bloqueado · ${projectLabel}`
    : '🔴 Pumuki bloqueado';
  const dialogRunner = params.runCommandWithOutput ?? runSystemCommandWithOutput;
  const selectedButton = runBlockedDialogByMode({
    env: params.env,
    repoRoot: params.repoRoot,
    title: dialogTitle,
    cause,
    remediation,
    runner: dialogRunner,
  });

  if (!selectedButton) {
    return;
  }

  params.applyDialogChoice({
    repoRoot: params.repoRoot,
    config: params.config,
    button: selectedButton,
    nowMs: params.nowMs,
  });
};
