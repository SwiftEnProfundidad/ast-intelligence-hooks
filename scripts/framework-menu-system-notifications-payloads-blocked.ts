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
  const remediation =
    first.remediation ??
    'Corrige la violación indicada con regla, fichero y línea, y vuelve a ejecutar el gate.';
  return `${remediation} Revisa el reporte completo para el resto de causas bloqueantes.`;
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
