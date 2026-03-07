import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationPayload,
} from './framework-menu-system-notifications-types';
import { resolveBlockedCauseSummary } from './framework-menu-system-notifications-cause';
import { resolveBlockedRemediation } from './framework-menu-system-notifications-remediation';
import { truncateNotificationText } from './framework-menu-system-notifications-text';

export {
  resolveBlockedCauseSummary,
} from './framework-menu-system-notifications-cause';
export {
  resolveBlockedRemediation,
} from './framework-menu-system-notifications-remediation';

export const buildGateBlockedPayload = (
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
