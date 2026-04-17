import type { PumukiCriticalNotificationEvent } from './framework-menu-system-notifications-types';
import {
  normalizeNotificationText,
  truncateNotificationText,
} from './framework-menu-system-notifications-text';

type BlockedRemediationVariant = 'banner' | 'dialog';

const BLOCKED_REMEDIATION_BY_CODE: Readonly<Record<string, string>> = {
  EVIDENCE_GATE_BLOCKED: 'Corrige las violaciones bloqueantes detectadas en la evidencia y vuelve a ejecutar el gate.',
  EVIDENCE_MISSING: 'Genera la evidencia del slice actual y vuelve a validar esta fase.',
  EVIDENCE_INVALID: 'Regenera la evidencia de esta iteración y repite la validación.',
  EVIDENCE_CHAIN_INVALID: 'Regenera la evidencia para restaurar la cadena de integridad y vuelve a validar.',
  EVIDENCE_STALE: 'Refresca la evidencia y vuelve a validar PRE_WRITE/PRE_PUSH.',
  EVIDENCE_BRANCH_MISMATCH: 'Regenera la evidencia en esta rama y repite la validación.',
  EVIDENCE_REPO_ROOT_MISMATCH: 'Regenera la evidencia desde este repositorio y vuelve a validar.',
  PRE_PUSH_UPSTREAM_MISSING: 'Configura upstream con `git push --set-upstream origin <branch>` y repite PRE_PUSH.',
  SDD_SESSION_MISSING: 'Abre la sesión SDD del change activo y repite la validación.',
  SDD_SESSION_INVALID: 'Refresca la sesión SDD activa y vuelve a validar esta fase.',
  OPENSPEC_MISSING: 'Instala OpenSpec en este repositorio y vuelve a validar el gate.',
  MCP_ENTERPRISE_RECEIPT_MISSING: 'Genera el receipt enterprise de MCP y vuelve a validar.',
  BACKEND_AVOID_EXPLICIT_ANY: 'Sustituye `any` por tipos concretos en backend y relanza el gate.',
  GIT_ATOMICITY_TOO_MANY_SCOPES: 'Divide el cambio por scope o en commits más pequeños y vuelve a ejecutar el gate.',
  SOLID_HEURISTIC: 'Corrige la violación detectada y vuelve a ejecutar el gate.',
};

const BLOCKED_REMEDIATION_MAX_LENGTH_BY_VARIANT: Readonly<Record<BlockedRemediationVariant, number>> = {
  banner: 120,
  dialog: 220,
};

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
  causeCode: string,
  options?: {
    variant?: BlockedRemediationVariant;
  }
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
