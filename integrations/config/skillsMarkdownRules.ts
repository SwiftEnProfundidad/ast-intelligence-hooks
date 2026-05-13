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
  /\b(always|siempre|prefer|use|usar|avoid|evitar|ensure|never|nunca|must|obligatorio|required|disallow|do not|no|suggest|should)\b/i;

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
  'skills.ios.no-solid-violations': 'PRE_WRITE',
  'skills.ios.guideline.ios.verificar-que-no-viole-solid-srp-ocp-lsp-isp-dip': 'PRE_WRITE',
  'skills.backend.no-solid-violations': 'PRE_PUSH',
  'skills.frontend.no-solid-violations': 'PRE_PUSH',
  'skills.backend.enforce-clean-architecture': 'PRE_PUSH',
  'skills.frontend.enforce-clean-architecture': 'PRE_PUSH',
  'skills.backend.mocks-en-produccio-n-solo-datos-reales': 'PRE_PUSH',
  'skills.backend.exception-filters-catch-para-manejo-global': 'PRE_PUSH',
  'skills.backend.guards-para-autenticacio-n-autorizacio-n-useguards-jwtauthguard': 'PRE_PUSH',
  'skills.backend.interceptors-para-logging-transformacio-n-no-en-cada-endpoint': 'PRE_PUSH',
  'skills.backend.no-loggear-datos-sensibles-passwords-tokens-pii': 'PRE_PUSH',
  'skills.backend.password-hashing-bcrypt-con-salt-rounds-10': 'PRE_PUSH',
  'skills.backend.guideline.backend.rate-limiting-nestjs-throttler-para-prevenir-brute-force':
    'PRE_PUSH',
  'skills.backend.guideline.backend.rate-limiting-throttler-para-prevenir-abuse': 'PRE_PUSH',
  'skills.backend.guideline.backend.winston-logger-estructurado-json-logs': 'PRE_PUSH',
  'skills.backend.guideline.backend.loggear-errores-con-contexto-completo': 'PRE_PUSH',
  'skills.backend.guideline.backend.correlation-ids-para-tracing-distribuido': 'PRE_PUSH',
  'skills.backend.guideline.backend.me-tricas-prometheus-prom-client-para-me-tricas': 'PRE_PUSH',
  'skills.backend.guideline.backend.validation-de-config-joi-o-class-validator-para-env': 'PRE_PUSH',
  'skills.backend.guideline.backend.versionado-api-v1-api-v2': 'PRE_PUSH',
  'skills.backend.guideline.backend.class-validator-decorators-isstring-isemail-min-max': 'PRE_PUSH',
  'skills.backend.guideline.backend.class-transformer-transform-exclude-expose': 'PRE_PUSH',
  'skills.backend.guideline.backend.input-validation-siempre-validar-con-dtos': 'PRE_PUSH',
  'skills.backend.guideline.backend.nested-validation-validatenested-type': 'PRE_PUSH',
  'skills.backend.guideline.backend.dtos-en-boundaries-validacio-n-en-entrada-salida': 'PRE_PUSH',
  'skills.backend.guideline.backend.dtos-separados-createorderdto-updateorderdto-orderresponsedto': 'PRE_PUSH',
  'skills.backend.guideline.backend.retornar-dtos-no-exponer-entidades-directamente': 'PRE_PUSH',
  'skills.backend.guideline.backend.transacciones-para-operaciones-cri-ticas': 'PRE_PUSH',
  'skills.backend.guideline.backend.transacciones-para-operaciones-multi-tabla': 'PRE_PUSH',
  'skills.backend.no-singleton': 'PRE_PUSH',
  'skills.frontend.no-singleton': 'PRE_PUSH',
  'skills.backend.magic-numbers-usar-constantes-con-nombres-descriptivos': 'PRE_PUSH',
  'skills.backend.hardcoded-values-config-en-variables-de-entorno': 'PRE_PUSH',
  'skills.backend.no-defaults-en-produccio-n-fallar-si-falta-config-cri-tica': 'PRE_PUSH',
  'skills.backend.callback-hell-usar-async-await': 'PRE_PUSH',
  'skills.frontend.callback-hell-usar-async-await': 'PRE_PUSH',
  'skills.frontend.no-class-components': 'PRE_PUSH',
  'skills.backend.no-god-classes': 'PRE_PUSH',
  'skills.frontend.no-god-classes': 'PRE_PUSH',
  'skills.android.no-solid-violations': 'PRE_PUSH',
  'skills.android.enforce-clean-architecture': 'PRE_PUSH',
  'skills.android.guideline.android.state-hoisting-elevar-estado-al-nivel-apropiado': 'PRE_PUSH',
  'skills.android.guideline.android.binds-para-implementaciones-de-interfaces-ma-s-eficiente':
    'PRE_PUSH',
  'skills.android.guideline.android.provides-para-interfaces-o-third-party': 'PRE_PUSH',
  'skills.android.guideline.android.transaction-para-operaciones-multi-query': 'PRE_PUSH',
  'skills.android.guideline.android.stateflow-estado-mutable-observable': 'PRE_PUSH',
  'skills.android.guideline.android.viewmodelscope-scope-de-viewmodel-cancelado-automa-ticamente':
    'PRE_PUSH',
  'skills.android.guideline.android.localization-strings-xml-por-idioma-values-es-values-en': 'PRE_PUSH',
  'skills.android.guideline.android.plurals-values-plurals-xml': 'PRE_PUSH',
  'skills.android.guideline.android.collect-terminal-operator-para-consumir-flow': 'PRE_PUSH',
  'skills.android.guideline.android.collect-as-state-consumir-flow-en-compose': 'PRE_PUSH',
  'skills.android.guideline.android.remember-evitar-recrear-objetos': 'PRE_PUSH',
  'skills.android.guideline.android.remember-para-mantener-estado-entre-recomposiciones': 'PRE_PUSH',
  'skills.android.guideline.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input': 'PRE_PUSH',
  'skills.android.guideline.android.derivedstateof-ca-lculos-derivados-de-state': 'PRE_PUSH',
  'skills.android.guideline.android.launchedeffect-side-effects-con-lifecycle': 'PRE_PUSH',
  'skills.android.guideline.android.launchedeffect-keys-controlar-cuando-se-relanza-effect': 'PRE_PUSH',
  'skills.android.guideline.android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n':
    'PRE_PUSH',
  'skills.android.guideline.android.preview-preview-para-ver-ui-sin-correr-app': 'PRE_PUSH',
  'skills.android.guideline.android.talkback-screen-reader-de-android': 'PRE_PUSH',
  'skills.android.guideline.android.text-scaling-soportar-font-scaling-del-sistema': 'PRE_PUSH',
  'skills.android.guideline.android.touch-targets-mi-nimo-48dp': 'PRE_PUSH',
  'skills.android.guideline.android.analytics-firebase-analytics-o-custom': 'PRE_PUSH',
  'skills.android.guideline.android.android-profiler-cpu-memory-network-profiling': 'PRE_PUSH',
  'skills.android.guideline.android.accessibility-semantics-contentdescription': 'PRE_PUSH',
  'skills.android.guideline.android.contentdescription-para-ima-genes-y-botones': 'PRE_PUSH',
  'skills.android.guideline.android.recomposition-composables-deben-ser-idempotentes':
    'PRE_PUSH',
  'skills.android.guideline.android.uistate-sealed-class-loading-success-error-states': 'PRE_PUSH',
  'skills.android.guideline.android.use-cases-lo-gica-de-negocio-encapsulada': 'PRE_PUSH',
  'skills.android.guideline.android.app-startup-androidx-startup-para-lazy-init': 'PRE_PUSH',
  'skills.android.guideline.android.baseline-profiles-optimizacio-n-de-startup': 'PRE_PUSH',
  'skills.android.guideline.android.version-catalogs-libs-versions-toml-para-dependencias':
    'PRE_PUSH',
  'skills.android.guideline.android.androidtest-instrumented-tests-device-emulator': 'PRE_PUSH',
  'skills.android.guideline.android.aaa-pattern-arrange-act-assert': 'PRE_PUSH',
  'skills.android.guideline.android.given-when-then-bdd-style': 'PRE_PUSH',
  'skills.android.guideline.android.test-unit-tests-jvm': 'PRE_PUSH',
  'skills.android.guideline.android.async-await-paralelismo': 'PRE_PUSH',
  'skills.android.guideline.android.supervisorscope-errores-no-cancelan-otros-jobs': 'PRE_PUSH',
  'skills.android.guideline.android.single-source-of-truth-viewmodel-es-la-fuente': 'PRE_PUSH',
  'skills.android.guideline.android.arguments-pasar-datos-entre-pantallas': 'PRE_PUSH',
  'skills.android.guideline.android.skip-recomposition-para-metros-inmutables-o-estables':
    'PRE_PUSH',
  'skills.android.guideline.android.stability-composables-estables-recomponen-menos':
    'PRE_PUSH',
  'skills.android.guideline.android.suspend-functions-para-operaciones-async': 'PRE_PUSH',
  'skills.android.guideline.android.string-formatting-1-s-2-d-para-argumentos':
    'PRE_PUSH',
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

