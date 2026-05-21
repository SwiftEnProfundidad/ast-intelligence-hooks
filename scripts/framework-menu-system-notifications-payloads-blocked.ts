import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationPayload,
} from './framework-menu-system-notifications-types';
import { resolveBlockedCauseSummary } from './framework-menu-system-notifications-cause';
import { resolveBlockedRemediation } from './framework-menu-system-notifications-remediation';
import {
  normalizeNotificationText,
  truncateNotificationText,
} from './framework-menu-system-notifications-text';

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

const isGoldenFlowCause = (cause: BlockedCause): boolean => {
  const ruleId = cause.ruleId ?? '';
  const code = cause.code ?? '';
  return (
    code.startsWith('GOLDEN_FLOW_') ||
    code.startsWith('TDD_') ||
    ruleId.includes('golden_flow') ||
    ruleId.startsWith('generic_tdd_') ||
    ruleId.startsWith('generic_red_green_refactor')
  );
};

const isBddScenarioMissingCause = (cause: BlockedCause): boolean => {
  const searchable = `${cause.code} ${cause.ruleId ?? ''} ${cause.message}`.toLowerCase();
  return (
    searchable.includes('tdd_bdd_scenario_file_missing') ||
    searchable.includes('generic_bdd_feature_required') ||
    searchable.includes('missing feature file')
  );
};

const isSkillsContractCause = (cause: BlockedCause): boolean => {
  const searchable = `${cause.code} ${cause.ruleId ?? ''} ${cause.message}`.toUpperCase();
  return (
    searchable.includes('EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING') ||
    searchable.includes('EVIDENCE_SKILLS_CONTRACT_INCOMPLETE')
  );
};

const formatPlatformName = (platform: string | null): string =>
  platform
    ? platform
      .replace(/\bios\b/giu, 'iOS')
      .replace(/\bandroid\b/giu, 'Android')
      .replace(/\bfrontend\b/giu, 'Frontend')
      .replace(/\bbackend\b/giu, 'Backend')
    : 'plataforma detectada';

const extractSkillsContractPlatform = (message: string): string | null =>
  message.match(/\bplatforms?=([a-z0-9_,.-]+)/i)?.[1]?.split(',')[0]?.trim()
  ?? message.match(/\b(ios|android|frontend|backend)\(missing_critical_rule_ids=/i)?.[1]?.trim()
  ?? message.match(/\bskills\.(ios|android|frontend|backend)\./i)?.[1]?.trim()
  ?? message.match(/\bfor\s+(ios|android|frontend|backend)\s*:/i)?.[1]?.trim()
  ?? null;

const extractSkillsContractRules = (message: string): string | null => {
  const rulesMatch = message.match(/\brules?=\{([^}]+)\}/i)?.[1];
  const missingMatch = message.match(/\bmissing=\[([^\]]+)\]/i)?.[1];
  const criticalMissingMatch = message.match(/\bmissing_critical_rule_ids=\[([^\]]+)\]/i)?.[1];
  return normalizeNotificationText(rulesMatch ?? criticalMissingMatch ?? missingMatch ?? '');
};

const SKILLS_CONTRACT_REMEDIATION =
  'Actualiza o reconcilia el contrato de skills de Pumuki y vuelve a intentar el commit. Si ya estás en la última versión, es un bug del motor de Pumuki y debe corregirse allí antes de cerrar el commit.';

const extractExpectedBddFeatureFile = (cause: BlockedCause): string => {
  const directFile = cause.file?.endsWith('.feature') ? cause.file : null;
  const fieldMatch = cause.message.match(/\bfile=([^\s]+\.feature)\b/i)?.[1];
  const missingFeature = cause.message.match(/missing feature file\s+([^\s.]+\.feature|[^\s]+\.feature)/i)?.[1];
  const raw = directFile ?? fieldMatch ?? missingFeature ?? 'fichero .feature de la slice';
  return raw.split('/').filter(Boolean).pop() ?? raw;
};

