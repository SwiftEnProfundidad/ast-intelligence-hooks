import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationCommandRunnerWithOutput,
  SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';
import { runSystemCommandWithOutput } from './framework-menu-system-notifications-macos-runner';
import { runBlockedDialogByMode } from './framework-menu-system-notifications-macos-dialog-mode';
import { resolveBlockedDialogEnabled } from './framework-menu-system-notifications-macos-dialog-enabled';
import { buildBlockedDialogPayload } from './framework-menu-system-notifications-macos-dialog-payload';
import { applyBlockedDialogSelection } from './framework-menu-system-notifications-macos-dialog-effect';

export { resolveBlockedDialogEnabled } from './framework-menu-system-notifications-macos-dialog-enabled';

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

  const dialogPayload = buildBlockedDialogPayload({
    event: params.event,
    repoRoot: params.repoRoot,
    env: params.env,
  });
  const dialogRunner = params.runCommandWithOutput ?? runSystemCommandWithOutput;
  const selectedButton = runBlockedDialogByMode({
    env: params.env,
    repoRoot: params.repoRoot,
    title: dialogPayload.title,
    cause: dialogPayload.cause,
    remediation: dialogPayload.remediation,
    runner: dialogRunner,
  });

  applyBlockedDialogSelection({
    repoRoot: params.repoRoot,
    config: params.config,
    selectedButton,
    nowMs: params.nowMs,
    applyDialogChoice: params.applyDialogChoice,
  });
};
