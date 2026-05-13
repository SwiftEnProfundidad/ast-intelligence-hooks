import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationPayload,
} from './framework-menu-system-notifications-types';

export const buildAuditSummaryPayload = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'audit.summary' }>
): SystemNotificationPayload => {
  if (event.criticalViolations > 0) {
    return {
      title: 'AST Audit Blocked',
      message: `🔴 ${event.criticalViolations} CRITICAL, ${event.highViolations} HIGH violations`,
    };
  }
  if (event.highViolations > 0) {
    return {
      title: 'AST Audit Blocked',
      message: `🟡 ${event.highViolations} HIGH violations found`,
    };
  }
  if (event.totalViolations > 0) {
    return {
      title: 'AST Audit Blocked',
      message: `🔴 ${event.totalViolations} violations block the gate`,
    };
  }
  return {
    title: 'AST Audit Complete',
    message: '✅ No violations found',
  };
};
