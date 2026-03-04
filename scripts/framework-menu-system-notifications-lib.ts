import { execFileSync as runBinarySync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type PumukiNotificationStage = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI' | 'PRE_WRITE';

export type PumukiCriticalNotificationEvent =
  | {
      kind: 'audit.summary';
      totalViolations: number;
      criticalViolations: number;
      highViolations: number;
    }
  | {
      kind: 'gate.blocked';
      stage: PumukiNotificationStage;
      totalViolations: number;
      causeCode?: string;
      causeMessage?: string;
      remediation?: string;
    }
  | {
      kind: 'evidence.stale';
      evidencePath: string;
      ageMinutes: number;
    }
  | {
      kind: 'gitflow.violation';
      currentBranch: string;
      reason: string;
    };

export type SystemNotificationPayload = {
  title: string;
  message: string;
  subtitle?: string;
  soundName?: string;
};

export type SystemNotificationsConfig = {
  enabled: boolean;
  channel: 'macos';
};

export type SystemNotificationEmitResult =
  | { delivered: true; reason: 'delivered' }
  | { delivered: false; reason: 'disabled' | 'unsupported-platform' | 'command-failed' };

type SystemNotificationCommandRunner = (
  command: string,
  args: ReadonlyArray<string>
) => number;

const SYSTEM_NOTIFICATIONS_CONFIG_PATH = '.pumuki/system-notifications.json';

const escapeAppleScriptString = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ').trim();

const buildDisplayNotificationScript = (payload: SystemNotificationPayload): string => {
  const title = escapeAppleScriptString(payload.title);
  const message = escapeAppleScriptString(payload.message);
  const subtitleFragment = payload.subtitle
    ? ` subtitle "${escapeAppleScriptString(payload.subtitle)}"`
    : '';
  const soundFragment = payload.soundName
    ? ` sound name "${escapeAppleScriptString(payload.soundName)}"`
    : '';
  return `display notification "${message}" with title "${title}"${subtitleFragment}${soundFragment}`;
};

const normalizeNotificationText = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const truncateNotificationText = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
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
  EVIDENCE_MISSING: 'Genera evidencia y vuelve a ejecutar el gate.',
  EVIDENCE_INVALID: 'Regenera la evidencia antes de reintentar.',
  EVIDENCE_CHAIN_INVALID: 'Regenera evidencia para reparar la cadena criptográfica.',
  EVIDENCE_STALE: 'Refresca la evidencia y vuelve a intentarlo.',
  EVIDENCE_BRANCH_MISMATCH: 'Regenera evidencia en esta rama y reintenta.',
  EVIDENCE_REPO_ROOT_MISMATCH: 'Regenera evidencia desde este repositorio.',
  PRE_PUSH_UPSTREAM_MISSING: 'Ejecuta: git push --set-upstream origin <branch>.',
  SDD_SESSION_MISSING: 'Abre sesión SDD y vuelve a intentar.',
  SDD_SESSION_INVALID: 'Refresca la sesión SDD y vuelve a intentar.',
  OPENSPEC_MISSING: 'Instala OpenSpec y reintenta la validación.',
  MCP_ENTERPRISE_RECEIPT_MISSING: 'Genera el receipt enterprise de MCP antes de continuar.',
  BACKEND_AVOID_EXPLICIT_ANY: 'Tipa el valor y elimina "any" explícito en backend.',
};

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

const resolveBlockedCauseSummary = (event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>, causeCode: string): string => {
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

const resolveBlockedRemediation = (event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>, causeCode: string): string => {
  const fromEvent = event.remediation
    ? normalizeNotificationText(event.remediation).replace(/^cómo solucionarlo:\s*/i, '').replace(/^remediation:\s*/i, '')
    : '';
  if (fromEvent.length > 0) {
    const translated = toKnownSpanishRemediationFromMessage(fromEvent);
    if (translated) {
      return truncateNotificationText(translated, 120);
    }
    return truncateNotificationText(fromEvent, 120);
  }
  const fallback =
    BLOCKED_REMEDIATION_BY_CODE[causeCode]
    ?? 'Corrige el bloqueo indicado y vuelve a ejecutar el comando.';
  return truncateNotificationText(fallback, 120);
};

const runSystemCommand: SystemNotificationCommandRunner = (command, args) => {
  try {
    runBinarySync(command, [...args], { stdio: 'ignore' });
    return 0;
  } catch {
    return 1;
  }
};

export const buildSystemNotificationsConfigFromSelection = (
  enabled: boolean
): SystemNotificationsConfig => ({
  enabled,
  channel: 'macos',
});

export const persistSystemNotificationsConfig = (repoRoot: string, enabled: boolean): string => {
  const configPath = join(repoRoot, SYSTEM_NOTIFICATIONS_CONFIG_PATH);
  mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
  writeFileSync(
    configPath,
    `${JSON.stringify(buildSystemNotificationsConfigFromSelection(enabled), null, 2)}\n`,
    'utf8'
  );
  return configPath;
};

export const readSystemNotificationsConfig = (repoRoot: string): SystemNotificationsConfig => {
  const configPath = join(repoRoot, SYSTEM_NOTIFICATIONS_CONFIG_PATH);
  if (!existsSync(configPath)) {
    return buildSystemNotificationsConfigFromSelection(true);
  }

  try {
    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as {
      enabled?: unknown;
      channel?: unknown;
    };
    return {
      enabled: parsed.enabled === true,
      channel: 'macos',
    };
  } catch {
    return buildSystemNotificationsConfigFromSelection(true);
  }
};

export const buildSystemNotificationPayload = (
  event: PumukiCriticalNotificationEvent
): SystemNotificationPayload => {
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
      subtitle: `${event.stage} · ${causeSummary}`,
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

export const emitSystemNotification = (params: {
  event: PumukiCriticalNotificationEvent;
  platform?: NodeJS.Platform;
  runCommand?: SystemNotificationCommandRunner;
  repoRoot?: string;
  config?: SystemNotificationsConfig;
}): SystemNotificationEmitResult => {
  const config =
    params.config ??
    (params.repoRoot
      ? readSystemNotificationsConfig(params.repoRoot)
      : buildSystemNotificationsConfigFromSelection(true));
  if (!config.enabled) {
    return { delivered: false, reason: 'disabled' };
  }

  const platform = params.platform ?? process.platform;
  if (platform !== 'darwin') {
    return { delivered: false, reason: 'unsupported-platform' };
  }

  const runner = params.runCommand ?? runSystemCommand;
  const payload = buildSystemNotificationPayload(params.event);
  const script = buildDisplayNotificationScript(payload);
  const exitCode = runner('osascript', ['-e', script]);

  if (exitCode !== 0) {
    return { delivered: false, reason: 'command-failed' };
  }

  return { delivered: true, reason: 'delivered' };
};
