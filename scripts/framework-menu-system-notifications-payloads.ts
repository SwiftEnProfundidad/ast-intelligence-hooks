import { basename } from 'node:path';
import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationPayload,
} from './framework-menu-system-notifications-types';

const normalizeNotificationText = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const truncateNotificationText = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
};

export const resolveProjectLabel = (params: {
  repoRoot?: string;
  projectLabel?: string;
}): string | null => {
  const explicit = params.projectLabel
    ? normalizeNotificationText(params.projectLabel)
    : '';
  if (explicit.length > 0) {
    return truncateNotificationText(explicit, 28);
  }
  if (!params.repoRoot) {
    return null;
  }
  const inferred = normalizeNotificationText(basename(params.repoRoot));
  if (inferred.length === 0) {
    return null;
  }
  return truncateNotificationText(inferred, 28);
};

const BLOCKED_CAUSE_SUMMARY_BY_CODE: Readonly<Record<string, string>> = {
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
};

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

const toKnownSpanishCauseFromMessage = (message: string): string | null => {
  const normalized = message.toLowerCase();
  if (normalized.includes('avoid explicit any')) {
    return BLOCKED_CAUSE_SUMMARY_BY_CODE.BACKEND_AVOID_EXPLICIT_ANY;
  }
  if (normalized.includes('evidence is stale')) {
    return BLOCKED_CAUSE_SUMMARY_BY_CODE.EVIDENCE_STALE;
  }
  if (normalized.includes('no upstream tracking reference')) {
    return BLOCKED_CAUSE_SUMMARY_BY_CODE.PRE_PUSH_UPSTREAM_MISSING;
  }
  return null;
};

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

export const resolveBlockedCauseSummary = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>,
  causeCode: string
): string => {
  const mapped = BLOCKED_CAUSE_SUMMARY_BY_CODE[causeCode];
  if (mapped) {
    return mapped;
  }
  if (event.causeMessage && event.causeMessage.trim().length > 0) {
    const rawMessage = normalizeNotificationText(event.causeMessage).replace(/^[A-Z0-9_]+:\s*/, '');
    const translated = toKnownSpanishCauseFromMessage(rawMessage);
    if (translated) {
      return translated;
    }
    return truncateNotificationText(rawMessage, 72);
  }
  return `Se detectaron ${event.totalViolations} bloqueos en ${event.stage}.`;
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

export const buildSystemNotificationPayload = (
  event: PumukiCriticalNotificationEvent,
  context?: {
    repoRoot?: string;
    projectLabel?: string;
  }
): SystemNotificationPayload => {
  const projectLabel = resolveProjectLabel({
    repoRoot: context?.repoRoot,
    projectLabel: context?.projectLabel,
  });
  const projectPrefix = projectLabel ? `${projectLabel} · ` : '';

  if (event.kind === 'audit.summary') {
    if (event.criticalViolations > 0) {
      return {
        title: 'AST Audit Complete',
        message: `🔴 ${event.criticalViolations} CRITICAL, ${event.highViolations} HIGH violations`,
      };
    }
    if (event.highViolations > 0) {
      return {
        title: 'AST Audit Complete',
        message: `🟡 ${event.highViolations} HIGH violations found`,
      };
    }
    if (event.totalViolations > 0) {
      return {
        title: 'AST Audit Complete',
        message: `🔵 ${event.totalViolations} violations (no blockers)`,
      };
    }
    return {
      title: 'AST Audit Complete',
      message: '✅ No violations found',
    };
  }

  if (event.kind === 'gate.blocked') {
    const causeCode = event.causeCode ?? 'GATE_BLOCKED';
    const causeSummary = truncateNotificationText(
      resolveBlockedCauseSummary(event, causeCode),
      72
    );
    const remediation = resolveBlockedRemediation(event, causeCode);
    return {
      title: '🔴 Pumuki bloqueado',
      subtitle: `${projectPrefix}${event.stage} · ${causeSummary}`,
      message: `Solución: ${remediation}`,
      soundName: 'Basso',
    };
  }

  if (event.kind === 'evidence.stale') {
    return {
      title: '🟡 Pumuki · evidencia desactualizada',
      message: `Actualiza evidencia (${event.ageMinutes} min): ${event.evidencePath}.`,
    };
  }

  return {
    title: '🔴 Pumuki · bloqueo GitFlow',
    message: `La rama ${event.currentBranch} no cumple GitFlow (${event.reason}).`,
  };
};
