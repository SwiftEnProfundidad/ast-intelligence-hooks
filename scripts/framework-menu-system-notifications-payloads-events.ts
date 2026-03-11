import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationPayload,
} from './framework-menu-system-notifications-types';

export const buildEvidenceStalePayload = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'evidence.stale' }>
): SystemNotificationPayload => ({
  title: '🟡 Pumuki · evidencia desactualizada',
  message: `Actualiza evidencia (${event.ageMinutes} min): ${event.evidencePath}.`,
});

export const buildGitflowViolationPayload = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gitflow.violation' }>
): SystemNotificationPayload => ({
  title: '🔴 Pumuki · bloqueo GitFlow',
  message: `La rama ${event.currentBranch} no cumple GitFlow (${event.reason}).`,
});
