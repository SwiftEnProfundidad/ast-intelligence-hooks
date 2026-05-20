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
    .replace(/\bmissing=\[[^\]]*\]/gi, '')
    .replace(/\bsnippet=.+$/gi, '')
    .replace(/\bnode=.+$/gi, '')
    .replace(/\bprimary_node=.+$/gi, '')
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

const humanizeRuleId = (ruleId: string): string => {
  const knownRules: Record<string, string> = {
    'prefer-swift-testing': 'Swift Testing',
    'no-xctassert': 'XCTest assertions',
    'no-wait-for-expectations': 'waitForExpectations en XCTest',
    'ios-test-quality': 'calidad de tests iOS',
    'dynamic-type-font-scaling-automatico': 'Dynamic Type',
    'dynamic-type-fuentes-escalables-y-layouts-adaptativos': 'fuentes escalables y layouts adaptativos',
    'use-relative-layout-over-hard-coded-constants': 'layout relativo en vez de constantes fijas',
    'magic-numbers-usar-constantes-con-nombres': 'números mágicos sin constantes con nombre',
    'prefer-static-member-lookup-blue-vs-color-blue': 'colores semánticos en SwiftUI',
  };
  const normalized = ruleId
    .replace(/^skills\./u, '')
    .replace(/^governance\./u, '')
    .replace(/^ai_gate\./u, '')
    .replace(/_/gu, '-');
  const parts = normalized.split('.').filter(Boolean);
  const leaf = parts.at(-1) ?? normalized;
  if (knownRules[leaf]) {
    return knownRules[leaf];
  }
  return leaf
    .replace(/-/gu, ' ')
    .replace(/\bios\b/giu, 'iOS')
    .replace(/\bui\b/giu, 'UI')
    .replace(/\bapi\b/giu, 'API')
    .replace(/\btdd\b/giu, 'TDD')
    .replace(/\bsdd\b/giu, 'SDD')
    .replace(/\bguard\b/giu, 'guard')
    .trim();
};

const formatVisibleRule = (
  cause: NonNullable<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']>[number]
): string => {
  const ruleId = cause.ruleId ?? cause.code;
  const readable = humanizeRuleId(ruleId);
  return readable.length > 0 ? readable : ruleId;
};

const isWorktreeHygieneCause = (
  cause: NonNullable<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']>[number]
): boolean =>
  cause.code === 'EVIDENCE_PREWRITE_WORKTREE_WARN' ||
  cause.code === 'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT' ||
  (cause.ruleId ?? '').includes('EVIDENCE_PREWRITE_WORKTREE');

const isGoldenFlowCause = (
  cause: NonNullable<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']>[number]
): boolean =>
  cause.code.startsWith('GOLDEN_FLOW_') ||
  cause.code.startsWith('TDD_') ||
  (cause.ruleId ?? '').includes('golden_flow') ||
  (cause.ruleId ?? '').startsWith('generic_tdd_') ||
  (cause.ruleId ?? '').startsWith('generic_red_green_refactor');

const isSkillCause = (
  cause: NonNullable<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']>[number]
): boolean =>
  (cause.ruleId ?? '').startsWith('skills.') ||
  cause.code.startsWith('SKILLS_');

const WORKTREE_HYGIENE_REMEDIATION =
  'Reduce el worktree pendiente a un slice atómico: stagea solo la tarea activa o guarda el resto en stash nombrado, y reejecuta PRE_WRITE.';

const GOLDEN_FLOW_REMEDIATION =
  'Ejecuta los tests de la implementación. Si están en verde, haz un commit atómico de los cambios.';

const normalizeGoldenFlowMissingToken = (message: string): string => {
  const missing = (extractMissingContractFromCauseMessage(message) ?? 'VERIFY passed')
    .replace(/^Falta:\s*/u, '');
  return missing.toUpperCase();
};

const formatGoldenFlowMissing = (message: string): string => {
  const missing = normalizeGoldenFlowMissingToken(message);
  if (missing.includes('RED')) {
    return 'fase RED del ciclo TDD sin implementar';
  }
  if (missing.includes('GREEN')) {
    return 'fase GREEN del ciclo TDD sin implementar';
  }
  if (missing.includes('REFACTOR')) {
    return 'fase REFACTOR del ciclo TDD sin implementar';
  }
  if (missing.includes('VERIFY')) {
    return 'tests finales en verde sin ejecutar antes del commit';
  }
  return missing.toLowerCase();
};

const formatGoldenFlowRemediation = (message: string): string => {
  const missing = normalizeGoldenFlowMissingToken(message);
  if (missing.includes('RED')) {
    return 'Implementa la fase RED antes de continuar. Las fases del ciclo TDD (RED, GREEN, REFACTOR) deben completarse para desbloquear.';
  }
  if (missing.includes('GREEN')) {
    return 'Implementa la fase GREEN antes de continuar. Haz el cambio mínimo para que el test pase y continúa el ciclo TDD.';
  }
  if (missing.includes('REFACTOR')) {
    return 'Implementa la fase REFACTOR antes de continuar. Limpia la solución manteniendo los tests en verde.';
  }
  if (missing.includes('VERIFY')) {
    return GOLDEN_FLOW_REMEDIATION;
  }
  return 'Completa el ciclo TDD en orden: RED, GREEN, REFACTOR y tests finales en verde antes del commit.';
};


const formatBlockingCauseForDialog = (
  cause: NonNullable<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']>[number],
  index: number
): readonly string[] => {
  const rule = cause.ruleId ?? cause.code;
  const visibleRule = formatVisibleRule(cause);
  const problem = stripTechnicalFieldsFromMessage(cause.message) || cause.code;
  const remediation = isGoldenFlowCause(cause)
    ? GOLDEN_FLOW_REMEDIATION
    : isWorktreeHygieneCause(cause)
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
  if (isGoldenFlowCause(cause)) {
    return [
      `${index + 1}. Causa bloqueante: Violación del ciclo TDD`,
      `   Registro TDD: ${truncateNotificationText(formatLocation(cause), 120)}`,
      `   Falta: ${truncateNotificationText(formatGoldenFlowMissing(cause.message), 120)}`,
    ];
  }

  const causeLabel = isSkillCause(cause) ? 'Regla' : 'Causa bloqueante';
  return [
    `${index + 1}. ${causeLabel}: ${truncateNotificationText(visibleRule, 96)}`,
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

const hasOnlyGoldenFlowCauses = (
  causes: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']
): boolean =>
  Boolean(causes?.length) && causes!.every(isGoldenFlowCause);

const resolveGoldenFlowDialogRemediation = (
  causes: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']
): string => {
  const first = causes?.find(isGoldenFlowCause);
  return first ? formatGoldenFlowRemediation(first.message) : GOLDEN_FLOW_REMEDIATION;
};

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
    : hasOnlyGoldenFlowCauses(params.event.blockingCauses)
    ? resolveGoldenFlowDialogRemediation(params.event.blockingCauses)
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
