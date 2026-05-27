export type NotificationTrackingContext = {
  activeEntry?: string;
  trackingSource?: string;
  line?: string;
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
  const line = message.match(/\bline[_=]([0-9]+)\b/u)?.[1]?.trim();
  const trackingSource = message.match(/\btracking_source=([^\s]+)/u)?.[1]?.trim();
  return {
    activeEntry: activeEntry && activeEntry.length > 0 && !/^line_[0-9]+$/u.test(activeEntry)
      ? activeEntry
      : undefined,
    trackingSource: trackingSource && trackingSource.length > 0 ? trackingSource : undefined,
    line: line && line.length > 0 ? line : undefined,
  };
};

export const buildNotificationTrackingCauseSummary = (
  context: NotificationTrackingContext
): string => {
  const lineSuffix = context.line ? `, línea ${context.line}` : '';
  if (context.activeEntry && context.trackingSource) {
    return `Tracking bloqueado: ${context.activeEntry} en ${context.trackingSource}${lineSuffix}.`;
  }
  if (context.activeEntry) {
    return `Tracking bloqueado: ${context.activeEntry}${lineSuffix}.`;
  }
  if (context.trackingSource) {
    return `Tracking bloqueado en ${context.trackingSource}${lineSuffix}.`;
  }
  if (context.line) {
    return `Tracking bloqueado en la línea ${context.line}.`;
  }
  return 'El tracking canónico del repo bloquea la governance.';
};

export const TRACKING_BLOCKED_REMEDIATION =
  'Corrige el MD de tracking: deja una única tarea activa válida, elimina estados activos duplicados o inválidos y vuelve a intentar el commit.';

export const buildNotificationTrackingRemediation = (
  context: NotificationTrackingContext
): string => {
  const target = context.trackingSource
    ? `${context.trackingSource}${context.line ? `, línea ${context.line}` : ''}`
    : context.line
    ? `la línea ${context.line} del MD de tracking`
    : 'el MD de tracking';
  return `Abre el MD de tracking ${target}. Deja una única tarea activa válida, elimina estados activos duplicados o inválidos y vuelve a intentar el commit.`;
};
