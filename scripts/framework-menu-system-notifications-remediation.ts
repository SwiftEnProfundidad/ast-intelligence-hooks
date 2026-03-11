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

const toKnownSpanishRemediationFromMessage = (message: string): string | null => {
  const normalized = message.toLowerCase();
  if (normalized.includes('avoid explicit any')) {
    return BLOCKED_REMEDIATION_BY_CODE.BACKEND_AVOID_EXPLICIT_ANY;
  }
  if (normalized.includes('set-upstream')) {
    return BLOCKED_REMEDIATION_BY_CODE.PRE_PUSH_UPSTREAM_MISSING;
  }
  if (normalized.includes('refresh evidence')) {
    return BLOCKED_REMEDIATION_BY_CODE.EVIDENCE_STALE;
  }
  return null;
};

export const resolveBlockedRemediation = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>,
  causeCode: string
): string => {
  const fromEvent = event.remediation
    ? normalizeNotificationText(event.remediation)
        .replace(/^cómo solucionarlo:\s*/i, '')
        .replace(/^remediation:\s*/i, '')
    : '';
  if (fromEvent.length > 0) {
    const translated = toKnownSpanishRemediationFromMessage(fromEvent);
    if (translated) {
      return truncateNotificationText(translated, BLOCKED_REMEDIATION_MAX_LENGTH);
    }
    return truncateNotificationText(fromEvent, BLOCKED_REMEDIATION_MAX_LENGTH);
  }
  const fallback =
    BLOCKED_REMEDIATION_BY_CODE[causeCode]
    ?? 'Corrige el bloqueo indicado y vuelve a ejecutar el comando.';
  return truncateNotificationText(fallback, BLOCKED_REMEDIATION_MAX_LENGTH);
};
