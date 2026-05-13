import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationPayload,
} from './framework-menu-system-notifications-types';
import {
  resolveNotificationProjectPrefix,
  resolveProjectLabel,
} from './framework-menu-system-notifications-payloads-context';
import { buildAuditSummaryPayload } from './framework-menu-system-notifications-payloads-audit';
import {
  buildGateBlockedPayload,
  resolveBlockedCauseSummary,
  resolveBlockedRemediation,
} from './framework-menu-system-notifications-payloads-blocked';
import {
  buildEvidenceStalePayload,
  buildGitflowViolationPayload,
} from './framework-menu-system-notifications-payloads-events';

export { resolveProjectLabel } from './framework-menu-system-notifications-payloads-context';
export {
  resolveBlockedCauseSummary,
  resolveBlockedRemediation,
} from './framework-menu-system-notifications-payloads-blocked';
export {
  buildAuditSummaryPayload,
} from './framework-menu-system-notifications-payloads-audit';
export {
  buildGateBlockedPayload,
} from './framework-menu-system-notifications-payloads-blocked';
export {
  buildEvidenceStalePayload,
  buildGitflowViolationPayload,
} from './framework-menu-system-notifications-payloads-events';

export const buildSystemNotificationPayload = (
  event: PumukiCriticalNotificationEvent,
  context?: {
    repoRoot?: string;
    projectLabel?: string;
  }
): SystemNotificationPayload => {
  const projectPrefix = resolveNotificationProjectPrefix(context);

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
