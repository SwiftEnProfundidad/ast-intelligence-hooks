import type { Severity } from '../../core/rules/Severity';
import type {
  SkillsCompiledRule,
  SkillsRuleConfidence,
  SkillsRuleEvaluationMode,
  SkillsRuleOrigin,
  SkillsStage,
} from './skillsLock';

const CHECK_RULE_PREFIX = /^[✅❌]\s*/u;
const BULLET_CHECK_RULE_PREFIX = /^[-*]\s+[✅❌]\s*/u;
const BULLET_RULE_PREFIX = /^[-*]\s+/u;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;
const INLINE_CODE_PATTERN = /`([^`]+)`/g;
const MARKDOWN_BOLD_PATTERN = /[*_]{1,3}/g;
const MULTISPACE_PATTERN = /\s+/g;
const AST_NODE_ID_PATTERN = /\bheuristics\.[a-z0-9._-]+\.ast\b/gi;
const RULE_KEYWORDS =
  /\b(always|siempre|prefer|use|usar|avoid|evitar|never|nunca|must|obligatorio|required|disallow|do not|no)\b/i;

const normalizeForLookup = (value: string): string => {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

const slugify = (value: string): string => {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
};

const sanitizeRuleDescription = (value: string): string => {
  return value
    .replace(BULLET_CHECK_RULE_PREFIX, '')
    .replace(CHECK_RULE_PREFIX, '')
    .replace(BULLET_RULE_PREFIX, '')
    .replace(MARKDOWN_LINK_PATTERN, '$1')
    .replace(INLINE_CODE_PATTERN, '$1')
    .replace(MARKDOWN_BOLD_PATTERN, '')
    .replace(MULTISPACE_PATTERN, ' ')
    .trim();
};

const inferRuleSeverity = (raw: string): Severity => {
  const normalized = normalizeForLookup(raw);
  if (/^\s*❌/u.test(raw) || /^\s*[-*]\s+❌/u.test(raw)) {
    return 'ERROR';
  }
  if (/\bcritical\b|\bbloqueante\b|\bblock\b/.test(normalized)) {
    return 'CRITICAL';
  }
  if (
    /\bnever\b|\bnunca\b|\bmust\b|\bobligatorio\b|\brequired\b|\bdisallow\b|\bavoid\b|\bevitar\b|\bdo not\b/.test(
      normalized
    )
  ) {
    return 'ERROR';
  }
  return 'WARN';
};

const inferRuleConfidence = (raw: string): SkillsRuleConfidence => {
  if (/^\s*❌/u.test(raw) || /^\s*[-*]\s+❌/u.test(raw)) {
    return 'HIGH';
  }
  if (/\bmust\b|\bobligatorio\b|\brequired\b|\bdisallow\b/i.test(raw)) {
    return 'HIGH';
  }
  return 'MEDIUM';
};

const inferRuleStage = (raw: string): SkillsStage | undefined => {
  const normalized = normalizeForLookup(raw);
  if (/\bpre push\b/.test(normalized)) {
    return 'PRE_PUSH';
  }
  if (/\bpre commit\b/.test(normalized)) {
    return 'PRE_COMMIT';
  }
  if (/\bci\b/.test(normalized)) {
    return 'CI';
  }
  return undefined;
};

const KNOWN_RULE_DEFAULT_STAGE: Readonly<Record<string, SkillsStage>> = {
  'skills.backend.no-solid-violations': 'PRE_PUSH',
  'skills.frontend.no-solid-violations': 'PRE_PUSH',
  'skills.backend.enforce-clean-architecture': 'PRE_PUSH',
  'skills.frontend.enforce-clean-architecture': 'PRE_PUSH',
  'skills.backend.no-god-classes': 'PRE_PUSH',
  'skills.frontend.no-god-classes': 'PRE_PUSH',
};

const resolveDefaultStageForKnownRule = (
  ruleId: string,
  inferredStage: SkillsStage | undefined
): SkillsStage | undefined => {
  if (inferredStage) {
    return inferredStage;
  }
  return KNOWN_RULE_DEFAULT_STAGE[ruleId];
};

const isRuleCandidateLine = (line: string): boolean => {
  if (CHECK_RULE_PREFIX.test(line)) {
    return true;
  }
  if (BULLET_CHECK_RULE_PREFIX.test(line)) {
    return true;
  }
  if (!BULLET_RULE_PREFIX.test(line)) {
    return false;
  }
  const content = line.replace(BULLET_RULE_PREFIX, '').trim();
  if (content.length < 8) {
    return false;
  }
  if (/^\[[ xX]\]\s+/.test(content)) {
    return false;
  }
  if (/^\|/.test(content)) {
    return false;
  }
  return RULE_KEYWORDS.test(content);
};

const extractRuleCandidateLines = (markdown: string): string[] => {
  const lines = markdown.split('\n');
  const candidates: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) {
      continue;
    }
    if (trimmed.length === 0 || trimmed.startsWith('#') || trimmed.startsWith('|')) {
      continue;
    }
    if (!isRuleCandidateLine(trimmed)) {
      continue;
    }
    candidates.push(trimmed);
  }

  return candidates;
};

const extractAstNodeIdsFromLine = (line: string): string[] => {
  const matches = line.match(AST_NODE_ID_PATTERN);
  if (!matches) {
    return [];
  }
  const normalized = matches.map((token) => token.trim().toLowerCase());
  return [...new Set(normalized)].sort();
};

const resolvePlatformFromBundle = (
  bundleName: string
): SkillsCompiledRule['platform'] => {
  const normalized = bundleName.toLowerCase();
  if (normalized.includes('ios')) {
    return 'ios';
  }
  if (normalized.includes('android')) {
    return 'android';
  }
  if (normalized.includes('backend')) {
    return 'backend';
  }
  if (normalized.includes('frontend')) {
    return 'frontend';
  }
  return 'generic';
};

const normalizeKnownRuleTarget = (
  platform: SkillsCompiledRule['platform'],
  normalizedDescription: string
): string | null => {
  const includes = (needle: string): boolean => normalizedDescription.includes(needle);

  if (platform === 'ios') {
    if (includes('force unwrap')) {
      return 'skills.ios.no-force-unwrap';
    }
    if (includes('force try')) {
      return 'skills.ios.no-force-try';
    }
    if (includes('anyview')) {
      return 'skills.ios.no-anyview';
    }
    if (includes('callback style') || includes('completion handler')) {
      return 'skills.ios.no-callback-style-outside-bridges';
    }
    if (includes('force cast')) {
      return 'skills.ios.no-force-cast';
    }
    if (includes('dispatchqueue') || includes('dispatch queue')) {
      return 'skills.ios.no-dispatchqueue';
    }
    if (includes('dispatchgroup') || includes('dispatch group')) {
      return 'skills.ios.no-dispatchgroup';
    }
    if (includes('dispatchsemaphore') || includes('dispatch semaphore')) {
      return 'skills.ios.no-dispatchsemaphore';
    }
    if (includes('operationqueue') || includes('operation queue')) {
      return 'skills.ios.no-operation-queue';
    }
    if (includes('task detached') || includes('task.detached')) {
      return 'skills.ios.no-task-detached';
    }
    if (includes('unchecked sendable')) {
      return 'skills.ios.no-unchecked-sendable';
    }
    if (includes('preconcurrency') || includes('@preconcurrency')) {
      return 'skills.ios.no-preconcurrency';
    }
    if (includes('nonisolated unsafe') || includes('nonisolated(unsafe)')) {
      return 'skills.ios.no-nonisolated-unsafe';
    }
    if (
      includes('assumeisolated') ||
      includes('assume isolated') ||
      includes('mainactor.assumeisolated') ||
      includes('main actor assume isolated')
    ) {
      return 'skills.ios.no-assume-isolated';
    }
    if (includes('observableobject') || includes('observable object')) {
      return 'skills.ios.no-observable-object';
    }
    if (
      includes('observedobject') ||
      (includes('legacy') && includes('stateobject')) ||
      (includes('not stateobject') && includes('observable'))
    ) {
      return 'skills.ios.no-legacy-swiftui-observable-wrapper';
    }
    if (
      includes('passed values as state') ||
      includes('passed values as state or stateobject') ||
      includes('passed values as stateobject')
    ) {
      return 'skills.ios.no-passed-value-state-wrapper';
    }
    if (includes('navigationview') || includes('navigation view')) {
      return 'skills.ios.no-navigation-view';
    }
    if (
      includes('foregroundstyle instead of foregroundcolor') ||
      includes('foregroundstyle over foregroundcolor') ||
      includes('foregroundcolor') ||
      includes('foreground color')
    ) {
      return 'skills.ios.no-foreground-color';
    }
    if (
      includes('clipshape instead of cornerradius') ||
      includes('clipshape rect cornerradius') ||
      includes('cornerradius') ||
      includes('corner radius')
    ) {
      return 'skills.ios.no-corner-radius';
    }
    if (includes('tab api') || includes('tabitem') || includes('tab item')) {
      return 'skills.ios.no-tab-item';
    }
    if (includes('ontapgesture') || includes('on tap gesture')) {
      return 'skills.ios.no-on-tap-gesture';
    }
    if (includes('string format') || includes('string(format')) {
      return 'skills.ios.no-string-format';
    }
    if (
      (includes('foreach') && includes('indices')) ||
      includes('stable identity for foreach') ||
      includes('never indices for dynamic content')
    ) {
      return 'skills.ios.no-foreach-indices';
    }
    if (
      includes('localizedstandardcontains') ||
      includes('localized standard contains') ||
      (includes('user input filtering') && includes('contains')) ||
      (includes('user-facing filter') && includes('contains'))
    ) {
      return 'skills.ios.no-contains-user-filter';
    }
    if (
      includes('geometryreader') ||
      includes('geometry reader') ||
      includes('containerrelativeframe') ||
      includes('visualeffect')
    ) {
      return 'skills.ios.no-geometryreader';
    }
    if (
      includes('fontweight bold') ||
      includes('fontweight(.bold)') ||
      (includes('bold()') && includes('fontweight'))
    ) {
      return 'skills.ios.no-font-weight-bold';
    }
    if (
      includes('scrollindicators hidden') ||
      includes('scroll indicators hidden') ||
      includes('showsindicators false') ||
      includes('shows indicators false')
    ) {
      return 'skills.ios.no-scrollview-shows-indicators';
    }
    if (
      includes('sheet item') ||
      includes('sheet(item') ||
      includes('sheet ispresented') ||
      includes('sheet(ispresented') ||
      includes('sheets basadas en modelo') ||
      includes('sheets based on model')
    ) {
      return 'skills.ios.no-sheet-is-presented';
    }
    if (
      includes('legacy onchange') ||
      includes('legacy single parameter') ||
      includes('single parameter onchange') ||
      includes('onchange of value in') ||
      includes('old new in') ||
      (includes('onchange') &&
        (includes('2 parametros') ||
          includes('2 parameter') ||
          includes('sin parametros') ||
          includes('no parameter')))
    ) {
      return 'skills.ios.no-legacy-onchange';
    }
    if (includes('uiscreen main bounds') || includes('uiscreen.main.bounds')) {
      return 'skills.ios.no-uiscreen-main-bounds';
    }
    if (
      includes('swift testing over xctest') ||
      includes('prefer import testing') ||
      includes('prefer test functions over test methods') ||
      includes('test functions over test methods') ||
      includes('xctest-only unit tests') ||
      includes('new xctest-only unit tests') ||
      includes('xctest only for ui') ||
      includes('xctest only for ui performance')
    ) {
      return 'skills.ios.prefer-swift-testing';
    }
    if (includes('xctassert') || includes('prefer expect')) {
      return 'skills.ios.no-xctassert';
    }
    if (includes('xctunwrap') || includes('prefer require')) {
      return 'skills.ios.no-xctunwrap';
    }
    if (
      includes('await fulfillment') ||
      includes('waitforexpectations') ||
      (includes('wait for') && includes('fulfillment'))
    ) {
      return 'skills.ios.no-wait-for-expectations';
    }
    if (
      includes('expectation description') ||
      includes('expectation(description') ||
      includes('prefer confirmation')
    ) {
      return 'skills.ios.no-legacy-expectation-description';
    }
    if (
      includes('app transport security') ||
      includes('ats https') ||
      includes('https por defecto')
    ) {
      return 'skills.ios.guideline.ios.app-transport-security-ats-https-por-defecto';
    }
    if (
      includes('localizable strings') ||
      includes('string catalogs') ||
      includes('xcstrings')
    ) {
      return 'skills.ios.guideline.ios.localizable-strings-deprecado-usar-string-catalogs';
    }
    if (includes('strings hardcodeadas') || includes('string localized')) {
      return 'skills.ios.guideline.ios.cero-strings-hardcodeadas-en-ui';
    }
    if (includes('assets en asset catalogs') || includes('asset catalogs')) {
      return 'skills.ios.guideline.ios.assets-en-asset-catalogs-con-soporte-para-todos-los-taman-os';
    }
    if (includes('dynamic type')) {
      return 'skills.ios.guideline.ios.dynamic-type-font-scaling-automa-tico';
    }
    if (includes('rtl support') || includes('right to left')) {
      return 'skills.ios.guideline.ios.rtl-support-right-to-left-para-a-rabe-hebreo';
    }
    if (
      includes('mixing legacy xctest style') ||
      includes('mixed xctest and swift testing') ||
      includes('mixed testing frameworks')
    ) {
      return 'skills.ios.no-mixed-testing-frameworks';
    }
    if (
      includes('nsmanagedobject across boundaries') ||
      includes('passing nsmanagedobject') ||
      includes('nsmanagedobject through service') ||
      includes('nsmanagedobject in shared function and property boundaries')
    ) {
      return 'skills.ios.no-nsmanagedobject-boundary';
    }
    if (
      includes('async apis that return nsmanagedobject') ||
      includes('nsmanagedobject in async function boundaries') ||
      includes('avoid returning or accepting nsmanagedobject in async apis')
    ) {
      return 'skills.ios.no-nsmanagedobject-async-boundary';
    }
    if (
      includes('keep swiftdata orchestration') ||
      includes('swiftdata contexts containers queries or persistence models') ||
      includes('modelcontext') ||
      includes('modelcontainer') ||
      includes('query model')
    ) {
      return 'skills.ios.no-swiftdata-layer-leak';
    }
    if (
      includes('core data orchestration inside infrastructure') ||
      includes('instead of presentation code') ||
      includes('core data apis in application or presentation code') ||
      includes('avoid core data apis in application or presentation code') ||
      includes('fetchrequest') ||
      includes('managedobjectcontext') ||
      includes('persistence containers directly in application presentation code')
    ) {
      return 'skills.ios.no-core-data-layer-leak';
    }
    if (
      includes('managed objects into swiftui state or view models') ||
      includes('nsmanagedobject instances into swiftui state or view models') ||
      includes('nsmanagedobject leaking into swiftui state') ||
      includes('nsmanagedobject leaking into view models')
    ) {
      return 'skills.ios.no-nsmanagedobject-state-leak';
    }
    return null;
  }

  if (platform === 'android') {
    if (includes('thread sleep') || includes('thread.sleep')) {
      return 'skills.android.no-thread-sleep';
    }
    if (includes('globalscope') || includes('global scope')) {
      return 'skills.android.no-globalscope';
    }
    if (includes('runblocking') || includes('run blocking')) {
      return 'skills.android.no-runblocking';
    }
    return null;
  }

  if (platform === 'backend' || platform === 'frontend') {
    const prefix = platform === 'backend' ? 'skills.backend' : 'skills.frontend';
    if (includes('solid') || includes('single responsibility') || includes('srp')) {
      return `${prefix}.no-solid-violations`;
    }
    if (includes('clean architecture')) {
      return `${prefix}.enforce-clean-architecture`;
    }
    if (includes('god classes') || includes('god class')) {
      return `${prefix}.no-god-classes`;
    }
    if (includes('empty catch')) {
      return `${prefix}.no-empty-catch`;
    }
    if (includes('console log') || includes('console.log')) {
      return `${prefix}.no-console-log`;
    }
    if (includes('explicit any') || includes(' no any') || includes('avoid any')) {
      return `${prefix}.avoid-explicit-any`;
    }
    return null;
  }

  return null;
};

const buildGeneratedRuleId = (
  params: {
    platform: SkillsCompiledRule['platform'];
    sourceSkill: string;
    description: string;
  },
  usedIds: Set<string>
): string => {
  const slug = slugify(params.description).slice(0, 70) || 'rule';
  const sourceSlug = slugify(params.sourceSkill).replace(/-guidelines?$/, '') || 'bundle';
  const base = `skills.${params.platform}.guideline.${sourceSlug}.${slug}`;
  if (!usedIds.has(base)) {
    return base;
  }
  let counter = 2;
  while (usedIds.has(`${base}-${counter}`)) {
    counter += 1;
  }
  return `${base}-${counter}`;
};

const dedupeById = (
  rules: ReadonlyArray<SkillsCompiledRule>
): SkillsCompiledRule[] => {
  const byId = new Map<string, SkillsCompiledRule>();
  for (const rule of rules) {
    byId.set(rule.id, rule);
  }
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
};

export const extractCompiledRulesFromSkillMarkdown = (params: {
  sourceSkill: string;
  sourcePath: string;
  sourceContent: string;
  existingRuleIds?: ReadonlyArray<string>;
  origin?: SkillsRuleOrigin;
}): SkillsCompiledRule[] => {
  const platform = resolvePlatformFromBundle(params.sourceSkill);
  const usedIds = new Set<string>(params.existingRuleIds ?? []);
  const rules: SkillsCompiledRule[] = [];

  for (const rawLine of extractRuleCandidateLines(params.sourceContent)) {
    const description = sanitizeRuleDescription(rawLine);
    if (description.length < 6) {
      continue;
    }
    const astNodeIds = extractAstNodeIdsFromLine(rawLine);

    const knownRuleId = normalizeKnownRuleTarget(platform, normalizeForLookup(description));
    let nextId: string;
    if (knownRuleId) {
      if (usedIds.has(knownRuleId)) {
        continue;
      }
      nextId = knownRuleId;
    } else {
      nextId = buildGeneratedRuleId(
        {
          platform,
          sourceSkill: params.sourceSkill,
          description,
        },
        usedIds
      );
    }

    if (usedIds.has(nextId)) {
      continue;
    }
    usedIds.add(nextId);

    const evaluationMode: SkillsRuleEvaluationMode =
      knownRuleId || astNodeIds.length > 0 ? 'AUTO' : 'DECLARATIVE';

    const inferredStage = inferRuleStage(rawLine);
    const resolvedStage = knownRuleId
      ? resolveDefaultStageForKnownRule(knownRuleId, inferredStage)
      : inferredStage;

    rules.push({
      id: nextId,
      description,
      severity: inferRuleSeverity(rawLine),
      platform,
      sourceSkill: params.sourceSkill,
      sourcePath: params.sourcePath,
      stage: resolvedStage,
      confidence: inferRuleConfidence(rawLine),
      locked: true,
      evaluationMode,
      origin: params.origin ?? 'core',
      ...(astNodeIds.length > 0 ? { astNodeIds } : {}),
    });
  }

  return dedupeById(rules);
};
