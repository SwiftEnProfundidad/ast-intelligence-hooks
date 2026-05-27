import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationPayload,
} from './framework-menu-system-notifications-types';

export const buildAuditSummaryPayload = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'audit.summary' }>
): SystemNotificationPayload => {
  if (event.criticalViolations > 0) {
    return {
      title: 'Pumuki audit: resumen',
      message: `Hay ${event.criticalViolations} críticas y ${event.highViolations} high. Abre el bloqueo detallado para ver regla, fichero y solución.`,
    };
  }
  if (event.highViolations > 0) {
    return {
      title: 'Pumuki audit: resumen',
      message: `Hay ${event.highViolations} high. Abre el bloqueo detallado para ver regla, fichero y solución.`,
    };
  }
  if (event.totalViolations > 0) {
    return {
      title: 'Pumuki audit: resumen',
      message: `Hay ${event.totalViolations} violaciones. Abre el bloqueo detallado para ver regla, fichero y solución.`,
    };
  }
  return {
    title: 'Pumuki audit: OK',
    message: 'No se han detectado violaciones.',
  };
};
