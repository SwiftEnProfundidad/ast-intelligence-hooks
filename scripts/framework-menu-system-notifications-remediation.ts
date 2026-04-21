import type { PumukiCriticalNotificationEvent } from './framework-menu-system-notifications-types';
import {
  normalizeNotificationText,
  truncateNotificationText,
} from './framework-menu-system-notifications-text';

const BLOCKED_REMEDIATION_BY_CODE: Readonly<Record<string, string>> = {
  EVIDENCE_MISSING: 'Genera evidencia del slice actual y vuelve a validar el gate de esta fase.',
  EVIDENCE_INVALID: 'Regenera la evidencia de la iteración y repite la validación en el mismo stage.',
  EVIDENCE_CHAIN_INVALID: 'Regenera la evidencia para restaurar la cadena de integridad y vuelve a validar.',
  EVIDENCE_STALE: 'Ejecuta una auditoría completa de evidencia y vuelve a validar PRE_WRITE/PRE_PUSH. Si persiste, refresca la sesión SDD y reintenta.',
  EVIDENCE_BRANCH_MISMATCH: 'Regenera evidencia en esta rama y vuelve a ejecutar la validación para sincronizar branch y snapshot.',
  EVIDENCE_REPO_ROOT_MISMATCH: 'Regenera evidencia desde este repositorio y relanza la validación del gate.',
  PRE_PUSH_UPSTREAM_MISSING: 'Configura upstream con `git push --set-upstream origin <branch>` y vuelve a ejecutar PRE_PUSH.',
  SDD_SESSION_MISSING: 'Abre sesión SDD del change activo y repite la validación de la fase actual.',
  SDD_SESSION_INVALID: 'Refresca la sesión SDD (open/refresh) y vuelve a validar en el mismo stage.',
  OPENSPEC_MISSING: 'Instala OpenSpec en el repositorio y relanza la validación del gate.',
  MCP_ENTERPRISE_RECEIPT_MISSING: 'Genera el receipt enterprise de MCP y vuelve a ejecutar la validación.',
  BACKEND_AVOID_EXPLICIT_ANY: 'Reemplaza `any` por tipos concretos en backend y vuelve a lanzar el gate para confirmar el fix.',
};

const BLOCKED_REMEDIATION_MAX_LENGTH = 220;

const GENERIC_BLOCKED_REMEDIATION =
  'Corrige el bloqueo indicado y vuelve a ejecutar el comando.';

const normalizeBlockedRemediation = (value: string): string =>
  normalizeNotificationText(value)
    .replace(/^cómo solucionarlo:\s*/i, '')
    .replace(/^remediation:\s*/i, '')
    .replace(/^solution:\s*/i, '')
    .replace(/^fix:\s*/i, '');

const resolveFallbackRemediation = (causeCode: string): string =>
  BLOCKED_REMEDIATION_BY_CODE[causeCode] ?? GENERIC_BLOCKED_REMEDIATION;

const hasEnglishHints = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return [
    'detected',
    'avoid explicit any',
    'set-upstream',
    'refresh evidence',
    'fix and retry',
    'split the change',
    'smaller commits',
    're-run',
    'rerun',
    'retry',
    'to continue',
    'protected branch',
    'open spec',
    'openspec',
    'session',
    'missing',
    'invalid',
    'failed',
    'worktree',
    'callback usage',
    'usage.',
    'run ',
  ].some((hint) => normalized.includes(hint));
};

const toKnownSpanishRemediationFromMessage = (message: string, causeCode: string): string | null => {
  const normalized = message.toLowerCase();
  if (normalized.includes('avoid explicit any')) {
    return BLOCKED_REMEDIATION_BY_CODE.BACKEND_AVOID_EXPLICIT_ANY;
  }
  if (normalized.includes('set-upstream') || normalized.includes('no upstream tracking reference')) {
    return BLOCKED_REMEDIATION_BY_CODE.PRE_PUSH_UPSTREAM_MISSING;
  }
  if (normalized.includes('refresh evidence') || normalized.includes('evidence is stale')) {
    return BLOCKED_REMEDIATION_BY_CODE.EVIDENCE_STALE;
  }
  if (normalized.includes('evidence ai gate status is blocked')) {
    return BLOCKED_REMEDIATION_BY_CODE.EVIDENCE_GATE_BLOCKED;
  }
  if (normalized.includes('split the change')) {
    return BLOCKED_REMEDIATION_BY_CODE.GIT_ATOMICITY_TOO_MANY_SCOPES;
  }
  if (normalized.includes('fix and retry') || normalized.includes('retry')) {
    return resolveFallbackRemediation(causeCode);
  }
  return null;
};

export const resolveBlockedRemediation = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>,
  causeCode: string
): string => {
  const variant = options?.variant ?? 'dialog';
  const maxLength = BLOCKED_REMEDIATION_MAX_LENGTH_BY_VARIANT[variant];
  const fromEvent = event.remediation
    ? normalizeBlockedRemediation(event.remediation)
    : '';
  if (fromEvent.length > 0) {
    const translated = toKnownSpanishRemediationFromMessage(fromEvent, causeCode);
    if (translated) {
      return truncateNotificationText(translated, maxLength);
    }
    if (hasEnglishHints(fromEvent)) {
      return truncateNotificationText(resolveFallbackRemediation(causeCode), maxLength);
    }
    return truncateNotificationText(fromEvent, maxLength);
  }
  return truncateNotificationText(resolveFallbackRemediation(causeCode), maxLength);
};
