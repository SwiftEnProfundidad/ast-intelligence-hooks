import type { PumukiCriticalNotificationEvent } from './framework-menu-system-notifications-types';
import {
  resolveDisplayBlockingCausesForEvent,
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
  if (causes.every(isSkillsContractCause)) {
    const first = resolvePrioritizedBlockingCauses(causes)[0];
    if (!first) {
      return null;
    }
    return [
      'Causas bloqueantes: 1',
      ...formatBlockingCauseForDialog(first, 0),
    ].join('\n');
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

const localizeDeveloperText = (value: string): string => {
  const normalized = normalizeNotificationText(value);
  const knownTexts: ReadonlyArray<[RegExp, string]> = [
    [/Dynamic Type - Font scaling autom[aá]tico/iu, 'Dynamic Type: tamaño de fuente fijo sin escala dinámica.'],
    [/Dynamic Type - fuentes escalables y layouts adaptativos/iu, 'Dynamic Type: fuente fija o layout no preparado para tamaños de texto del sistema.'],
    [/Use semantic SwiftUI text styles such as \.headline\/\.body, Font\.TextStyle, or UIFontMetrics\/scaled metrics when a custom size is required\./iu, 'Usa estilos semánticos de SwiftUI como .headline o .body. Si necesitas un tamaño custom, escálalo con Font.TextStyle o UIFontMetrics.'],
    [/Disallow empty catch blocks in backend runtime code\./iu, 'Catch vacío en código backend runtime.'],
    [/Action handlers should reference methods, not contain inline logic/iu, 'El handler contiene lógica inline; debe llamar a un método o comando del view model.'],
    [/Ensure constant number of views per ForEach element/iu, 'Cada elemento de ForEach debe devolver una estructura de vistas estable.'],
    [/Ensure ForEach uses stable identity/iu, 'ForEach debe usar una identidad estable.'],
    [/Prefer modifiers over conditional views for state changes/iu, 'Para cambios de estado, usa modificadores en vez de cambiar la identidad de la vista.'],
    [/Prefer static member lookup \(\.blue vs Color\.blue\)/iu, 'Usa colores semánticos o static member lookup en SwiftUI.'],
    [/LazyVStack\/LazyHStack - Para listas grandes/iu, 'Las listas grandes deben renderizarse con LazyVStack o LazyHStack.'],
    [/navigationDestination \(for:\) - Destinos tipados/iu, 'La navegación debe usar navigationDestination(for:) con destinos tipados.'],
    [/Extract the action body to a named method or view model command and reference that method from Button\./iu, 'Extrae la acción a un método con nombre o comando del view model y referencia ese método desde Button.'],
    [/Move branching into a dedicated row view or prefer conditional modifiers\/values that keep a stable view structure per element\./iu, 'Mueve la ramificación a una fila dedicada o usa modificadores condicionales que mantengan estable la estructura de vistas por elemento.'],
    [/Use Identifiable models or an explicit stable domain identifier such as id: \\.id\./iu, 'Usa modelos Identifiable o un identificador estable del dominio, por ejemplo id: \\.id.'],
    [/Keep one view instance and move the condition into modifiers, parameters or extracted stable row state\./iu, 'Mantén una única instancia de vista y mueve la condición a modificadores, parámetros o estado estable extraído.'],
    [/Replace Color\.blue\/Color\.primary\/etc\. with \.blue\/\.primary in SwiftUI style contexts, or use named asset colors such as Color\("BrandPrimary"\) when design tokens are required\./iu, 'Sustituye Color.blue/Color.primary por .blue/.primary en contextos SwiftUI, o usa colores semánticos del design system cuando aplique.'],
    [/Replace VStack\/HStack under ScrollView with LazyVStack\/LazyHStack when rendering collection rows\./iu, 'Sustituye VStack/HStack dentro de ScrollView por LazyVStack/LazyHStack al renderizar colecciones.'],
  ];
  for (const [pattern, replacement] of knownTexts) {
    if (pattern.test(normalized)) {
      return replacement;
    }
  }
  return normalized;
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
  if (typeof cause.line === 'number' && Number.isFinite(cause.line) && cause.line > 0) {
    return `${cause.file}:${Math.floor(cause.line)}`;
  }
  if (Array.isArray(cause.lines)) {
    const lines = cause.lines
      .filter((line) => Number.isFinite(line) && line > 0)
      .map((line) => Math.floor(line));
    if (lines.length > 0) {
      return `${cause.file}:${lines.join(',')}`;
    }
  }
  const line = extractLineFromCauseMessage(cause.message);
  return line ? `${cause.file}:${line}` : cause.file;
};

const humanizeRuleId = (ruleId: string): string => {
  const knownRules: Record<string, string> = {
    'no-empty-catch': 'catch vacío',
    'prefer-swift-testing': 'Test XCTest legacy',
    'no-xctassert': 'Assertions XCTest en Swift Testing',
    'no-xctunwrap': 'XCTUnwrap en Swift Testing',
    'no-wait-for-expectations': 'waitForExpectations legacy',
    'ios-test-quality': 'calidad de tests iOS',
    'action-handlers-should-reference-methods-not-contain-inline-logic': 'handlers SwiftUI sin lógica inline',
    'ensure-constant-number-of-views-per-foreach-element': 'estructura estable en ForEach',
    'ensure-foreach-uses-stable-identity-see-references-list-patterns-md': 'identidad estable en ForEach',
    'prefer-modifiers-over-conditional-views-for-state-changes': 'modificadores para cambios de estado',
    'dynamic-type-font-scaling-automatico': 'Dynamic Type',
    'dynamic-type-fuentes-escalables-y-layouts-adaptativos': 'fuentes escalables y layouts adaptativos',
    'use-relative-layout-over-hard-coded-constants': 'layout relativo en vez de constantes fijas',
    'magic-numbers-usar-constantes-con-nombres': 'números mágicos sin constantes con nombre',
    'prefer-static-member-lookup-blue-vs-color-blue': 'colores semánticos en SwiftUI',
    'use-lazyvstack-lazyhstack-for-large-lists': 'LazyVStack/LazyHStack para listas grandes',
    'use-navigationdestination-for-type-safe-navigation': 'navigationDestination type-safe',
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

const isBddScenarioMissingCause = (
  cause: NonNullable<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']>[number]
): boolean => {
  const searchable = `${cause.code} ${cause.ruleId ?? ''} ${cause.message}`.toLowerCase();
  return (
    searchable.includes('tdd_bdd_scenario_file_missing') ||
    searchable.includes('generic_bdd_feature_required') ||
    searchable.includes('missing feature file')
  );
};

const extractExpectedBddFeatureFile = (cause: NonNullable<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']>[number]): string => {
  const directFile = cause.file?.endsWith('.feature') ? cause.file : null;
  const fileField = extractFieldFromCauseMessage(cause.message, 'file');
  const missingFeature = cause.message.match(/missing feature file\s+([^\s.]+\.feature|[^\s]+\.feature)/i)?.[1];
  return directFile ?? fileField ?? missingFeature ?? 'fichero .feature de la slice';
};

const isSkillCause = (
  cause: NonNullable<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']>[number]
): boolean =>
  (cause.ruleId ?? '').startsWith('skills.') ||
  cause.code.startsWith('SKILLS_');

const isSkillsContractCause = (
  cause: NonNullable<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']>[number]
): boolean => {
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

const SKILLS_CONTRACT_DIALOG_REMEDIATION =
  'Corrige el contrato de skills indicado arriba y vuelve a intentar el commit.';

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

const formatGoldenFlowRemediation = (message: string, remediation?: string): string => {
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
    return remediation ? localizeDeveloperText(remediation) : GOLDEN_FLOW_REMEDIATION;
  }
  return 'Completa el ciclo TDD en orden: RED, GREEN, REFACTOR y tests finales en verde antes del commit.';
};


const formatBlockingCauseForDialog = (
  cause: NonNullable<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']>[number],
  index: number
): readonly string[] => {
  const rule = cause.ruleId ?? cause.code;
  const visibleRule = formatVisibleRule(cause);
  const problem = localizeDeveloperText(
    extractFieldFromCauseMessage(cause.message, 'message') ??
    (stripTechnicalFieldsFromMessage(cause.message) || cause.code)
  );
  const remediation = isGoldenFlowCause(cause)
    ? GOLDEN_FLOW_REMEDIATION
    : isWorktreeHygieneCause(cause)
    ? WORKTREE_HYGIENE_REMEDIATION
    : cause.remediation
    ? localizeDeveloperText(cause.remediation)
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
  if (isBddScenarioMissingCause(cause)) {
    const expectedFeatureFile = extractExpectedBddFeatureFile(cause);
    return [
      `${index + 1}. Causa bloqueante: escenario BDD sin fichero .feature`,
      `   Fichero esperado: ${truncateNotificationText(expectedFeatureFile, 120)}`,
      '   Falla: La slice referencia un escenario BDD, pero no existe su fichero .feature.',
      '   Solución: Crea ese .feature con el escenario de aceptación de la slice, o corrige la referencia si el id de tarea no es correcto.',
    ];
  }
  if (isSkillsContractCause(cause)) {
    const platform = formatPlatformName(extractSkillsContractPlatform(cause.message));
    const rules = extractSkillsContractRules(cause.message);
    return [
      `${index + 1}. Causa bloqueante: contrato de skills incompleto`,
      `   Plataforma: ${platform}`,
      `   Falla: Pumuki detecta ${platform}, pero falta activar enforcement de skills críticas${rules ? `: ${rules}` : ''}.`,
      `   Solución: ${SKILLS_CONTRACT_REMEDIATION}`,
    ];
  }

  const causeLabel = isSkillCause(cause) ? 'Regla' : 'Causa bloqueante';
  return [
    `${index + 1}. ${causeLabel}: ${truncateNotificationText(visibleRule, 96)}`,
    `   Fichero: ${truncateNotificationText(formatLocation(cause), 120)}`,
    `   Falla: ${truncateNotificationText(problem, 160)}`,
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

const hasOnlyBddScenarioMissingCauses = (
  causes: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']
): boolean =>
  Boolean(causes?.length) && causes!.every(isBddScenarioMissingCause);

const hasOnlySkillsContractCauses = (
  causes: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']
): boolean =>
  Boolean(causes?.length) && causes!.every(isSkillsContractCause);

const resolveGoldenFlowDialogRemediation = (
  causes: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>['blockingCauses']
): string => {
  const first = causes?.find(isGoldenFlowCause);
  return first ? formatGoldenFlowRemediation(first.message, first.remediation) : GOLDEN_FLOW_REMEDIATION;
};

export const buildBlockedDialogPayload = (params: {
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>;
  repoRoot: string;
  env: NodeJS.ProcessEnv;
}): BlockedDialogPayload => {
  const causeCode = params.event.causeCode ?? 'GATE_BLOCKED';
  const displayBlockingCauses = resolveDisplayBlockingCausesForEvent(params.event);
  const cause = buildBlockingCausesDetails(displayBlockingCauses)
    ?? resolveBlockedCauseSummary(params.event, causeCode);
  const remediation = hasOnlyWorktreeHygieneCauses(displayBlockingCauses)
    ? WORKTREE_HYGIENE_REMEDIATION
    : hasOnlyGoldenFlowCauses(displayBlockingCauses)
    ? resolveGoldenFlowDialogRemediation(displayBlockingCauses)
    : hasOnlyBddScenarioMissingCauses(displayBlockingCauses)
    ? 'Crea el fichero .feature esperado para la slice activa o corrige la referencia de tarea. Después vuelve a intentar el commit.'
    : hasOnlySkillsContractCauses(displayBlockingCauses)
    ? SKILLS_CONTRACT_DIALOG_REMEDIATION
    : displayBlockingCauses.length > 0
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
