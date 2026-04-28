export type NotificationTrackingContext = {
  activeEntry?: string;
  trackingSource?: string;
};

const TRACKING_CONTEXT_PATTERN = /\b(active_entries=|tracking_source=|TRACKING_CANONICAL_)/u;

export const extractNotificationTrackingContext = (
  message?: string
): NotificationTrackingContext | null => {
  if (!message || !TRACKING_CONTEXT_PATTERN.test(message)) {
    return null;
  }
  const activeEntry = message
    .match(/\bactive_entries=([^,\s]+)/u)?.[1]
    ?.replace(/@L\d+$/u, '')
    .trim();
  const trackingSource = message.match(/\btracking_source=([^\s]+)/u)?.[1]?.trim();
  return {
    activeEntry: activeEntry && activeEntry.length > 0 ? activeEntry : undefined,
    trackingSource: trackingSource && trackingSource.length > 0 ? trackingSource : undefined,
  };
};

export const buildNotificationTrackingCauseSummary = (
  context: NotificationTrackingContext
): string => {
  if (context.activeEntry && context.trackingSource) {
    return `Tracking bloqueado: ${context.activeEntry} en ${context.trackingSource}.`;
  }
  if (context.activeEntry) {
    return `Tracking bloqueado: ${context.activeEntry}.`;
  }
  if (context.trackingSource) {
    return `Tracking bloqueado en ${context.trackingSource}.`;
  }
  return 'El tracking canónico del repo bloquea la governance.';
};

export const TRACKING_BLOCKED_REMEDIATION =
  'Corrige el MD de tracking: deja una única tarea activa válida y vuelve a ejecutar el gate.';

