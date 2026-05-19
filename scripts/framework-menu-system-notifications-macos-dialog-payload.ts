import type { PumukiCriticalNotificationEvent } from './framework-menu-system-notifications-types';
import {
  resolvePrioritizedBlockingCauses,
  resolveBlockedCauseSummary,
  resolveBlockedRemediation,
  resolveProjectLabel,
} from './framework-menu-system-notifications-payloads';
import {
  normalizeNotificationText,
  truncateNotificationText,
} from './framework-menu-system-notifications-text';

export type BlockedDialogPayload = {
  title: string;
  cause: string;
  remediation: string;
};

const buildBlockingCausesDetails = (
  causes: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']
): string | null => {
  if (!causes || causes.length === 0) {
    return null;
  }
  const total = causes.length;
  const header = total === 1
    ? 'Causas bloqueantes: 1'
    : `Causas bloqueantes: ${total}`;
  return resolvePrioritizedBlockingCauses(causes)
    .flatMap((cause, index) => formatBlockingCauseForDialog(cause, index))
    .reduce((lines, line) => [...lines, line], [header])
    .join('\n');
};

const extractLineFromCauseMessage = (message: string): string | null => {
  const lineMatch = message.match(/\blines?=([0-9][0-9,\-\s]*)\b/i);
  if (lineMatch?.[1]) {
    return lineMatch[1].replace(/\s+/g, '');
  }
  return null;
};

const stripTechnicalFieldsFromMessage = (message: string): string => {
  return normalizeNotificationText(message)
    .replace(/\bseverity=[A-Z]+\b/gi, '')
    .replace(/\bcode=[A-Z0-9_]+\b/gi, '')
    .replace(/\brule=[^\s]+/gi, '')
    .replace(/\bfile=[^\s]+/gi, '')
    .replace(/\blines?=[0-9][0-9,\-\s]*/gi, '')
    .replace(/\bmessage=/gi, '')
    .replace(/\bremediation=/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const formatLocation = (cause: NonNullable<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']>[number]): string => {
  if (!cause.file) {
    return 'sin fichero';
  }
  const line = extractLineFromCauseMessage(cause.message);
  return line ? `${cause.file}:${line}` : cause.file;
};

const formatBlockingCauseForDialog = (
  cause: NonNullable<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']>[number],
  index: number
): readonly string[] => {
  const rule = cause.ruleId ?? cause.code;
  const problem = stripTechnicalFieldsFromMessage(cause.message) || cause.code;
  const remediation = cause.remediation
    ? normalizeNotificationText(cause.remediation)
    : 'Corrige la violación indicada y vuelve a intentar el commit.';

  return [
    `${index + 1}. Regla: ${truncateNotificationText(rule, 96)}`,
    `   Fichero: ${truncateNotificationText(formatLocation(cause), 120)}`,
    `   Viola: ${truncateNotificationText(problem, 160)}`,
    `   Solución: ${truncateNotificationText(remediation, 180)}`,
  ];
};

export const buildBlockedDialogPayload = (params: {
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>;
  repoRoot: string;
  env: NodeJS.ProcessEnv;
}): BlockedDialogPayload => {
  const causeCode = params.event.causeCode ?? 'GATE_BLOCKED';
  const cause = buildBlockingCausesDetails(params.event.blockingCauses)
    ?? resolveBlockedCauseSummary(params.event, causeCode);
  const remediation = params.event.blockingCauses && params.event.blockingCauses.length > 0
    ? 'Corrige las violaciones listadas y vuelve a intentar el commit.'
    : resolveBlockedRemediation(params.event, causeCode);
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