const KNOWN_RULE_DEFAULT_SEVERITY: Readonly<Record<string, Severity>> = {
  'skills.ios.guideline.ios.magic-numbers-usar-constantes-con-nombres': 'WARN',
};

const resolveDefaultSeverityForKnownRule = (
  ruleId: string,
  inferredSeverity: Severity
): Severity => {
  return KNOWN_RULE_DEFAULT_SEVERITY[ruleId] ?? inferredSeverity;
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
  const hasWord = (needle: string): boolean =>
    new RegExp(`(^|\\s)${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`).test(
      normalizedDescription
    );

  if (platform === 'ios') {
    if (
      includes('solid') ||
      includes('single responsibility') ||
      hasWord('srp') ||
      hasWord('ocp') ||
      hasWord('lsp') ||
      hasWord('isp') ||
      hasWord('dip') ||
      includes('open closed') ||
      includes('open-closed') ||
      includes('verificar que no viole solid') ||
      includes('no viole solid')
    ) {
      return 'skills.ios.no-solid-violations';
    }
    if (
      includes('force unwrap') ||
      includes('force unwrapping') ||
      includes('no force unwrap') ||
      includes('no force unwrapping')
    ) {
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
      includes('state and stateobject as private') ||
      includes('stateobject as private') ||
      (includes('mark state') && includes('private'))
    ) {
      return 'skills.ios.guideline.ios-swiftui-expert.always-mark-state-and-stateobject-as-private-makes-dependencies-clear';
    }
    if (
      includes('passed values as state') ||
      includes('passed values as state or stateobject') ||
      includes('passed values as stateobject')
    ) {
      return 'skills.ios.no-passed-value-state-wrapper';
    }
    if (
      (includes('always mark') && includes('state') && includes('stateobject') && includes('private')) ||
      (includes('state and stateobject as private') && includes('dependencies clear')) ||
      (includes('mark state and stateobject as private') && includes('makes dependencies clear'))
    ) {
      return 'skills.ios.guideline.ios-swiftui-expert.always-mark-state-and-stateobject-as-private-makes-dependencies-clear';
    }
    if (includes('navigationview') || includes('navigation view')) {
      return 'skills.ios.no-navigation-view';
    }
    if (
      includes('navigationdestination for') ||
      (includes('navigationdestination') && includes('type safe navigation')) ||
      (includes('navigationlink') && includes('value') && includes('navigationdestination'))
    ) {
      return 'skills.ios.guideline.ios-swiftui-expert.use-navigationdestination-for-for-type-safe-navigation';
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
      (includes('foreach') && includes('stable identity')) ||
      (includes('list patterns') && includes('stable identity'))
    ) {
      if (includes('verify list patterns')) {
        return 'skills.ios.guideline.ios-swiftui-expert.verify-list-patterns-use-stable-identity-see-references-list-patterns-';
      }
      return 'skills.ios.guideline.ios-swiftui-expert.ensure-foreach-uses-stable-identity-see-references-list-patterns-md';
    }
    if (includes('self.printchanges') || includes('unexpected view updates')) {
      return 'skills.ios.guideline.ios-swiftui-expert.use-self-printchanges-to-debug-unexpected-view-updates';
    }
    if (
      (includes('inline filtering') && includes('foreach')) ||
      (includes('no inline filtering') && includes('foreach')) ||
      (includes('prefilter') && includes('cache') && includes('foreach'))
    ) {
      return 'skills.ios.guideline.ios-swiftui-expert.avoid-inline-filtering-in-foreach-prefilter-and-cache';
    }
    if (
      includes('constant number of views per foreach element') ||
      (includes('foreach') && includes('constant number of views'))
    ) {
      return 'skills.ios.guideline.ios-swiftui-expert.ensure-constant-number-of-views-per-foreach-element';
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
      includes('static member lookup') ||
      includes('color.blue') ||
      (includes('.blue') && includes('color'))
    ) {
      return 'skills.ios.guideline.ios-swiftui-expert.prefer-static-member-lookup-blue-vs-color-blue';
    }
    if (
      includes('viewbuilder let content') ||
      (includes('closure-based content') && includes('content')) ||
      (includes('content: content') && includes('viewbuilder'))
    ) {
      return 'skills.ios.guideline.ios-swiftui-expert.prefer-viewbuilder-let-content-content-over-closure-based-content-prop';
    }
    if (
      includes('redundant state updates') ||
      (includes('onreceive') && includes('onchange') && includes('state updates')) ||
      (includes('check for value changes') && includes('assigning state'))
    ) {
      return 'skills.ios.guideline.ios-swiftui-expert.avoid-redundant-state-updates-in-onreceive-onchange-scroll-handlers';
    }
    if (
      (includes('lazyvstack') && includes('lazyhstack') && includes('large lists')) ||
      (includes('lazyvstack') && includes('foreach') && includes('scrollview')) ||
      (includes('lazyhstack') && includes('foreach') && includes('scrollview'))
    ) {
      return 'skills.ios.guideline.ios-swiftui-expert.use-lazyvstack-lazyhstack-for-large-lists';
    }
    if (
      includes('no object creation in body') ||
      (includes('object creation') && includes('body')) ||
      (includes('body kept simple') && includes('pure'))
    ) {
      return 'skills.ios.guideline.ios-swiftui-expert.no-object-creation-in-body';
    }
    if (
      includes('image downsampling') ||
      (includes('uiimage data') && includes('downsampling')) ||
      (includes('uiimage data') && includes('encountered'))
    ) {
      return 'skills.ios.guideline.ios-swiftui-expert.suggest-image-downsampling-when-uiimage-data-is-encountered';
    }
    if (
      (includes('action handlers') && includes('reference methods')) ||
      (includes('action handlers') && includes('inline logic')) ||
      (includes('handlers should reference methods') && includes('inline logic'))
    ) {
      return 'skills.ios.guideline.ios-swiftui-expert.action-handlers-should-reference-methods-not-contain-inline-logic';
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
      includes('task/.task(id') ||
      includes('trabajos async con cancelacion automatica') ||
      includes('trabajos async con cancelacio n automa tica') ||
      includes('task modifier for automatic cancellation') ||
      includes('automatic cancellation of async work')
    ) {
      return 'skills.ios.guideline.ios-swiftui-expert.use-task-modifier-for-automatic-cancellation-of-async-work';
    }
    if (
      includes('swift testing over xctest') ||
      includes('prefer import testing') ||
      includes('prefer test functions over test methods') ||
      includes('test functions over test methods') ||
      includes('new xctest only unit tests') ||
      includes('xctest-only unit tests') ||
      includes('new xctest-only unit tests') ||
      includes('xctest solo para proyectos legacy') ||
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
      includes('background threads') ||
      includes('bloquear main thread') ||
      includes('no bloquear main thread') ||
      includes('thread.sleep') ||
      includes('blocking sleep')
    ) {
      return 'skills.ios.guideline.ios.background-threads-no-bloquear-main-thread';
    }
    if (
      includes('accessibility labels') ||
      includes('accessibilitylabel') ||
      includes('accessibility label')
    ) {
      return 'skills.ios.guideline.ios.accessibility-labels-accessibilitylabel';
    }
    if (includes('weak delegates') || includes('delegation pattern')) {
      return 'skills.ios.guideline.ios.delegation-pattern-weak-delegates-para-evitar-retain-cycles';
    }
    if (
      includes('closures delegates') ||
      includes('weak self') ||
      includes('capture list') ||
      includes('avoid retain cycles') ||
      includes('evitar retain cycles')
    ) {
      return 'skills.ios.guideline.ios.evitar-retain-cycles-especialmente-en-closures-delegates';
    }
    if (
      includes('no singleton') ||
      includes('no singletons') ||
      includes('static shared') ||
      includes('static let shared') ||
      includes('static var shared')
    ) {
      return 'skills.ios.guideline.ios.no-singleton-usar-inyeccio-n-de-dependencias-no-compartir-instancias-g';
    }
    if (
      includes('massive view controller') ||
      includes('massive view controllers') ||
      includes('viewcontrollers que mezclan') ||
      includes('viewcontroller que mezclan') ||
      (includes('mvc') && includes('evitar'))
    ) {
      return 'skills.ios.guideline.ios.massive-view-controllers-viewcontrollers-que-mezclan-presentacio-n-nav';
    }
    if (
      includes('implicitly unwrapped') ||
      includes('implicit unwrapped') ||
      includes('iboutlet') ||
      includes('iboutlets')
    ) {
      return 'skills.ios.guideline.ios.implicitly-unwrapped-solo-para-iboutlets-y-casos-muy-especi-ficos';
    }
    if (
      includes('magic numbers') ||
      includes('magic number') ||
      includes('constantes con nombres') ||
      includes('named constants')
    ) {
      return 'skills.ios.guideline.ios.magic-numbers-usar-constantes-con-nombres';
    }
    if (includes('swinject')) {
      return 'skills.ios.guideline.ios.swinject-prohibido-di-manual-o-environment';
    }
    if (
      includes('obfuscation') ||
      includes('strings sensibles en codigo') ||
      includes('strings sensibles en co digo') ||
      includes('sensitive strings')
    ) {
      return 'skills.ios.guideline.ios.obfuscation-strings-sensibles-en-co-digo';
    }
    if (
      includes('mixing legacy xctest style') ||
      includes('mixed xctest and swift testing') ||
      includes('mixed testing frameworks')
    ) {
      return 'skills.ios.no-mixed-testing-frameworks';
    }
    if (includes('quick nimble') || includes('quick/nimble')) {
      return 'skills.ios.guideline.ios.quick-nimble-prohibido-usar-swift-testing-nativo';
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
    if (
      includes('solid') ||
      includes('single responsibility') ||
      includes('srp') ||
      includes('controllers delgados') ||
      includes('logic in controllers') ||
      includes('lo gica en controllers') ||
      includes('lógica en controllers') ||
      includes('mover a servicios') ||
      includes('componentes pequeños') ||
      includes('componentes pequen os') ||
      includes('anemic domain models') ||
      includes('entidades solo con getters') ||
      includes('no logica de negocio en repositorios') ||
      includes('no lógica de negocio en repositorios')
    ) {
      return 'skills.android.no-solid-violations';
    }
    if (
      includes('clean architecture') ||
      includes('clean code') ||
      includes('clean por feature') ||
      includes('clean por feature - presentation') ||
      includes('domain application infrastructure presentation') ||
      includes('presentation application domain infrastructure') ||
      includes('presentation application domain data') ||
      includes('domain data presentation') ||
      includes('dependencias hacia adentro') ||
      includes('capas presentacion') ||
      includes('capas presentación') ||
      includes('infrastructure domain') ||
      includes('feature first') ||
      includes('bounded context') ||
      includes('shared kernel') ||
      includes('clear dependencies') ||
      includes('feature core') ||
      includes('no feature feature')
    ) {
      return 'skills.android.enforce-clean-architecture';
    }
    if (
      includes('asynctask') ||
      includes('deprecated, usar coroutines') ||
      includes('usar coroutines')
    ) {
      return 'skills.android.asynctask-deprecated-usar-coroutines';
    }
    if (
      (includes('coroutines') || includes('async/await') || includes('async await')) &&
      (includes('no callbacks') || includes('callback-based') || includes('callback based') || includes('callbacks'))
    ) {
      return 'skills.android.guideline.android.coroutines-async-await-no-callbacks';
    }
    if (
      (includes('async/await') || includes('async await')) &&
      (includes('paralelismo') || includes('parallelism') || includes('parallel'))
    ) {
      return 'skills.android.guideline.android.async-await-paralelismo';
    }
    if (includes('suspend functions') && includes('api service')) {
      return 'skills.android.guideline.android.suspend-functions-en-api-service';
    }
    if (
      (includes('suspend functions') || includes('suspend fun')) &&
      (includes('operaciones async') ||
        includes('operaciones asincronas') ||
        includes('operaciones asíncronas') ||
        includes('async operations') ||
        includes('para operaciones async') ||
        includes('para operaciones asincronas') ||
        includes('para operaciones asíncronas'))
    ) {
      return 'skills.android.guideline.android.suspend-functions-para-operaciones-async';
    }
    if (
      (includes('@dao') || includes('dao')) &&
      (includes('suspend functions') || includes('suspend fun'))
    ) {
      return 'skills.android.guideline.android.dao-data-access-objects-con-suspend-functions';
    }
    if (
      includes('transaction') &&
      (includes('multi query') || includes('multi-query') || includes('multiquery'))
    ) {
      return 'skills.android.guideline.android.transaction-para-operaciones-multi-query';
    }
    if (
      includes('stateflow') ||
      includes('mutable stateflow') ||
      includes('estado mutable observable') ||
      includes('estado observable')
    ) {
      return 'skills.android.guideline.android.stateflow-estado-mutable-observable';
    }
    if (
      includes('sharedflow') ||
      includes('mutable sharedflow') ||
      includes('assharedflow') ||
      includes('tryemit')
    ) {
      return 'skills.android.guideline.android.sharedflow-hot-stream-puede-no-tener-valor-para-eventos';
    }
    if (
      includes('flow builders') ||
      includes('flow emit') ||
      includes('flowof') ||
      includes('asflow')
    ) {
      return 'skills.android.guideline.android.flow-builders-flow-emit-flowof-asflow';
    }
    if (
      (includes('collect') && includes('terminal operator')) ||
      includes('collectlatest') ||
      includes('launchin')
    ) {
      return 'skills.android.guideline.android.collect-terminal-operator-para-consumir-flow';
    }
    if (
      includes('collectasstate') ||
      includes('collect as state') ||
      includes('collect-as-state') ||
      includes('collectasstatewithlifecycle')
    ) {
      return 'skills.android.guideline.android.collect-as-state-consumir-flow-en-compose';
    }
    if (
      includes('theme') &&
      (includes('color scheme') ||
        includes('typography') ||
        includes('shapes') ||
        includes('materialtheme') ||
        includes('material 3'))
    ) {
      return 'skills.android.guideline.android.theme-color-scheme-typography-shapes';
    }
    if (
      includes('dark theme') ||
      includes('issystemindarktheme') ||
      (includes('dark color scheme') && includes('light color scheme'))
    ) {
      return 'skills.android.guideline.android.dark-theme-soportar-desde-di-a-1-issystemindarktheme';
    }
    if (includes('talkback') || includes('screen reader') || includes('lector de pantalla')) {
      return 'skills.android.guideline.android.talkback-screen-reader-de-android';
    }
    if (
      includes('text scaling') ||
      includes('font scaling') ||
      includes('fontscale') ||
      (includes('font') && includes('scale'))
    ) {
      return 'skills.android.guideline.android.text-scaling-soportar-font-scaling-del-sistema';
    }
    if (
      includes('accessibility') &&
      (includes('semantics') || includes('contentdescription') || includes('content description'))
    ) {
      return 'skills.android.guideline.android.accessibility-semantics-contentdescription';
    }
    if (
      includes('contentdescription') &&
      (includes('imagenes') || includes('images') || includes('botones') || includes('buttons'))
    ) {
      return 'skills.android.guideline.android.contentdescription-para-ima-genes-y-botones';
    }
    if (includes('remember') && includes('evitar recrear objetos')) {
      return 'skills.android.guideline.android.remember-evitar-recrear-objetos';
    }
    if (
      includes('remember') &&
      (includes('mantener estado entre recomposiciones') ||
        includes('estado entre recomposiciones') ||
        includes('mantener estado'))
    ) {
      return 'skills.android.guideline.android.remember-para-mantener-estado-entre-recomposiciones';
    }
    if (
      includes('derivedstateof') &&
      (includes('ca lculos caros solo cuando cambia input') ||
        includes('calculos caros solo cuando cambia input') ||
        includes('ca lculos caros') ||
        includes('calculos caros'))
    ) {
      return 'skills.android.guideline.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input';
    }
    if (
      includes('derivedstateof') &&
      (includes('ca lculos derivados de state') ||
        includes('calculos derivados de state') ||
        includes('ca lculos derivados') ||
        includes('calculos derivados'))
    ) {
      return 'skills.android.guideline.android.derivedstateof-ca-lculos-derivados-de-state';
    }
    if (
      includes('launchedeffect') &&
      (includes('side effects con lifecycle') ||
        includes('side effects') ||
        includes('lifecycle') ||
        includes('controlar cuando se relanza effect'))
    ) {
      return 'skills.android.guideline.android.launchedeffect-side-effects-con-lifecycle';
    }
    if (
      includes('launchedeffect') &&
      (includes('keys control') ||
        includes('keys') ||
        includes('controlar cuando se relanza effect') ||
        includes('relanza effect'))
    ) {
      return 'skills.android.guideline.android.launchedeffect-keys-controlar-cuando-se-relanza-effect';
    }
    if (
      includes('disposableeffect') &&
      (includes('cleanup') ||
        includes('clean up') ||
        includes('lifecycle') ||
        includes('sale de composicion') ||
        includes('sale de composición'))
    ) {
      return 'skills.android.guideline.android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n';
    }
    if (
      includes('preview') &&
      (includes('ver ui sin correr app') ||
        includes('sin correr app') ||
        includes('preview para ver ui') ||
        includes('@preview'))
    ) {
      return 'skills.android.guideline.android.preview-preview-para-ver-ui-sin-correr-app';
    }
    if (
      includes('recomposition') &&
      (includes('idempotent') || includes('idempotente') || includes('composables deben ser idempotentes'))
    ) {
      return 'skills.android.guideline.android.recomposition-composables-deben-ser-idempotentes';
    }
    if (
      includes('uistate') ||
      (includes('sealed class') && includes('loading') && includes('success') && includes('error'))
    ) {
      return 'skills.android.guideline.android.uistate-sealed-class-loading-success-error-states';
    }
    if (
      includes('use cases') ||
      includes('use case') ||
      includes('lógica de negocio encapsulada') ||
      includes('logica de negocio encapsulada')
    ) {
      return 'skills.android.guideline.android.use-cases-lo-gica-de-negocio-encapsulada';
    }
    if (
      includes('ordersrep') ||
      (includes('repository pattern') && includes('ordersrep')) ||
      (includes('orders rep') && includes('repository pattern'))
    ) {
      return 'skills.android.guideline.android.repository-pattern-ordersrep';
    }
    if (
      includes('repository pattern') ||
      includes('abstraer acceso a datos') ||
      includes('abstraer el acceso a datos') ||
      includes('repository')
    ) {
      return 'skills.android.guideline.android.repository-pattern-abstraer-acceso-a-datos';
    }
    if (includes('state hoisting') || includes('elevar estado al nivel apropiado')) {
      return 'skills.android.guideline.android.state-hoisting-elevar-estado-al-nivel-apropiado';
    }
    if (includes('androidx.startup') || (includes('app startup') && includes('lazy init'))) {
      return 'skills.android.guideline.android.app-startup-androidx-startup-para-lazy-init';
    }
    if (
      includes('baseline profiles') ||
      includes('baseline profile') ||
      includes('baselineprofilerule') ||
      (includes('startup') && includes('optimizacion'))
    ) {
      return 'skills.android.guideline.android.baseline-profiles-optimizacio-n-de-startup';
    }
    if (includes('single source of truth') || includes('viewmodel es la fuente')) {
      return 'skills.android.guideline.android.single-source-of-truth-viewmodel-es-la-fuente';
    }
    if (
      includes('skip recomposition') ||
      includes('skip-recomposition') ||
      includes('parametros inmutables') ||
      includes('parametros estables') ||
      includes('parámetros inmutables') ||
      includes('parámetros estables')
    ) {
      return 'skills.android.guideline.android.skip-recomposition-para-metros-inmutables-o-estables';
    }
    if (
      includes('stability') ||
      includes('composables estables') ||
      includes('composable estable') ||
      includes('recomponen menos') ||
      includes('stable or immutable compose models')
    ) {
      return 'skills.android.guideline.android.stability-composables-estables-recomponen-menos';
    }
    if (
      includes('string formatting') ||
      includes('formatting') ||
      includes('%1$s') ||
      includes('%2$d') ||
      includes('placeholders posicionales') ||
      includes('argument order')
    ) {
      return 'skills.android.guideline.android.string-formatting-1-s-2-d-para-argumentos';
    }
    if (
      includes('java en codigo nuevo') ||
      includes('java en co digo nuevo') ||
      includes('no java en codigo nuevo') ||
      includes('no java en co digo nuevo') ||
      includes('solo kotlin') ||
      includes('kotlin para todo')
    ) {
      return 'skills.android.no-java-new-code';
    }
    if (
      includes('rxjava') ||
      includes('usar flow') ||
      includes('usar flows') ||
      includes('flow en nuevo codigo') ||
      includes('flow en nuevo co digo')
    ) {
      return 'skills.android.rxjava-new-code';
    }
    if (
      includes('dispatchers') ||
      includes('dispatcher') ||
      includes('main ui') ||
      includes('io network') ||
      includes('default cpu') ||
      includes('withcontext')
    ) {
      if (includes('withcontext') || includes('cambiar dispatcher')) {
        return 'skills.android.withcontext-change-dispatcher';
      }
      return 'skills.android.dispatchers-main-ui-io-network-disk-default-cpu';
    }
    if (
      includes('try-catch') ||
      includes('supervisorscope') ||
      includes('supervisor scope') ||
      includes('errores no cancelan otros jobs') ||
      includes('manejo de errores en coroutines') ||
      includes('errores en coroutines') ||
      includes('error handling in coroutines')
    ) {
      if (
        includes('supervisorscope') ||
        includes('supervisor scope') ||
        includes('errores no cancelan otros jobs')
      ) {
        return 'skills.android.guideline.android.supervisorscope-errores-no-cancelan-otros-jobs';
      }
      return 'skills.android.try-catch-manejo-de-errores-en-coroutines';
    }
    if (
      includes('findviewbyid') ||
      includes('view binding') ||
      includes('viewbinding') ||
      includes('compose') ||
      includes('no xml layouts') ||
      includes('xml layouts')
    ) {
      return 'skills.android.findviewbyid-view-binding-o-compose';
    }
    if (
      includes('force unwrap') ||
      includes('force unwrapping') ||
      includes('no force unwrap') ||
      includes('no force unwrapping')
    ) {
      return 'skills.android.no-force-unwrap';
    }
    if (includes('thread sleep') || includes('thread.sleep')) {
      return 'skills.android.no-thread-sleep';
    }
    if (includes('globalscope') || includes('global scope')) {
      return 'skills.android.no-globalscope';
    }
    if (
      includes('analytics') ||
      includes('firebase analytics') ||
      includes('firebaseanalytics') ||
      includes('logevent') ||
      includes('trackevent') ||
      includes('log screen view') ||
      includes('set user property')
    ) {
      return 'skills.android.guideline.android.analytics-firebase-analytics-o-custom';
    }
    if (
      includes('android profiler') ||
      includes('profiling') ||
      includes('method tracing') ||
      includes('startmethodtracing') ||
      includes('stopmethodtracing') ||
      includes('trace.beginsection') ||
      includes('trace.beginasyncsection') ||
      includes('trace.setcounter') ||
      includes('traceview') ||
      includes('systrace')
    ) {
      return 'skills.android.guideline.android.android-profiler-cpu-memory-network-profiling';
    }
    if (includes('timber')) {
      return 'skills.android.guideline.android.timber-logging-library';
    }
    if (includes('touch targets') || includes('touch-targets') || includes('48dp')) {
      return 'skills.android.guideline.android.touch-targets-mi-nimo-48dp';
    }
    if (
      includes('console log') ||
      includes('console.log') ||
      includes('logs ad-hoc') ||
      includes('no logs en produccion') ||
      includes('no logs en producción') ||
      includes('no logs en produccio n') ||
      includes('buildconfig.debug') ||
      includes('android.util.log')
    ) {
      return 'skills.android.no-console-log';
    }
    if (
      includes('buildconfig') ||
      includes('build config') ||
      includes('constantes en tiempo de compilacion') ||
      includes('compile time constants') ||
      includes('buildconfig version') ||
      includes('buildconfig build type') ||
      includes('buildconfig version name') ||
      includes('buildconfig version code')
    ) {
      return 'skills.android.guideline.android.buildconfig-constantes-en-tiempo-de-compilacio-n';
    }
    if (
      includes('hilt com google dagger hilt android') ||
      includes('com google dagger hilt android') ||
      includes('hilt android')
    ) {
      return 'skills.android.guideline.android.hilt-com-google-dagger-hilt-android';
    }
    if (
      includes('hilt di framework') ||
      includes('manual factories') ||
      includes('no manual factories') ||
      includes('hilt framework')
    ) {
      return 'skills.android.guideline.android.hilt-di-framework-no-manual-factories';
    }
    if (includes('@hiltandroidapp') || includes('hiltandroidapp')) {
      return 'skills.android.guideline.android.hiltandroidapp-application-class';
    }
    if (includes('@androidentrypoint') || includes('androidentrypoint')) {
      return 'skills.android.guideline.android.androidentrypoint-activity-fragment-viewmodel';
    }
    if (
      includes('androidx lifecycle viewmodel') ||
      includes('androidx.lifecycle.viewmodel') ||
      (includes('viewmodel') && includes('androidx'))
    ) {
      return 'skills.android.guideline.android.viewmodel-androidx-lifecycle-viewmodel';
    }
    if (
      includes('survive configuration changes') ||
      includes('survives configuration changes') ||
      includes('configuration changes') ||
      includes('sobrevive') ||
      includes('configuracio')
    ) {
      return 'skills.android.guideline.android.viewmodel-sobrevive-configuration-changes';
    }
    if (
      includes('god activities') ||
      includes('god activity') ||
      includes('single activity + composables') ||
      includes('single activity composables')
    ) {
      return 'skills.android.guideline.android.god-activities-single-activity-composables';
    }
    if (includes('@composable') || includes('composable functions') || includes('composable para ui')) {
      return 'skills.android.guideline.android.composable-functions-composable-para-ui';
    }
    if (
      includes('argumentos entre pantallas') ||
      includes('pasar datos entre pantallas') ||
      includes('arguments between screens') ||
      includes('pass data between screens') ||
      includes('navigation arguments') ||
      includes('navargument') ||
      includes('savedstatehandle')
    ) {
      return 'skills.android.guideline.android.arguments-pasar-datos-entre-pantallas';
    }
    if (
      includes('adaptive layouts') ||
      includes('window size class') ||
      includes('windowsizeclass') ||
      includes('calculatewindowsizeclass') ||
      includes('windowwidthsizeclass') ||
      includes('windowheightsizeclass') ||
      includes('responsive design')
    ) {
      return 'skills.android.guideline.android.adaptive-layouts-responsive-design-windowsizeclass';
    }
    if (
      (includes('analizar estructura existente') || includes('analyze existing structure')) &&
      (includes('módulos') ||
        includes('modulos') ||
        includes('interfaces') ||
        includes('dependencias') ||
        includes('dependencies') ||
        includes('gradle'))
    ) {
      return 'skills.android.guideline.android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle';
    }
    if (
      includes('single activity') ||
      includes('multiple composables') ||
      includes('múltiples composables') ||
      includes('multiples composables') ||
      includes('fragments no activities') ||
      includes('no activities')
    ) {
      return 'skills.android.guideline.android.single-activity-mu-ltiples-composables-fragments-no-activities';
    }
    if (includes('@inject constructor') || includes('inject constructor')) {
      return 'skills.android.guideline.android.inject-constructor-constructor-injection';
    }
    if (includes('module') && includes('installin')) {
      return 'skills.android.guideline.android.module-installin-provide-dependencies';
    }
    if (includes('binds') && includes('interfaces')) {
      return 'skills.android.guideline.android.binds-para-implementaciones-de-interfaces-ma-s-eficiente';
    }
    if (includes('provides') && includes('interfaces')) {
      return 'skills.android.guideline.android.provides-para-interfaces-o-third-party';
    }
    if (
      includes('workmanager') &&
      (includes('androidx.work:work-runtime-ktx') ||
        includes('work runtime ktx') ||
        includes('work-runtime-ktx'))
    ) {
      return 'skills.android.guideline.android.workmanager-androidx-work-work-runtime-ktx';
    }
    if (includes('version catalog') || includes('version catalogs') || includes('libs.versions.toml')) {
      return 'skills.android.guideline.android.version-catalogs-libs-versions-toml-para-dependencias';
    }
    if (includes('workmanager') && includes('background tasks')) {
      return 'skills.android.guideline.android.workmanager-background-tasks';
    }
    if (
      includes('androidtest') ||
      includes('instrumented tests') ||
      includes('instrumented test') ||
      includes('device/emulator') ||
      includes('device emulator') ||
      includes('activityscenario') ||
      includes('androidjunit4') ||
      includes('espresso')
    ) {
      return 'skills.android.guideline.android.androidtest-instrumented-tests-device-emulator';
    }
    if (includes('aaa pattern') || includes('arrange act assert')) {
      return 'skills.android.guideline.android.aaa-pattern-arrange-act-assert';
    }
    if (includes('given when then') || includes('bdd style')) {
      return 'skills.android.guideline.android.given-when-then-bdd-style';
    }
    if ((includes('test ') || includes('test/')) && includes('unit tests') && includes('jvm')) {
      return 'skills.android.guideline.android.test-unit-tests-jvm';
    }
    if (
      (includes('viewmodelscope') && includes('scope de viewmodel')) ||
      includes('view model scope')
    ) {
      return 'skills.android.guideline.android.viewmodelscope-scope-de-viewmodel-cancelado-automa-ticamente';
    }
    if (includes('@viewmodelscoped') || includes('viewmodelscoped')) {
      return 'skills.android.guideline.android.viewmodelscoped-para-dependencias-de-viewmodel';
    }
    if (
      includes('no singleton') ||
      includes('singleton') ||
      includes('singletons everywhere') ||
      includes('hilt dagger') ||
      includes('hilt/dagger') ||
      includes('inyeccion de dependencias') ||
      includes('inyecion de dependencias') ||
      includes('usar inyeccion de dependencias') ||
      includes('usar inyecion de dependencias')
    ) {
      return 'skills.android.no-singleton-usar-inyeccio-n-de-dependencias-hilt-dagger';
    }
    if (
      includes('hardcoded strings') ||
      includes('hardcoded string') ||
      includes('usar strings.xml') ||
      includes('usar strings xml')
    ) {
      return 'skills.android.hardcoded-strings-usar-strings-xml';
    }
    if (
      (includes('strings.xml') || includes('strings xml')) &&
      (includes('values-es') ||
        includes('values-en') ||
        includes('por idioma') ||
        includes('localization') ||
        includes('localización') ||
        includes('localized'))
    ) {
      return 'skills.android.guideline.android.localization-strings-xml-por-idioma-values-es-values-en';
    }
    if (includes('plurals') && includes('values plurals xml')) {
      return 'skills.android.guideline.android.plurals-values-plurals-xml';
    }
    if (includes('runblocking') || includes('run blocking')) {
      return 'skills.android.no-runblocking';
    }
    return null;
  }

  if (platform === 'backend' || platform === 'frontend') {
    const prefix = platform === 'backend' ? 'skills.backend' : 'skills.frontend';
    if (
      includes('solid') ||
      includes('single responsibility') ||
      includes('srp') ||
      includes('controllers delgados') ||
      includes('logic in controllers') ||
      includes('lo gica en controllers') ||
      includes('lógica en controllers') ||
      includes('mover a servicios') ||
      includes('componentes pequeños') ||
      includes('componentes pequen os') ||
      includes('custom hooks para logica reutilizable') ||
      includes('custom hooks para lógica reutilizable') ||
      includes('prop drilling excesivo') ||
      includes('anemic domain models') ||
      includes('entidades solo con getters') ||
      includes('no logica de negocio en repositorios') ||
      includes('no lógica de negocio en repositorios')
    ) {
      return `${prefix}.no-solid-violations`;
    }
    if (
      includes('clean architecture') ||
      includes('clean code') ||
      includes('clean por feature') ||
      includes('domain application infrastructure presentation') ||
      includes('presentation application domain infrastructure') ||
      includes('dependencias hacia adentro') ||
      includes('capas presentacion') ||
      includes('capas presentación') ||
      includes('infrastructure domain') ||
      includes('feature first') ||
      includes('bounded context') ||
      includes('shared kernel')
    ) {
      return `${prefix}.enforce-clean-architecture`;
    }
    if (
      includes('mocks en produccion') ||
      includes('mocks en producción') ||
      includes('mocks in production') ||
      includes('solo datos reales') ||
      includes('jest.mock') ||
      includes('vi.mock')
    ) {
      return `${prefix}.mocks-en-produccio-n-solo-datos-reales`;
    }
    if (
      includes('transacciones') &&
      (includes('operaciones criticas') ||
        includes('operaciones cri ticas') ||
        includes('cri ticas') ||
        includes('operaciones críticas') ||
        includes('critical operations'))
    ) {
      return `${prefix}.guideline.backend.transacciones-para-operaciones-cri-ticas`;
    }
    if (
      includes('transacciones') &&
      (includes('multi tabla') ||
        includes('multi-tabla') ||
        includes('multi table') ||
        includes('multi-table'))
    ) {
      return `${prefix}.guideline.backend.transacciones-para-operaciones-multi-tabla`;
    }
    if (
      includes('exception filter') ||
      includes('exception filters') ||
      includes('@catch') ||
      includes('manejo global de excepciones') ||
      includes('catch para manejo global') ||
      includes('filter global de excepciones')
    ) {
      return `${prefix}.exception-filters-catch-para-manejo-global`;
    }
    if (
      includes('useguards') ||
      includes('jwtauthguard') ||
      includes('jwt auth guard') ||
      includes('guards autenticacion') ||
      includes('guards autorización') ||
      includes('guards autorizacion') ||
      includes('autenticacion autorizacion') ||
      includes('autenticación autorización') ||
      includes('use guards')
    ) {
      return `${prefix}.guards-para-autenticacio-n-autorizacio-n-useguards-jwtauthguard`;
    }
    if (
      includes('useinterceptors') ||
      includes('interceptors para logging') ||
      includes('interceptors logging') ||
      includes('interceptors de logging') ||
      includes('interceptors para transformacion') ||
      includes('interceptors transformacion') ||
      includes('interceptors para logging transformacion') ||
      includes('no en cada endpoint')
    ) {
      return `${prefix}.interceptors-para-logging-transformacio-n-no-en-cada-endpoint`;
    }
    if (
      includes('no singleton') ||
      includes('singletons everywhere') ||
      includes('singleton') ||
      includes('nestjs di container')
    ) {
      return `${prefix}.no-singleton`;
    }
    if (
      includes('magic numbers') ||
      includes('magic number') ||
      includes('constantes con nombres descriptivos')
    ) {
      return `${prefix}.magic-numbers-usar-constantes-con-nombres-descriptivos`;
    }
    if (
      includes('hardcoded values') ||
      includes('config en variables de entorno') ||
      includes('config en variables entorno')
    ) {
      return `${prefix}.hardcoded-values-config-en-variables-de-entorno`;
    }
    if (
      includes('no defaults') &&
      includes('config') &&
      (includes('produccion') || includes('production') || includes('critica') || includes('critical'))
    ) {
      return `${prefix}.no-defaults-en-produccio-n-fallar-si-falta-config-cri-tica`;
    }
    if (
      includes('callback hell') ||
      includes('callback-hell') ||
      includes('promise chains') ||
      includes('then chains') ||
      includes('then chain') ||
      includes('nested callbacks') ||
      includes('promises encadenadas') ||
      includes('usar async await') ||
      includes('usar async/await')
    ) {
      return `${prefix}.callback-hell-usar-async-await`;
    }
    if (includes('class components') || includes('solo functional components')) {
      return `${prefix}.no-class-components`;
    }
    if (
      includes('god classes') ||
      includes('god class') ||
      includes('servicios que mezclan responsabilidades') ||
      includes('mezclan responsabilidades') ||
      includes('modulos cohesivos') ||
      includes('módulos cohesivos') ||
      includes('mo dulos cohesivos') ||
      includes('un modulo por feature') ||
      includes('un módulo por feature') ||
      includes('un mo dulo por feature')
    ) {
      return `${prefix}.no-god-classes`;
    }
    if (
      includes('empty catch') ||
      includes('catch vacios') ||
      includes('catch vacíos') ||
      includes('try-catch silenciosos') ||
      includes('silenciar errores') ||
      includes('siempre loggear o propagar')
    ) {
      return `${prefix}.no-empty-catch`;
    }
    if (
      includes('console log') ||
      includes('console.log') ||
      includes('logs ad-hoc') ||
      includes('no logs en produccion') ||
      includes('no logs en producción') ||
      includes('no logs en produccio n')
    ) {
      return `${prefix}.no-console-log`;
    }
    if (
      includes('no loggear datos sensibles') ||
      includes('no loggear datos sensibles passwords tokens pii') ||
      includes('no loggear pii') ||
      includes('passwords tokens pii') ||
      includes('password tokens pii') ||
      includes('passwords, tokens, pii') ||
      includes('passwords tokens datos sensibles')
    ) {
      return `${prefix}.no-loggear-datos-sensibles-passwords-tokens-pii`;
    }
    if (
      includes('rate limiting') &&
      (includes('brute force') || includes('prevent brute force') || includes('prevenir brute force'))
    ) {
      return `${prefix}.guideline.backend.rate-limiting-nestjs-throttler-para-prevenir-brute-force`;
    }
    if (includes('rate limiting') && (includes('abuse') || includes('prevenir abuso'))) {
      return `${prefix}.guideline.backend.rate-limiting-throttler-para-prevenir-abuse`;
    }
    if (
      (includes('cors configurado') || includes('cors configurada')) &&
      (includes('solo') || includes('permitidos') || includes('allowed origins'))
    ) {
      return `${prefix}.guideline.backend.cors-configurado-solo-ori-genes-permitidos`;
    }
    if (
      includes('cors') ||
      includes('enablecors') ||
      includes('enable cors') ||
      includes('configurar orígenes permitidos') ||
      includes('configurar origenes permitidos')
    ) {
      return `${prefix}.guideline.backend.cors-configurar-ori-genes-permitidos`;
    }
    if (
      (includes('validationpipe global') || includes('validation pipe global')) &&
      (includes('whitelist') || includes('whitelist true'))
    ) {
      return `${prefix}.guideline.backend.validationpipe-global-en-main-ts-con-whitelist-true`;
    }
    if (
      (includes('versionado') || includes('versioning') || includes('api v1') || includes('api v2') || includes('/api/v1') || includes('/api/v2')) &&
      includes('api')
    ) {
      return `${prefix}.guideline.backend.versionado-api-v1-api-v2`;
    }
    if (
      includes('pipes para validación global') ||
      includes('pipes para validacion global') ||
      includes('validationpipe en main ts') ||
      includes('validationpipe en main') ||
      includes('useglobalpipes')
    ) {
      return `${prefix}.guideline.backend.pipes-para-validacio-n-global-validationpipe-en-main-ts`;
    }
    if (
      (includes('validation de config') || includes('validation config') || includes('config validation')) &&
      (includes('joi') || includes('class validator') || includes('validation schema') || includes('validate')) &&
      (includes('.env') || includes('env') || includes('configmodule'))
    ) {
      return `${prefix}.guideline.backend.validation-de-config-joi-o-class-validator-para-env`;
    }
    if (
      includes('class validator') &&
      (includes('decorators') || includes('isstring') || includes('isemail') || includes('min') || includes('max'))
    ) {
      return `${prefix}.guideline.backend.class-validator-decorators-isstring-isemail-min-max`;
    }
    if (
      includes('class transformer') &&
      (includes('transform') || includes('exclude') || includes('expose'))
    ) {
      return `${prefix}.guideline.backend.class-transformer-transform-exclude-expose`;
    }
    if (
      (includes('input validation') || includes('siempre validar con dtos') || includes('validate with dtos')) &&
      includes('dto')
    ) {
      return `${prefix}.guideline.backend.input-validation-siempre-validar-con-dtos`;
    }
    if (
      (includes('nested validation') || includes('validatenested') || includes('nested type')) &&
      (includes('dto') || includes('type'))
    ) {
      return `${prefix}.guideline.backend.nested-validation-validatenested-type`;
    }
    if (
      (includes('dto boundaries') || includes('dtos en boundaries') || includes('dto en boundaries') || includes('dtos en boundary') || includes('dtos en boundaries')) &&
      (includes('validacio') || includes('validacion') || includes('entrada') || includes('salida') || includes('entrada/salida'))
    ) {
      return `${prefix}.guideline.backend.dtos-en-boundaries-validacio-n-en-entrada-salida`;
    }
    if (
      (includes('dtos separados') || includes('dto separados') || includes('createorderdto') || includes('updateorderdto') || includes('orderresponsedto')) &&
      (includes('create') || includes('update') || includes('response') || includes('separados'))
    ) {
      return `${prefix}.guideline.backend.dtos-separados-createorderdto-updateorderdto-orderresponsedto`;
    }
    if (
      (includes('retornar dtos') ||
        includes('return dtos') ||
        includes('no exponer entidades directamente') ||
        includes('exponer entidades directamente') ||
        includes('retornar entidades directamente')) &&
      (includes('dto') || includes('entidades') || includes('entities'))
    ) {
      return `${prefix}.guideline.backend.retornar-dtos-no-exponer-entidades-directamente`;
    }
    if (
      includes('winston') ||
      includes('logger estructurado') ||
      includes('structured logger') ||
      includes('json logs') ||
      includes('json logger')
    ) {
      return `${prefix}.guideline.backend.winston-logger-estructurado-json-logs`;
    }
    if (
      includes('loggear errores') ||
      includes('contexto completo') ||
      includes('full context') ||
      includes('logger.error') ||
      includes('requestid') ||
      includes('traceid') ||
      includes('userid')
    ) {
      return `${prefix}.guideline.backend.loggear-errores-con-contexto-completo`;
    }
    if (
      includes('correlation ids') ||
      includes('correlationid') ||
      includes('tracing distribuido') ||
      includes('x-request-id') ||
      includes('traceparent')
    ) {
      return `${prefix}.guideline.backend.correlation-ids-para-tracing-distribuido`;
    }
    if (
      includes('metricas prometheus') ||
      includes('prom-client') ||
      includes('prometheus') ||
      includes('metrics prometheus')
    ) {
      return `${prefix}.guideline.backend.me-tricas-prometheus-prom-client-para-me-tricas`;
    }
    if (
      includes('password hashing') ||
      includes('bcrypt') ||
      includes('salt rounds') ||
      includes('salt round') ||
      includes('bcrypt con salt rounds') ||
      includes('bcrypt con salt rounds >= 10') ||
      includes('bcrypt con salt rounds 10')
    ) {
      return `${prefix}.password-hashing-bcrypt-con-salt-rounds-10`;
    }
    if (
      includes('explicit any') ||
      includes(' no any') ||
      includes('avoid any') ||
      includes('usar unknown') ||
      includes('type guard') ||
      includes('tipos explicitos') ||
      includes('tipos explícitos')
    ) {
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

    const normalizedDescription = normalizeForLookup(description);
    const slugifiedDescription = slugify(description);
    const explicitBackendNoDefaultsRule =
      platform === 'backend' &&
      slugifiedDescription.includes('no-defaults') &&
      slugifiedDescription.includes('config') &&
      (slugifiedDescription.includes('produccio-n') ||
        slugifiedDescription.includes('production') ||
        slugifiedDescription.includes('cri-tica') ||
        slugifiedDescription.includes('critical'))
        ? 'skills.backend.no-defaults-en-produccio-n-fallar-si-falta-config-cri-tica'
        : undefined;
    const knownRuleId =
      explicitBackendNoDefaultsRule ?? normalizeKnownRuleTarget(platform, normalizedDescription);
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
      severity: knownRuleId
        ? resolveDefaultSeverityForKnownRule(knownRuleId, inferRuleSeverity(rawLine))
        : inferRuleSeverity(rawLine),
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
