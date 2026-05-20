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
    .flatMap((cause, index) => {
      const formatted = formatBlockingCauseForDialog(cause, index);
      return index === 0 ? formatted : ['', ...formatted];
    })
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

const extractFieldFromCauseMessage = (message: string, field: string): string | null => {
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = message.match(new RegExp(`\\b${escapedField}=([^\\n]+?)(?=\\s(?:severity|code|rule|file|lines?|message|remediation|snippet|node|primary_node|missing)=|$)`, 'i'));
  const value = match?.[1]?.trim();
  return value && value.length > 0 ? normalizeNotificationText(value) : null;
};

const extractSnippetFromCauseMessage = (message: string): string | null =>
  extractFieldFromCauseMessage(message, 'snippet') ??
  extractFieldFromCauseMessage(message, 'node') ??
  extractFieldFromCauseMessage(message, 'primary_node');

const extractMissingContractFromCauseMessage = (message: string): string | null => {
  const missing = extractFieldFromCauseMessage(message, 'missing')?.replace(/\]\]$/u, ']');
  if (!missing) {
    return null;
  }
  return `Falta: ${missing}`;
};

const buildEvidenceLine = (
  cause: NonNullable<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']>[number]
): string | null => {
  const snippet = extractSnippetFromCauseMessage(cause.message);
  if (snippet) {
    return `   Evidencia: ${truncateNotificationText(snippet, 160)}`;
  }
  const missing = extractMissingContractFromCauseMessage(cause.message);
  if (missing) {
    return `   Evidencia: ${truncateNotificationText(missing, 160)}`;
  }
  return null;
};

const formatLocation = (cause: NonNullable<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']>[number]): string => {
  if (!cause.file) {
    return 'sin fichero';
  }
  const line = extractLineFromCauseMessage(cause.message);
  return line ? `${cause.file}:${line}` : cause.file;
};

const isWorktreeHygieneCause = (
  cause: NonNullable<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']>[number]
): boolean =>
  cause.code === 'EVIDENCE_PREWRITE_WORKTREE_WARN' ||
  cause.code === 'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT' ||
  (cause.ruleId ?? '').includes('EVIDENCE_PREWRITE_WORKTREE');

const WORKTREE_HYGIENE_REMEDIATION =
  'Reduce el worktree pendiente a un slice atómico: stagea solo la tarea activa o guarda el resto en stash nombrado, y reejecuta PRE_WRITE.';

const formatBlockingCauseForDialog = (
  cause: NonNullable<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']>[number],
  index: number
): readonly string[] => {
  const rule = cause.ruleId ?? cause.code;
  const problem = stripTechnicalFieldsFromMessage(cause.message) || cause.code;
  const remediation = isWorktreeHygieneCause(cause)
    ? WORKTREE_HYGIENE_REMEDIATION
    : cause.remediation
    ? normalizeNotificationText(cause.remediation)
    : 'Corrige la violación indicada y vuelve a intentar el commit.';
  if (isWorktreeHygieneCause(cause)) {
    return [
      `${index + 1}. Aviso: higiene de worktree PRE_WRITE`,
      '   Alcance: repo/worktree',
      `   Detalle: ${truncateNotificationText(problem, 160)}`,
      `   Solución: ${truncateNotificationText(WORKTREE_HYGIENE_REMEDIATION, 180)}`,
    ];
  }

  return [
    `${index + 1}. Regla: ${truncateNotificationText(rule, 96)}`,
    `   Fichero: ${truncateNotificationText(formatLocation(cause), 120)}`,
    `   Viola: ${truncateNotificationText(problem, 160)}`,
    buildEvidenceLine(cause),
    `   Solución: ${truncateNotificationText(remediation, 180)}`,
  ].filter((line): line is string => typeof line === 'string');
};

const hasOnlyWorktreeHygieneCauses = (
  causes: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']
): boolean =>
  Boolean(causes?.length) && causes!.every(isWorktreeHygieneCause);

export const buildBlockedDialogPayload = (params: {
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>;
  repoRoot: string;
  env: NodeJS.ProcessEnv;
}): BlockedDialogPayload => {
  const causeCode = params.event.causeCode ?? 'GATE_BLOCKED';
  const cause = buildBlockingCausesDetails(params.event.blockingCauses)
    ?? resolveBlockedCauseSummary(params.event, causeCode);
  const remediation = hasOnlyWorktreeHygieneCauses(params.event.blockingCauses)
    ? WORKTREE_HYGIENE_REMEDIATION
    : params.event.blockingCauses && params.event.blockingCauses.length > 0
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
