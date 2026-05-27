import type { PumukiCriticalNotificationEvent } from './framework-menu-system-notifications-types';
import {
  normalizeNotificationText,
  truncateNotificationText,
} from './framework-menu-system-notifications-text';
import {
  buildNotificationTrackingCauseSummary,
  extractNotificationTrackingContext,
} from './framework-menu-system-notifications-tracking';
import { buildLegacySkillCauseSummary } from './framework-menu-system-notifications-legacy-skill-cause';

const BLOCKED_CAUSE_SUMMARY_BY_CODE: Readonly<Record<string, string>> = {
  EVIDENCE_GATE_BLOCKED: 'El gate de evidencia/gobernanza está bloqueado.',
  EVIDENCE_MISSING: 'Falta evidencia para validar este paso.',
  EVIDENCE_INVALID: 'La evidencia actual es inválida.',
  EVIDENCE_CHAIN_INVALID: 'La cadena de evidencia no es válida.',
  EVIDENCE_STALE: 'La evidencia está desactualizada.',
  EVIDENCE_BRANCH_MISMATCH: 'La evidencia no corresponde con la rama actual.',
  EVIDENCE_REPO_ROOT_MISMATCH: 'La evidencia no corresponde con este repositorio.',
  PRE_PUSH_UPSTREAM_MISSING: 'La rama no tiene upstream configurado.',
  GITFLOW_PROTECTED_BRANCH: 'No se permiten cambios directos en esta rama protegida.',
  SDD_SESSION_MISSING: 'No hay sesión SDD activa.',
  SDD_SESSION_INVALID: 'La sesión SDD actual no es válida.',
  OPENSPEC_MISSING: 'OpenSpec no está instalado en este repositorio.',
  MCP_ENTERPRISE_RECEIPT_MISSING: 'Falta el recibo enterprise de MCP.',
  BACKEND_AVOID_EXPLICIT_ANY: 'Se detectó uso de "any" explícito en backend.',
  GIT_ATOMICITY_TOO_MANY_SCOPES: 'El cambio toca demasiados scopes para un commit atómico.',
  TRACKING_CANONICAL_IN_PROGRESS_INVALID:
    'El tracking canónico tiene una tarea activa inválida.',
  TRACKING_CANONICAL_SOURCE_CONFLICT:
    'Hay conflicto entre fuentes de tracking canónico.',
  ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH:
    'No hay reglas activas para cambios de código.',
  EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING:
    'Falta enforcement crítico de skills para la plataforma detectada.',
  EVIDENCE_SKILLS_CONTRACT_INCOMPLETE:
    'El contrato de skills está incompleto para este stage.',
  CONTEXT_NOT_APPLIED:
    'Contexto local obligatorio no aplicado.',
  CONTEXT_INVALID:
    'Contexto local obligatorio inválido.',
};

const ENGLISH_CAUSE_HINTS = [
  'detected',
  'avoid explicit any',
  'evidence is',
  'no upstream',
  'too many scopes',
  'atomicity',
  'heuristic violation',
  'protected branch',
  'missing',
  'invalid',
  'failed',
  'session',
  'open spec',
  'openspec',
  'policy-as-code',
  'worktree',
  'callback usage',
  'usage.',
];

const PRIORITY_CODES_FROM_MESSAGE = [
  'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING',
  'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE',
  'ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH',
];

const resolvePriorityCauseFromMessage = (message?: string): string | null => {
  if (!message) {
    return null;
  }
  return PRIORITY_CODES_FROM_MESSAGE.find((code) => message.includes(code)) ?? null;
};

const isCauseCodePriorityOverTracking = (causeCode: string): boolean =>
  causeCode === 'CONTEXT_NOT_APPLIED' || causeCode === 'CONTEXT_INVALID';

const isAstBlockedCauseCode = (causeCode: string): boolean => {
  const normalized = causeCode.toLowerCase();
  return (
    normalized.startsWith('skills_') ||
    normalized.startsWith('skills.') ||
    normalized.startsWith('heuristics_') ||
    normalized.startsWith('heuristics.') ||
    normalized.includes('_ast') ||
    normalized.includes('solid') ||
    normalized.includes('no_') ||
    normalized.includes('avoid_')
  );
};