const normalizeGoldenFlowMissingToken = (message: string): string => {
  const match = message.match(/missing=\[([^\]]+)\]/i);
  return (match?.[1] ?? '').toUpperCase();
};

const formatGoldenFlowBannerRemediation = (cause: BlockedCause): string => {
  const missing = normalizeGoldenFlowMissingToken(cause.message);
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
    return cause.remediation
      ? normalizeNotificationText(cause.remediation)
      : 'Ejecuta los tests de la implementación. Si están en verde, haz un commit atómico de los cambios.';
  }
  return 'Completa el ciclo TDD en orden: RED, GREEN, REFACTOR y tests finales en verde antes del commit.';
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

const formatVisibleRule = (cause: BlockedCause): string => {
  const ruleId = formatCauseRule(cause);
  const readable = humanizeRuleId(ruleId);
  return readable.length > 0 ? readable : ruleId;
};

const extractMessageField = (message: string, field: string): string | null => {
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = message.match(new RegExp(`\\b${escapedField}=([^\\n]+?)(?=\\s(?:severity|code|rule|file|lines?|message|remediation|snippet|node|primary_node|missing)=|\\s\\|\\|\\s\\d+\\)|$)`, 'i'));
  const value = match?.[1]?.trim();
  return value && value.length > 0 ? normalizeNotificationText(value) : null;
};

const stripTechnicalFieldsFromMessage = (message: string): string =>
  normalizeNotificationText(message)
    .replace(/\bseverity=[A-Z]+\b/gi, '')
    .replace(/\bcode=[A-Z0-9_]+\b/gi, '')
    .replace(/\brule=[^\s]+/gi, '')
    .replace(/\bfile=[^\s]+/gi, '')
    .replace(/\blines?=[0-9][0-9,\-\s]*/gi, '')
    .replace(/\bmessage=/gi, '')
    .replace(/\bremediation=/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

const formatCauseProblem = (cause: BlockedCause): string => {
  const messageField = extractMessageField(cause.message, 'message');
  if (messageField) {
    return messageField;
  }
  return stripTechnicalFieldsFromMessage(cause.message) || cause.code;
};

const formatCauseFix = (cause: BlockedCause): string =>
  normalizeNotificationText(
    cause.remediation ??
    'Corrige la violación indicada con regla, fichero y línea, y vuelve a intentar el commit.'
  );

const normalizeRuleCode = (ruleId: string): string =>
  ruleId
    .replace(/^skills\./u, 'SKILLS_')
    .replace(/[.-]/gu, '_')
    .toUpperCase();

const isGenericCauseFix = (value?: string): boolean =>
  !value ||
  /corrige la violaci[oó]n indicada/i.test(value) ||
  /corrige las violaciones listadas/i.test(value) ||
  /corrige la causa bloqueante/i.test(value);

const extractNestedSkillRuleId = (message: string): string | null =>
  message.match(/\b(skills\.[a-z0-9_.-]+)\b/iu)?.[1] ?? null;

const extractFirstNestedSkillSegment = (message: string): string =>
  message
    .replace(/^.*?\bBlocking causes:\s*1\)\s*/isu, '')
    .replace(/\s+\|\|\s+\d+\)\s+[\s\S]*$/u, '')
    .trim();

const normalizeDisplayCause = (cause: BlockedCause): BlockedCause => {
  if (isSkillCause(cause) || isSkillsContractCause(cause)) {
    return cause;
  }
  const nestedSkillRuleId = extractNestedSkillRuleId(cause.message);
  if (!nestedSkillRuleId) {
    return cause;
  }
  const nestedSegment = extractFirstNestedSkillSegment(cause.message);
  const nestedFile = extractMessageField(nestedSegment, 'file');
  const nestedRemediation = extractMessageField(nestedSegment, 'remediation');
  return {
    ...cause,
    code: normalizeRuleCode(nestedSkillRuleId),
    ruleId: nestedSkillRuleId,
    file: nestedFile ?? cause.file,
    message: nestedSegment,
    remediation: isGenericCauseFix(cause.remediation)
      ? nestedRemediation ?? 'Corrige la violación de la skill indicada en el fichero afectado y vuelve a intentar el commit.'
      : cause.remediation,
  };
};

