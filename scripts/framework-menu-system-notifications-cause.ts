import type { PumukiCriticalNotificationEvent } from './framework-menu-system-notifications-types';
import {
  normalizeNotificationText,
  truncateNotificationText,
} from './framework-menu-system-notifications-text';
import {
  buildNotificationTrackingCauseSummary,
  extractNotificationTrackingContext,
} from './framework-menu-system-notifications-tracking';
import { isTddBddBlockingCause } from '../integrations/gate/blockingCause';

const BLOCKED_CAUSE_SUMMARY_BY_CODE: Readonly<Record<string, string>> = {
  EVIDENCE_GATE_BLOCKED: 'El gate de evidencia/gobernanza está bloqueado.',
  TDD_BDD_EVIDENCE_INVALID: 'La evidencia TDD/BDD actual es inválida.',
  TDD_BDD_SCENARIO_FILE_MISSING:
    'Falta el fichero de escenario TDD/BDD referenciado por la evidencia.',
  TDD_BDD_EVIDENCE_STALE: 'La evidencia TDD/BDD está caducada.',
  TDD_BDD_EVIDENCE_MISSING: 'Falta evidencia TDD/BDD para el cambio actual.',
  TDD_BDD_BASELINE_BLOCKED: 'La baseline TDD/BDD está bloqueada.',
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
};

const TRACKING_COMPATIBLE_UMBRELLA_CODES = new Set([
  'EVIDENCE_GATE_BLOCKED',
  'AI_GATE_BLOCKED',
  'AI_GATE_BLOCK',
  'GATE_BLOCKED',
]);

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
  const trackingContext = extractNotificationTrackingContext(event.causeMessage);
  if (isTddBddBlockingCause({ code: causeCode, message: event.causeMessage })) {
    return (
      BLOCKED_CAUSE_SUMMARY_BY_CODE[causeCode] ??
      'La evidencia TDD/BDD bloquea el gate; revisa el escenario y el artefacto de evidencia.'
    );
  }
  if (trackingContext && TRACKING_COMPATIBLE_UMBRELLA_CODES.has(causeCode)) {
    return buildNotificationTrackingCauseSummary(trackingContext);
  }
  const mapped = BLOCKED_CAUSE_SUMMARY_BY_CODE[causeCode];
  if (mapped) {
    return mapped;
  }
  if (trackingContext) {
    return buildNotificationTrackingCauseSummary(trackingContext);
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
