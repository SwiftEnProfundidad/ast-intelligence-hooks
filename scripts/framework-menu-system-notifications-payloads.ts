import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationPayload,
} from './framework-menu-system-notifications-types';
import { resolveBlockedCauseSummary } from './framework-menu-system-notifications-cause';
import { resolveBlockedRemediation } from './framework-menu-system-notifications-remediation';
import {
  resolveProjectLabel,
  truncateNotificationText,
} from './framework-menu-system-notifications-text';

export {
  resolveBlockedCauseSummary,
} from './framework-menu-system-notifications-cause';
export {
  resolveBlockedRemediation,
} from './framework-menu-system-notifications-remediation';
export {
  resolveProjectLabel,
} from './framework-menu-system-notifications-text';

const buildAuditSummaryPayload = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'audit.summary' }>
): SystemNotificationPayload => {
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
};

const buildGateBlockedPayload = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>,
  projectPrefix: string
): SystemNotificationPayload => {
  const causeCode = event.causeCode ?? 'GATE_BLOCKED';
  const causeSummary = truncateNotificationText(
    resolveBlockedCauseSummary(event, causeCode),
    72
  );
  const remediation = resolveBlockedRemediation(event, causeCode);
  return {
    title: '🔴 Pumuki bloqueado',
    subtitle: `${projectPrefix}${event.stage} · ${causeSummary}`,
    message: `Solución: ${remediation}`,
    soundName: 'Basso',
  };
};

const buildEvidenceStalePayload = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'evidence.stale' }>
): SystemNotificationPayload => ({
  title: '🟡 Pumuki · evidencia desactualizada',
  message: `Actualiza evidencia (${event.ageMinutes} min): ${event.evidencePath}.`,
});

const buildGitflowViolationPayload = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gitflow.violation' }>
): SystemNotificationPayload => ({
  title: '🔴 Pumuki · bloqueo GitFlow',
  message: `La rama ${event.currentBranch} no cumple GitFlow (${event.reason}).`,
});

export const buildSystemNotificationPayload = (
  event: PumukiCriticalNotificationEvent,
  context?: {
    repoRoot?: string;
    projectLabel?: string;
  }
): SystemNotificationPayload => {
  const projectLabel = resolveProjectLabel({
    repoRoot: context?.repoRoot,
    projectLabel: context?.projectLabel,
  });
  const projectPrefix = projectLabel ? `${projectLabel} · ` : '';

  if (event.kind === 'audit.summary') {
    return buildAuditSummaryPayload(event);
  }
  if (event.kind === 'gate.blocked') {
    return buildGateBlockedPayload(event, projectPrefix);
  }
  if (event.kind === 'evidence.stale') {
    return buildEvidenceStalePayload(event);
  }
  return buildGitflowViolationPayload(event);
};