export const resolvePrioritizedBlockingCauses = (
  causes: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']
): ReadonlyArray<BlockedCause> => {
  if (!causes || causes.length === 0) {
    return [];
  }
  return causes.map(normalizeDisplayCause).sort((left, right) => {
    const leftSkill = isSkillCause(left);
    const rightSkill = isSkillCause(right);
    if (leftSkill !== rightSkill) {
      return leftSkill ? -1 : 1;
    }
    const leftGoldenFlow = isGoldenFlowCause(left);
    const rightGoldenFlow = isGoldenFlowCause(right);
    if (leftGoldenFlow !== rightGoldenFlow) {
      return leftGoldenFlow ? -1 : 1;
    }
    const leftBddScenarioMissing = isBddScenarioMissingCause(left);
    const rightBddScenarioMissing = isBddScenarioMissingCause(right);
    if (leftBddScenarioMissing !== rightBddScenarioMissing) {
      return leftBddScenarioMissing ? -1 : 1;
    }
    const leftSkillsContract = isSkillsContractCause(left);
    const rightSkillsContract = isSkillsContractCause(right);
    if (leftSkillsContract !== rightSkillsContract) {
      return leftSkillsContract ? -1 : 1;
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
  if (isSkillCause(first)) {
    return `${prefix}: ${formatCauseLocation(first)} · ${formatVisibleRule(first)}${overflow}`;
  }
  if (isGoldenFlowCause(first)) {
    return `Violación del ciclo TDD${overflow}`;
  }
  if (isBddScenarioMissingCause(first)) {
    return `BDD sin fichero .feature: ${extractExpectedBddFeatureFile(first)}${overflow}`;
  }
  if (isSkillsContractCause(first)) {
    const platform = formatPlatformName(extractSkillsContractPlatform(first.message));
    return `Contrato de skills incompleto: ${platform}${overflow}`;
  }
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
  if (isSkillCause(first)) {
    return [
      `Regla: ${formatVisibleRule(first)}.`,
      `Fichero: ${formatCauseLocation(first)}.`,
      `Falla: ${formatCauseProblem(first)}.`,
      `Solución: ${formatCauseFix(first)}.`,
      prioritized.length > 1 ? `Quedan ${prioritized.length - 1} causa(s) más en el reporte completo.` : '',
    ]
      .filter((line) => line.length > 0)
      .join(' ');
  }
  if (isGoldenFlowCause(first)) {
    return formatGoldenFlowBannerRemediation(first);
  }
  if (isBddScenarioMissingCause(first)) {
    return `Falta el fichero ${extractExpectedBddFeatureFile(first)}. Crea ese .feature con el escenario de aceptación de la slice, o corrige la referencia de tarea si no corresponde.`;
  }
  if (isSkillsContractCause(first)) {
    const platform = formatPlatformName(extractSkillsContractPlatform(first.message));
    const rules = extractSkillsContractRules(first.message);
    return `Pumuki detecta ${platform}, pero falta activar enforcement de skills críticas${rules ? `: ${rules}` : ''}. ${SKILLS_CONTRACT_REMEDIATION}`;
  }
  return `${formatCauseFix(first)} Revisa el reporte completo para el resto de causas bloqueantes.`;
};

export const buildGateBlockedPayload = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>,
  projectPrefix: string
): SystemNotificationPayload => {
  const causeCode = event.causeCode ?? 'GATE_BLOCKED';
  const causeSummary = truncateNotificationText(
    buildBlockingCausesSummary(event.blockingCauses) ?? resolveBlockedCauseSummary(event, causeCode),
    96
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