const isAstBlockedCause = (
  cause: NonNullable<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']>[number]
): boolean => {
  const ruleId = cause.ruleId?.toLowerCase() ?? '';
  const code = cause.code.toLowerCase();
  return (
    ruleId.startsWith('skills.') ||
    ruleId.startsWith('heuristics.') ||
    isAstBlockedCauseCode(code)
  );
};

const buildBlockedCausesSummary = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>
): string | null => {
  const causes = event.blockingCauses ?? [];
  if (causes.length === 0) {
    return null;
  }
  const astCauses = causes.filter(isAstBlockedCause);
  const selectedCauses = astCauses.length > 0 ? astCauses : causes;
  const first = selectedCauses[0];
  if (!first) {
    return null;
  }
  const file = first.file ? ` en ${first.file}` : '';
  const rule = first.ruleId ?? first.code;
  const remainingCauses = Math.max(0, causes.length - 1);
  const suffix = remainingCauses > 0 ? ` (+${remainingCauses} más)` : '';
  return `Violación ${rule}${file}${suffix}.`;
};

const buildGenericSpanishBlockedCauseSummary = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>,
  causeCode: string
): string => {
  if (causeCode.trim().length > 0 && causeCode !== 'GATE_BLOCKED') {
    return `Se ha detectado el bloqueo ${causeCode} en ${event.stage}.`;
  }
  return `Se detectaron ${event.totalViolations} bloqueos en ${event.stage}.`;
};

const toKnownSpanishCauseFromMessage = (message: string): string | null => {
  const normalized = message.toLowerCase();
  const trackingContext = extractNotificationTrackingContext(message);
  if (trackingContext) {
    return buildNotificationTrackingCauseSummary(trackingContext);
  }
  if (normalized.includes('avoid explicit any')) {
    return BLOCKED_CAUSE_SUMMARY_BY_CODE.BACKEND_AVOID_EXPLICIT_ANY;
  }
  if (normalized.includes('atomicity')) {
    return BLOCKED_CAUSE_SUMMARY_BY_CODE.GIT_ATOMICITY_TOO_MANY_SCOPES;
  }
  if (normalized.includes('evidence ai gate status is blocked')) {
    return BLOCKED_CAUSE_SUMMARY_BY_CODE.EVIDENCE_GATE_BLOCKED;
  }
  if (normalized.includes('evidence is stale')) {
    return BLOCKED_CAUSE_SUMMARY_BY_CODE.EVIDENCE_STALE;
  }
  if (normalized.includes('no upstream tracking reference')) {
    return BLOCKED_CAUSE_SUMMARY_BY_CODE.PRE_PUSH_UPSTREAM_MISSING;
  }
  return null;
};

const hasEnglishBlockedCauseHints = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return ENGLISH_CAUSE_HINTS.some((hint) => normalized.includes(hint));
};

export const resolveBlockedCauseSummary = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>,
  causeCode: string
): string => {
  const blockedCausesSummary = buildBlockedCausesSummary(event);
  if (blockedCausesSummary) {
    return truncateNotificationText(blockedCausesSummary, 72);
  }
  const legacySkillCauseSummary = buildLegacySkillCauseSummary(event.causeMessage);
  if (legacySkillCauseSummary) {
    return legacySkillCauseSummary;
  }
  const trackingContext = extractNotificationTrackingContext(event.causeMessage);
  const priorityCode = resolvePriorityCauseFromMessage(event.causeMessage);
  if (priorityCode) {
    return BLOCKED_CAUSE_SUMMARY_BY_CODE[priorityCode];
  }
  const mapped = BLOCKED_CAUSE_SUMMARY_BY_CODE[causeCode];
  if (mapped && isCauseCodePriorityOverTracking(causeCode)) {
    return mapped;
  }
  if (trackingContext) {
    return buildNotificationTrackingCauseSummary(trackingContext);
  }
  if (mapped) {
    return mapped;
  }
  if (event.causeMessage && event.causeMessage.trim().length > 0) {
    const rawMessage = normalizeNotificationText(event.causeMessage).replace(/^[A-Z0-9_]+:\s*/, '');
    const translated = toKnownSpanishCauseFromMessage(rawMessage);
    if (translated) {
      return translated;
    }
    if (hasEnglishBlockedCauseHints(rawMessage)) {
      return truncateNotificationText(
        buildGenericSpanishBlockedCauseSummary(event, causeCode),
        72
      );
    }
    return truncateNotificationText(rawMessage, 72);
  }
  return buildGenericSpanishBlockedCauseSummary(event, causeCode);
};
