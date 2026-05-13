import type { PumukiCriticalNotificationEvent } from './framework-menu-system-notifications-types';
import {
  resolveBlockedCauseSummary,
  resolveBlockedRemediation,
  resolveProjectLabel,
} from './framework-menu-system-notifications-payloads';

export type BlockedDialogPayload = {
  title: string;
  cause: string;
  remediation: string;
};

export const buildBlockedDialogPayload = (params: {
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>;
  repoRoot: string;
  env: NodeJS.ProcessEnv;
}): BlockedDialogPayload => {
  const causeCode = params.event.causeCode ?? 'GATE_BLOCKED';
  const cause = resolveBlockedCauseSummary(params.event, causeCode);
  const remediation = resolveBlockedRemediation(params.event, causeCode);
  const projectLabel = resolveProjectLabel({
    repoRoot: params.repoRoot,
    projectLabel: params.env.PUMUKI_PROJECT_LABEL,
  });
  const title = projectLabel
    ? `🔴 Pumuki bloqueado · ${projectLabel}`
    : '🔴 Pumuki bloqueado';

  return {
    title,
    cause,
    remediation,
  };
};
