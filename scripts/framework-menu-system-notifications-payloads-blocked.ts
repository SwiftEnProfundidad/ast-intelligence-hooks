import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationPayload,
} from './framework-menu-system-notifications-types';
import { resolveBlockedCauseSummary } from './framework-menu-system-notifications-cause';
import { resolveBlockedRemediation } from './framework-menu-system-notifications-remediation';
import {
  normalizeNotificationText,
  truncateNotificationText,
} from './framework-menu-system-notifications-text';

export {
  resolveBlockedCauseSummary,
} from './framework-menu-system-notifications-cause';
export {
  resolveBlockedRemediation,
} from './framework-menu-system-notifications-remediation';

type BlockedCause = NonNullable<
  Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']
>[number];

const isSkillCause = (cause: BlockedCause): boolean => {
  const ruleId = cause.ruleId ?? '';
  const code = cause.code ?? '';
  return ruleId.startsWith('skills.') || code.startsWith('SKILLS_');
};

const formatCauseLocation = (cause: BlockedCause): string => {
  if (!cause.file) {
    return 'sin fichero';
  }
  const baseFile = cause.file.split('/').filter(Boolean).pop() ?? cause.file;
  const lineMatch = cause.message.match(/\blines?=([0-9][0-9,\-\s]*)\b/i);
  if (!lineMatch?.[1]) {
    return baseFile;
  }
  return `${baseFile}:${lineMatch[1].replace(/\s+/g, '')}`;
};

const formatCauseRule = (cause: BlockedCause): string => cause.ruleId ?? cause.code;

const extractMessageField = (message: string, field: string): string | null => {
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = message.match(new RegExp(`\\b${escapedField}=([^\\n]+?)(?=\\s(?:severity|code|rule|file|lines?|message|remediation|snippet|node|primary_node|missing)=|$)`, 'i'));
  const value = match?.[1]?.trim();
  return value && value.length > 0 ? normalizeNotificationText(value) : null;
};

const stripTechnicalFieldsFromMessage = (message: string): string =>
  normalizeNotificationText(message)
    .replace(/\bseverity=[A-Z]+\b/gi, '')
    .replace(/\bcode=[A-Z0-9_]+\b/gi, '')
    .replace(/\brule=[^\s]+/gi, '')
    .replace(/\bfile=[^\s]+/gi, '')
    .replace(/\blines?=[0-9][0-9,\-\s]*/gi, '')
    .replace(/\bmessage=/gi, '')
    .replace(/\bremediation=/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

const formatCauseProblem = (cause: BlockedCause): string => {
  const messageField = extractMessageField(cause.message, 'message');
  if (messageField) {
    return messageField;
  }
  return stripTechnicalFieldsFromMessage(cause.message) || cause.code;
};

const formatCauseFix = (cause: BlockedCause): string =>
  normalizeNotificationText(
    cause.remediation ??
    'Corrige la violación indicada con regla, fichero y línea, y vuelve a ejecutar el gate.'
  );

export const resolvePrioritizedBlockingCauses = (
  causes: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']
): ReadonlyArray<BlockedCause> => {
  if (!causes || causes.length === 0) {
    return [];
  }
  return [...causes].sort((left, right) => {
    const leftSkill = isSkillCause(left);
    const rightSkill = isSkillCause(right);
    if (leftSkill !== rightSkill) {
      return leftSkill ? -1 : 1;
    }
    return 0;
  });
};

const buildBlockingCausesSummary = (
  causes: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']
): string | null => {
  const prioritized = resolvePrioritizedBlockingCauses(causes);
  if (prioritized.length === 0) {
    return null;
  }
  const first = prioritized[0];
  if (!first) {
    return null;
  }
  const prefix = isSkillCause(first) ? 'Skill violada' : 'Causa bloqueante';
  const overflow = prioritized.length > 1 ? ` (+${prioritized.length - 1} más)` : '';
  return `${prefix}: ${formatCauseRule(first)} · ${formatCauseLocation(first)}${overflow}`;
};

const buildBlockingCausesRemediation = (
  causes: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']
): string | null => {
  const prioritized = resolvePrioritizedBlockingCauses(causes);
  if (prioritized.length === 0) {
    return null;
  }
  const first = prioritized[0];
  if (!first) {
    return null;
  }
  if (isSkillCause(first)) {
    return [
      `Regla: ${formatCauseRule(first)}.`,
      `Fichero: ${formatCauseLocation(first)}.`,
      `Viola: ${formatCauseProblem(first)}.`,
      `Solución: ${formatCauseFix(first)}.`,
      prioritized.length > 1 ? `Quedan ${prioritized.length - 1} causa(s) más en el reporte completo.` : '',
    ]
      .filter((line) => line.length > 0)
      .join(' ');
  }
  return `${formatCauseFix(first)} Revisa el reporte completo para el resto de causas bloqueantes.`;
};

export const buildGateBlockedPayload = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>,
  projectPrefix: string
): SystemNotificationPayload => {
  const causeCode = event.causeCode ?? 'GATE_BLOCKED';
  const causeSummary = truncateNotificationText(
    buildBlockingCausesSummary(event.blockingCauses) ?? resolveBlockedCauseSummary(event, causeCode),
    72
  );
  const remediation =
    buildBlockingCausesRemediation(event.blockingCauses) ?? resolveBlockedRemediation(event, causeCode);
  return {
    title: '🔴 Pumuki bloqueado',
    subtitle: `${projectPrefix}${event.stage} · ${causeSummary}`,
    message: `Solución: ${remediation}`,
    soundName: 'Basso',
  };
};
