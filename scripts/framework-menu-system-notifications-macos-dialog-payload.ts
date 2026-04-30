import type { PumukiCriticalNotificationEvent } from './framework-menu-system-notifications-types';
import {
  resolveBlockedCauseSummary,
  resolveBlockedCommand,
  resolveBlockedImpactSummary,
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
  const cause = [
    `Causa: ${resolveBlockedCauseSummary(params.event, causeCode)}`,
    `Impacto: ${resolveBlockedImpactSummary(params.event, causeCode)}`,
  ].join('\n');
  const remediation = [
    `Comando: ${resolveBlockedCommand({
      event: params.event,
      repoRoot: params.repoRoot,
      causeCode,
    })}`,
    `Siguiente acción: ${resolveBlockedRemediation(params.event, causeCode)}`,
  ].join('\n');
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
