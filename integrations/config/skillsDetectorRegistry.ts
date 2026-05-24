import { normalizeSkillsAstNodeIds, type SkillsCompiledRule } from './skillsLock';

type SkillsDetectorKind = 'heuristic';

type SkillsDetectorBinding = {
  detectorId: string;
  detectorKind: SkillsDetectorKind;
  mappedHeuristicRuleIds: ReadonlyArray<string>;
};

const heuristicDetector = (
  detectorId: string,
  mappedHeuristicRuleIds: ReadonlyArray<string>
): SkillsDetectorBinding => ({
  detectorId,
  detectorKind: 'heuristic',
  mappedHeuristicRuleIds,
});

const registryByRuleId: Record<string, SkillsDetectorBinding> = {
  'skills.ios.no-force-unwrap': heuristicDetector('ios.force-unwrap', [
    'heuristics.ios.force-unwrap.ast',
  ]),
  'skills.ios.no-force-try': heuristicDetector('ios.force-try', [
    'heuristics.ios.force-try.ast',
  ]),
  'skills.ios.no-anyview': heuristicDetector('ios.anyview', ['heuristics.ios.anyview.ast']),
  'skills.ios.guideline.ios.any-type-erasure-usar-generics-con-protocolos-de-frontera': heuristicDetector(
    'ios.type-erasure.any',
    ['heuristics.ios.type-erasure.any.ast']
  ),
  'skills.ios.guideline.ios.generics-reutilizar-co-digo-type-safe': heuristicDetector(
    'ios.generics-over-any-type-erasure',
    ['heuristics.ios.type-erasure.any.ast']
  ),
  'skills.ios.guideline.ios.associated-types-generics-en-protocols': heuristicDetector(
    'ios.associated-types-generics-over-any-type-erasure',
    ['heuristics.ios.type-erasure.any.ast']
  ),
  'skills.ios.guideline.ios.opaque-types-some-view-some-publisher-cuando-sea-apropiado':
    heuristicDetector('ios.opaque-types-over-type-erasure', [
      'heuristics.ios.anyview.ast',
      'heuristics.ios.type-erasure.any.ast',
    ]),
  'skills.ios.no-force-cast': heuristicDetector('ios.force-cast', [
    'heuristics.ios.force-cast.ast',
  ]),
  'skills.ios.no-callback-style-outside-bridges': heuristicDetector(
    'ios.callback-style',
    ['heuristics.ios.callback-style.ast']
  ),
  'skills.ios.guideline.ios.cancellables-almacenar-en-set-anycancellable': heuristicDetector(
    'ios.combine.sink-without-store',
    ['heuristics.ios.combine.sink-without-store.ast']
  ),
  'skills.ios.guideline.ios.subscribers-sink-assign': heuristicDetector(
    'ios.combine.subscription-without-store',
    ['heuristics.ios.combine.sink-without-store.ast']
  ),
  'skills.ios.no-dispatchqueue': heuristicDetector('ios.dispatchqueue', [
    'heuristics.ios.dispatchqueue.ast',
  ]),
  'skills.ios.guideline.ios.mainactor-para-co-digo-que-debe-ejecutarse-en-el-hilo-principal':
    heuristicDetector('ios.concurrency.mainactor-dispatchqueue', [
      'heuristics.ios.dispatchqueue.ast',
      'heuristics.ios.concurrency.ui-state-without-mainactor.ast',
    ]),
  'skills.ios.guideline.ios.actor-para-estado-compartido-thread-safe':
    heuristicDetector('ios.concurrency.shared-state-actor-boundary', [
      'heuristics.ios.dispatchqueue.ast',
      'heuristics.ios.dispatchsemaphore.ast',
      'heuristics.ios.concurrency.shared-mutable-state-without-actor.ast',
    ]),
  'skills.ios.guideline.ios.sincronizacio-n-nativa-actors-para-estado-compartido-osallocatedunfair':
    heuristicDetector('ios.concurrency.shared-state-actor-boundary', [
      'heuristics.ios.dispatchqueue.ast',
      'heuristics.ios.dispatchsemaphore.ast',
      'heuristics.ios.concurrency.shared-mutable-state-without-actor.ast',
    ]),
  'skills.ios.no-dispatchgroup': heuristicDetector('ios.dispatchgroup', [
    'heuristics.ios.dispatchgroup.ast',
  ]),
  'skills.ios.no-dispatchsemaphore': heuristicDetector('ios.dispatchsemaphore', [
    'heuristics.ios.dispatchsemaphore.ast',
  ]),
  'skills.ios.no-operation-queue': heuristicDetector('ios.operation-queue', [
    'heuristics.ios.operation-queue.ast',
  ]),
  'skills.ios.no-task-detached': heuristicDetector('ios.task-detached', [
    'heuristics.ios.task-detached.ast',
  ]),
  'skills.ios.guideline.ios.cancelar-correctamente-comprobar-task-iscancelled-en-operaciones-larga':
    heuristicDetector('ios.concurrency.long-task-cancellation-check', [
      'heuristics.ios.concurrency.long-task-without-cancellation-check.ast',
    ]),
  'skills.ios.no-async-without-await': heuristicDetector('ios.concurrency.async-without-await', [
    'heuristics.ios.concurrency.async-without-await.ast',
  ]),
  'skills.ios.guideline.ios.avoid-over-use-async-await-ma-s-simple-para-single-values':
    heuristicDetector('ios.concurrency.avoid-overuse-async-without-await', [
      'heuristics.ios.concurrency.async-without-await.ast',
    ]),
  'skills.ios.guideline.ios-concurrency.use-references-linting-md-for-rule-intent-and-preferred-fixes-avoid-du':
    heuristicDetector('ios.concurrency.dummy-await', [
      'heuristics.ios.concurrency.dummy-await.ast',
    ]),
  'skills.ios.guideline.ios.delegation-pattern-weak-delegates-para-evitar-retain-cycles': heuristicDetector(
    'ios.memory.strong-delegate',
    ['heuristics.ios.memory.strong-delegate.ast']
  ),
  'skills.ios.guideline.ios.evitar-retain-cycles-especialmente-en-closures-delegates': heuristicDetector(
    'ios.memory.retain-cycles',
    [
      'heuristics.ios.memory.strong-delegate.ast',
      'heuristics.ios.memory.strong-self-escaping-closure.ast',
    ]
  ),
  'skills.ios.guideline.ios.retain-cycles-memory-leaks': heuristicDetector(
    'ios.memory.retain-cycles',
    [
      'heuristics.ios.memory.strong-delegate.ast',
      'heuristics.ios.memory.strong-self-escaping-closure.ast',
    ]
  ),
  'skills.ios.guideline.ios.unowned-self-solo-si-self-siempre-existe-mientras-closure-existe': heuristicDetector(
    'ios.memory.unowned-self-capture',
    ['heuristics.ios.memory.unowned-self-capture.ast']
  ),
  'skills.ios.guideline.ios.arc-automatic-reference-counting': heuristicDetector(
    'ios.memory.manual-management',
    ['heuristics.ios.memory.manual-management.ast']
  ),
  'skills.ios.guideline.ios.trackformemoryleaks-helper-para-detectar-memory-leaks-en-tests': heuristicDetector(
    'ios.testing.makesut-memory-tracking',
    ['heuristics.ios.testing.makesut-without-memory-tracking.ast']
  ),
  'skills.ios.guideline.ios.makesut-pattern-factory-para-system-under-test': heuristicDetector(
    'ios.testing.makesut-factory',
    ['heuristics.ios.testing.direct-sut-instantiation-without-makesut.ast']
  ),
  'skills.ios.guideline.ios-swift-testing.preserve-repository-specific-test-contracts-such-as-makesut-and-memory':
    heuristicDetector('ios.testing.repository-specific-memory-contract', [
      'heuristics.ios.testing.direct-sut-instantiation-without-makesut.ast',
      'heuristics.ios.testing.makesut-without-memory-tracking.ast',
    ]),
  'skills.ios.guideline.ios.guard-clauses-evitar-pyramid-of-doom-early-returns': heuristicDetector(
    'ios.maintainability.nested-if-pyramid',
    ['heuristics.ios.maintainability.nested-if-pyramid.ast']
  ),
  'skills.ios.guideline.ios.guard-let-para-early-return-unwrap-queda-en-scope': heuristicDetector(
    'ios.maintainability.nested-if-pyramid',
    ['heuristics.ios.maintainability.nested-if-pyramid.ast']
  ),
  'skills.ios.guideline.ios.no-poner-comentarios-en-el-co-digo-nombres-autodescriptivos': heuristicDetector(
    'ios.maintainability.comment-trivia',
    ['heuristics.ios.maintainability.comment-trivia.ast']
  ),
  'skills.ios.guideline.ios.ignoring-warnings-warnings-errores-futuros': heuristicDetector(
    'ios.maintainability.warning-suppression',
    ['heuristics.ios.maintainability.warning-suppression.ast']
  ),
  'skills.ios.guideline.ios.no-singleton-usar-inyeccio-n-de-dependencias-no-compartir-instancias-g': heuristicDetector(
    'ios.architecture.custom-singleton',
    ['heuristics.ios.architecture.custom-singleton.ast']
  ),
  'skills.ios.guideline.ios.no-singletons-excepto-sistema-urlsession-shared-esta-ok': heuristicDetector(
    'ios.architecture.custom-singleton',
    ['heuristics.ios.architecture.custom-singleton.ast']
  ),
  'skills.ios.guideline.ios.massive-view-controllers-viewcontrollers-que-mezclan-presentacio-n-nav': heuristicDetector(
    'ios.architecture.massive-view-controller',
    ['heuristics.ios.architecture.massive-view-controller.ast']
  ),
  'skills.ios.guideline.ios.mvc-evitar-massive-view-controller-no-escalable': heuristicDetector(
    'ios.architecture.massive-view-controller',
    ['heuristics.ios.architecture.massive-view-controller.ast']
  ),
  'skills.ios.guideline.ios.swiftui-primero-uikit-solo-cuando-sea-estrictamente-necesario':
    heuristicDetector('ios.ui.swiftui-first-uikit-contained', [
      'heuristics.ios.architecture.massive-view-controller.ast',
      'heuristics.ios.interface-builder.storyboard-xib.ast',
    ]),
  'skills.ios.guideline.ios.implicitly-unwrapped-solo-para-iboutlets-y-casos-muy-especi-ficos': heuristicDetector(
    'ios.safety.non-iboutlet-iuo',
    ['heuristics.ios.safety.non-iboutlet-iuo.ast']
  ),
  'skills.ios.guideline.ios.singletons-dificultan-testing': heuristicDetector(
    'ios.architecture.custom-singleton',
    ['heuristics.ios.architecture.custom-singleton.ast']
  ),
  'skills.ios.guideline.ios.swinject-prohibido-di-manual-o-environment': heuristicDetector(
    'ios.architecture.swinject',
    ['heuristics.ios.architecture.swinject.ast']
  ),
  'skills.ios.guideline.ios.tca-the-composable-architecture-para-apps-grandes-funcional':
    heuristicDetector('ios.architecture.tca-composable-architecture', [
      'heuristics.ios.architecture.tca-composable-architecture.ast',
    ]),
  'skills.ios.guideline.ios.navegacio-n-event-driven-estilo-tca-cuando-el-modelo-lo-requiera-event':
    heuristicDetector('ios.navigation.event-driven-no-tca-runtime', [
      'heuristics.ios.architecture.tca-composable-architecture.ast',
    ]),
  'skills.ios.guideline.ios.magic-numbers-usar-constantes-con-nombres': heuristicDetector(
    'ios.maintainability.magic-number-layout',
    ['heuristics.ios.maintainability.magic-number-layout.ast']
  ),
  'skills.ios.guideline.ios-swiftui-expert.use-relative-layout-over-hard-coded-constants':
    heuristicDetector('ios.maintainability.magic-number-layout', [
      'heuristics.ios.maintainability.magic-number-layout.ast',
    ]),
  'skills.ios.guideline.ios.auto-layout-nslayoutconstraint': heuristicDetector(
    'ios.uikit.manual-frame-layout',
    ['heuristics.ios.uikit.manual-frame-layout.ast']
  ),
  'skills.ios.guideline.ios.prohibido-print-y-logs-ad-hoc': heuristicDetector(
    'ios.logging.adhoc-print',
    ['heuristics.ios.logging.adhoc-print.ast']
  ),
  'skills.ios.guideline.ios.catch-vaci-os-prohibido-silenciar-errores-ast-common-error-emptycatch': heuristicDetector(
    'ios.error.empty-catch',
    ['heuristics.ios.error.empty-catch.ast']
  ),
  'skills.ios.guideline.ios.error-handling-custom-networkerror-enum': heuristicDetector(
    'ios.error.typed-error-enum',
    ['heuristics.ios.error.nserror-throw.ast']
  ),
  'skills.ios.guideline.ios.error-handling-global-custom-error-enum': heuristicDetector(
    'ios.error.typed-error-enum',
    ['heuristics.ios.error.nserror-throw.ast']
  ),
  'skills.ios.guideline.ios.apiendpoint-como-struct-data-driven-ocp-endpoints-en-features-no-enum-':
    heuristicDetector('ios.networking.endpoint-enum-ocp', [
      'heuristics.ios.networking.endpoint-enum-ocp.ast',
    ]),
  'skills.ios.guideline.ios.no-loggear-pii-tokens-emails-ids-sensibles': heuristicDetector(
    'ios.logging.sensitive-data',
    ['heuristics.ios.logging.sensitive-data.ast']
  ),
  'skills.ios.guideline.ios.obfuscation-strings-sensibles-en-co-digo': heuristicDetector(
    'ios.security.hardcoded-sensitive-string',
    ['heuristics.ios.security.hardcoded-sensitive-string.ast']
  ),
  'skills.ios.guideline.ios.dateformatter-fechas-localizadas': heuristicDetector(
    'ios.localization.unlocalized-dateformatter',
    ['heuristics.ios.localization.unlocalized-dateformatter.ast']
  ),
  'skills.ios.guideline.ios.codable-decodificacio-n-automa-tica-de-json-nunca-jsonserialization': heuristicDetector(
    'ios.json.jsonserialization',
    ['heuristics.ios.json.jsonserialization.ast']
  ),
  'skills.ios.guideline.ios.codable-para-serializacio-n-json-nunca-jsonserialization': heuristicDetector(
    'ios.json.jsonserialization',
    ['heuristics.ios.json.jsonserialization.ast']
  ),
  'skills.ios.guideline.ios.codable-para-serializacio-n-json-plist': heuristicDetector(
    'ios.json.jsonserialization',
    ['heuristics.ios.json.jsonserialization.ast']
  ),
  'skills.ios.guideline.ios.alamofire-prohibido-usar-urlsession-nativo': heuristicDetector(
    'ios.networking.alamofire',
    ['heuristics.ios.networking.alamofire.ast']
  ),
  'skills.ios.guideline.ios.cocoapods-prohibido': heuristicDetector(
    'ios.dependencies.cocoapods',
    ['heuristics.ios.dependencies.cocoapods.ast']
  ),
  'skills.ios.guideline.ios.carthage-prohibido': heuristicDetector(
    'ios.dependencies.carthage',
    ['heuristics.ios.dependencies.carthage.ast']
  ),
  'skills.ios.guideline.ios.cero-libreri-as-de-terceros-siempre-existe-solucio-n-nativa':
    heuristicDetector('ios.dependencies.third-party-native-baseline', [
      'heuristics.ios.networking.alamofire.ast',
      'heuristics.ios.dependencies.cocoapods.ast',
      'heuristics.ios.dependencies.carthage.ast',
      'heuristics.ios.architecture.swinject.ast',
      'heuristics.ios.architecture.tca-composable-architecture.ast',
      'heuristics.ios.testing.third-party-ui-test-framework.ast',
    ]),
  'skills.ios.guideline.ios.libreri-as-de-terceros-usar-apis-nativas': heuristicDetector(
    'ios.dependencies.third-party-native-baseline',
    [
      'heuristics.ios.networking.alamofire.ast',
      'heuristics.ios.dependencies.cocoapods.ast',
      'heuristics.ios.dependencies.carthage.ast',
      'heuristics.ios.architecture.swinject.ast',
      'heuristics.ios.architecture.tca-composable-architecture.ast',
      'heuristics.ios.testing.third-party-ui-test-framework.ast',
    ]
  ),
  'skills.ios.guideline.ios.keychain-passwords-tokens-no-userdefaults': heuristicDetector(
    'ios.security.userdefaults-sensitive-data',
    ['heuristics.ios.security.userdefaults-sensitive-data.ast']
  ),
  'skills.ios.guideline.ios.keychainservices-nativo-passwords-tokens-datos-sensibles-no-wrappers-d': heuristicDetector(
    'ios.security.userdefaults-sensitive-data',
    ['heuristics.ios.security.userdefaults-sensitive-data.ast']
  ),
  'skills.ios.guideline.ios.userdefaults-settings-simples-no-datos-sensibles': heuristicDetector(
    'ios.security.userdefaults-sensitive-data',
    ['heuristics.ios.security.userdefaults-sensitive-data.ast']
  ),
  'skills.ios.guideline.ios.app-transport-security-ats-https-por-defecto': heuristicDetector(
    'ios.security.insecure-transport',
    ['heuristics.ios.security.insecure-transport.ast']
  ),
  'skills.ios.guideline.ios.localizable-strings-deprecado-usar-string-catalogs':
    heuristicDetector('ios.localization.localizable-strings', [
      'heuristics.ios.localization.localizable-strings.ast',
    ]),
  'skills.ios.guideline.ios.string-catalogs-xcstrings': heuristicDetector(
    'ios.localization.localizable-strings',
    ['heuristics.ios.localization.localizable-strings.ast']
  ),
  'skills.ios.guideline.ios.string-catalogs-xcstrings-sistema-moderno-de-localizacio-n-xcode-15':
    heuristicDetector('ios.localization.localizable-strings', [
      'heuristics.ios.localization.localizable-strings.ast',
    ]),
  'skills.ios.guideline.ios.cero-strings-hardcodeadas-en-ui': heuristicDetector(
    'ios.localization.hardcoded-ui-string',
    ['heuristics.ios.localization.hardcoded-ui-string.ast']
  ),
  'skills.ios.guideline.ios.string-localized-api-moderna-para-strings-traducibles': heuristicDetector(
    'ios.localization.hardcoded-ui-string',
    ['heuristics.ios.localization.hardcoded-ui-string.ast']
  ),
  'skills.ios.guideline.ios.automatic-plural-handling-en-string-catalogs':
    heuristicDetector('ios.localization.localizable-strings', [
      'heuristics.ios.localization.localizable-strings.ast',
    ]),
  'skills.ios.guideline.ios.pluralizacio-n-con-tablas-de-strings': heuristicDetector(
    'ios.localization.localizable-strings',
    ['heuristics.ios.localization.localizable-strings.ast']
  ),
  'skills.ios.guideline.ios.assets-en-asset-catalogs-con-soporte-para-todos-los-taman-os': heuristicDetector(
    'ios.assets.loose-resource',
    ['heuristics.ios.assets.loose-resource.ast']
  ),
  'skills.ios.guideline.ios.dynamic-type-font-scaling-automa-tico': heuristicDetector(
    'ios.accessibility.fixed-font-size',
    ['heuristics.ios.accessibility.fixed-font-size.ast']
  ),
  'skills.ios.guideline.ios.dynamic-type-fuentes-escalables-y-layouts-adaptativos': heuristicDetector(
    'ios.accessibility.fixed-font-size',
    ['heuristics.ios.accessibility.fixed-font-size.ast']
  ),
  'skills.ios.guideline.ios.rtl-support-right-to-left-para-a-rabe-hebreo': heuristicDetector(
    'ios.localization.physical-text-alignment',
    ['heuristics.ios.localization.physical-text-alignment.ast']
  ),
  'skills.ios.guideline.ios.background-threads-no-bloquear-main-thread': heuristicDetector(
    'ios.performance.blocking-sleep',
    ['heuristics.ios.performance.blocking-sleep.ast']
  ),
  'skills.ios.guideline.ios-concurrency.use-references-threading-md-to-avoid-thread-centric-debugging-and-rely':
    heuristicDetector('ios.concurrency.thread-centric-debugging', [
      'heuristics.ios.concurrency.thread-centric-debugging.ast',
    ]),
  'skills.ios.guideline.ios.structured-concurrency-task-taskgroup-actor-asyncsequence-asyncstream':
    heuristicDetector('ios.concurrency.structured-baseline', [
      'heuristics.ios.callback-style.ast',
      'heuristics.ios.dispatchqueue.ast',
      'heuristics.ios.dispatchgroup.ast',
      'heuristics.ios.dispatchsemaphore.ast',
      'heuristics.ios.operation-queue.ast',
      'heuristics.ios.task-detached.ast',
    ]),
  'skills.ios.guideline.ios.async-await-para-operaciones-asi-ncronas': heuristicDetector(
    'ios.concurrency.async-await-baseline',
    [
      'heuristics.ios.callback-style.ast',
      'heuristics.ios.dispatchqueue.ast',
      'heuristics.ios.dispatchgroup.ast',
      'heuristics.ios.dispatchsemaphore.ast',
      'heuristics.ios.operation-queue.ast',
      'heuristics.ios.task-detached.ast',
    ]
  ),
  'skills.ios.guideline.ios.taskgroup-para-operaciones-paralelas': heuristicDetector(
    'ios.concurrency.taskgroup-preferred',
    ['heuristics.ios.dispatchgroup.ast']
  ),
  'skills.ios.guideline.ios.urlsession-con-async-await-nativo-obligatorio':
    heuristicDetector('ios.networking.urlsession-native-baseline', [
      'heuristics.ios.networking.alamofire.ast',
      'heuristics.ios.callback-style.ast',
    ]),
  'skills.ios.guideline.ios.os-logger-para-logging-estructurado': heuristicDetector(
    'ios.logging.structured-os-logger',
    ['heuristics.ios.logging.adhoc-print.ast']
  ),
  'skills.ios.guideline.ios.accessibility-labels-accessibilitylabel': heuristicDetector(
    'ios.accessibility.icon-only-control-label',
    ['heuristics.ios.accessibility.icon-only-control-label.ast']
  ),
  'skills.ios.guideline.ios.accessibility-identifiers-para-localizar-elementos':
    heuristicDetector('ios.accessibility.missing-accessibility-identifier', [
      'heuristics.ios.accessibility.missing-accessibility-identifier.ast',
    ]),
  'skills.ios.guideline.ios.traits-accessibilityaddtraits-isbutton': heuristicDetector(
    'ios.accessibility.on-tap-without-button-trait',
    ['heuristics.ios.accessibility.on-tap-without-button-trait.ast']
  ),
  'skills.ios.guideline.ios.voiceover-labels-hints-traits': heuristicDetector(
    'ios.accessibility.voiceover-labels-traits',
    [
      'heuristics.ios.accessibility.icon-only-control-label.ast',
      'heuristics.ios.accessibility.on-tap-without-button-trait.ast',
    ]
  ),
  'skills.ios.guideline.ios-swiftui-expert.use-interactive-only-for-tappable-focusable-elements':
    heuristicDetector('ios.swiftui.glass-interactive-static-element', [
      'heuristics.ios.swiftui.glass-interactive-static-element.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.use-glasseffectid-with-namespace-for-morphing-transitions':
    heuristicDetector('ios.swiftui.glasseffectid-namespace', [
      'heuristics.ios.swiftui.glasseffectid-without-namespace.ast',
    ]),
  'skills.ios.guideline.ios.image-optimization-resize-compress-cache': heuristicDetector(
    'ios.swiftui.image-data-decoding',
    ['heuristics.ios.swiftui.image-data-decoding.ast']
  ),
  'skills.ios.guideline.ios.programmatic-ui-no-storyboards-xibs-mejor-control-de-versiones':
    heuristicDetector('ios.interface-builder.storyboard-xib', [
      'heuristics.ios.interface-builder.storyboard-xib.ast',
    ]),
  'skills.ios.guideline.ios.storyboards-grandes-merge-conflicts-lentitud':
    heuristicDetector('ios.interface-builder.storyboard-xib', [
      'heuristics.ios.interface-builder.storyboard-xib.ast',
    ]),
  'skills.ios.guideline.ios.uiviewcontroller-delgados-lo-gica-en-viewmodels':
    heuristicDetector('ios.architecture.massive-view-controller', [
      'heuristics.ios.architecture.massive-view-controller.ast',
    ]),
  'skills.ios.guideline.ios.bindable-para-bindings-con-observable':
    heuristicDetector('ios.swiftui.missing-bindable-observable-binding', [
      'heuristics.ios.swiftui.missing-bindable-observable-binding.ast',
    ]),
  'skills.ios.guideline.ios.bindable-para-exponer-bindings-de-un-observable-inyectado':
    heuristicDetector('ios.swiftui.missing-bindable-observable-binding', [
      'heuristics.ios.swiftui.missing-bindable-observable-binding.ast',
    ]),
  'skills.ios.guideline.ios.environment-en-swiftui-para-di-moderna': heuristicDetector(
    'ios.swiftui.environment-di-no-swinject',
    ['heuristics.ios.architecture.swinject.ast']
  ),
  'skills.ios.guideline.ios.environment-para-inyeccio-n-de-dependencias-y-valores-del-sistema':
    heuristicDetector('ios.swiftui.environment-system-values-no-swinject', [
      'heuristics.ios.architecture.swinject.ast',
    ]),
  'skills.ios.guideline.ios.dependencies-en-package-swift-versiones-especi-ficas':
    heuristicDetector('ios.dependencies.swiftpm-branch-dependency', [
      'heuristics.ios.dependencies.swiftpm-branch-dependency.ast',
    ]),
  'skills.ios.guideline.ios.swift-6-2-usar-la-versio-n-actual-con-approachable-concurrency':
    heuristicDetector('ios.dependencies.swift-tools-version', [
      'heuristics.ios.dependencies.swift-tools-version-below-6-2.ast',
    ]),
  'skills.ios.guideline.ios-concurrency.use-read-on-package-swift-for-swiftpm-settings-tools-version-strict-co':
    heuristicDetector('ios.dependencies.swift-tools-version', [
      'heuristics.ios.dependencies.swift-tools-version-below-6-2.ast',
      'heuristics.ios.concurrency.swiftpm-default-isolation-not-mainactor.ast',
      'heuristics.ios.concurrency.swiftpm-strict-concurrency-below-complete.ast',
    ]),
  'skills.ios.guideline.ios.strict-concurrency-checking-activar-en-complete':
    heuristicDetector('ios.concurrency.strict-concurrency-below-complete', [
      'heuristics.ios.concurrency.strict-concurrency-below-complete.ast',
    ]),
  'skills.ios.guideline.ios-concurrency.use-grep-for-swiftstrictconcurrency-or-swiftdefaultactorisolation-in-p':
    heuristicDetector('ios.concurrency.project-settings', [
      'heuristics.ios.concurrency.strict-concurrency-below-complete.ast',
      'heuristics.ios.concurrency.default-actor-isolation-not-mainactor.ast',
      'heuristics.ios.concurrency.upcoming-feature-disabled.ast',
      'heuristics.ios.concurrency.swiftpm-default-isolation-not-mainactor.ast',
      'heuristics.ios.concurrency.swiftpm-strict-concurrency-below-complete.ast',
    ]),
  'skills.ios.guideline.ios.validar-configuracio-n-de-concurrencia-swiftstrictconcurrency-swiftdef':
    heuristicDetector('ios.concurrency.project-settings', [
      'heuristics.ios.concurrency.strict-concurrency-below-complete.ast',
      'heuristics.ios.concurrency.default-actor-isolation-not-mainactor.ast',
      'heuristics.ios.concurrency.upcoming-feature-disabled.ast',
      'heuristics.ios.concurrency.swiftpm-default-isolation-not-mainactor.ast',
      'heuristics.ios.concurrency.swiftpm-strict-concurrency-below-complete.ast',
    ]),
  'skills.ios.guideline.ios.file-naming-pascalcase-para-tipos': heuristicDetector(
    'ios.naming.non-pascal-case-type',
    ['heuristics.ios.naming.non-pascal-case-type.ast']
  ),
  'skills.ios.guideline.ios.reuse-cells-uitableview-uicollectionview': heuristicDetector(
    'ios.uikit.cell-without-reuse',
    ['heuristics.ios.uikit.cell-without-reuse.ast']
  ),
  'skills.ios.no-unchecked-sendable': heuristicDetector('ios.unchecked-sendable', [
    'heuristics.ios.unchecked-sendable.ast',
  ]),
  'skills.ios.guideline.ios.sendable-conformance-para-tipos-thread-safe-que-cruzan-boundaries':
    heuristicDetector('ios.concurrency.sendable-unsafe-escape', [
      'heuristics.ios.unchecked-sendable.ast',
      'heuristics.ios.preconcurrency.ast',
      'heuristics.ios.nonisolated-unsafe.ast',
      'heuristics.ios.assume-isolated.ast',
    ]),
  'skills.ios.guideline.ios.sendable-para-tipos-que-cruzan-boundaries-de-concurrencia':
    heuristicDetector('ios.concurrency.sendable-boundary-unsafe-escape', [
      'heuristics.ios.unchecked-sendable.ast',
      'heuristics.ios.preconcurrency.ast',
      'heuristics.ios.nonisolated-unsafe.ast',
      'heuristics.ios.assume-isolated.ast',
    ]),
  'skills.ios.guideline.ios.identificar-el-boundary-de-aislamiento-mainactor-actor-nonisolated':
    heuristicDetector('ios.concurrency.isolation-boundary-unsafe-escape', [
      'heuristics.ios.unchecked-sendable.ast',
      'heuristics.ios.preconcurrency.ast',
      'heuristics.ios.nonisolated-unsafe.ast',
      'heuristics.ios.assume-isolated.ast',
    ]),
  'skills.ios.no-preconcurrency': heuristicDetector('ios.preconcurrency', [
    'heuristics.ios.preconcurrency.ast',
  ]),
  'skills.ios.no-nonisolated-unsafe': heuristicDetector('ios.nonisolated-unsafe', [
    'heuristics.ios.nonisolated-unsafe.ast',
  ]),
  'skills.ios.no-assume-isolated': heuristicDetector('ios.assume-isolated', [
    'heuristics.ios.assume-isolated.ast',
  ]),
  'skills.ios.guideline.ios.no-usar-mainactor-como-parche-justificar-el-aislamiento':
    heuristicDetector('ios.assume-isolated', [
      'heuristics.ios.assume-isolated.ast',
      'heuristics.ios.concurrency.mainactor-run-patch.ast',
    ]),
  'skills.ios.no-observable-object': heuristicDetector('ios.observable-object', [
    'heuristics.ios.observable-object.ast',
  ]),
  'skills.ios.guideline.ios.observable-state-para-estado-owned-compartido-por-el-view':
    heuristicDetector('ios.observable-object', ['heuristics.ios.observable-object.ast']),
  'skills.ios.guideline.ios-swiftui-expert.use-observable-for-shared-state-with-mainactor-if-not-using-default-ac':
    heuristicDetector('ios.observable-object', ['heuristics.ios.observable-object.ast']),
  'skills.ios.guideline.ios.macros-observable-preview-custom-macros':
    heuristicDetector('ios.swiftui.macros', [
      'heuristics.ios.observable-object.ast',
      'heuristics.ios.swiftui.legacy-preview-provider.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.references-state-management-md-property-wrappers-and-data-flow-prefer-':
    heuristicDetector('ios.swiftui.state-management', [
      'heuristics.ios.observable-object.ast',
      'heuristics.ios.legacy-swiftui-observable-wrapper.ast',
      'heuristics.ios.swiftui.non-private-state-ownership.ast',
      'heuristics.ios.passed-value-state-wrapper.ast',
    ]),
  'skills.ios.guideline.ios.property-wrappers-state-binding-observable-custom-wrappers':
    heuristicDetector('ios.swiftui.property-wrappers', [
      'heuristics.ios.observable-object.ast',
      'heuristics.ios.legacy-swiftui-observable-wrapper.ast',
      'heuristics.ios.swiftui.non-private-state-ownership.ast',
      'heuristics.ios.passed-value-state-wrapper.ast',
      'heuristics.ios.swiftui.missing-bindable-observable-binding.ast',
    ]),
  'skills.ios.guideline.ios.protocols-para-testability-mock-con-clases-que-conforman-protocol':
    heuristicDetector('ios.testing.test-double-protocol-conformance', [
      'heuristics.ios.testing.test-double-without-protocol.ast',
    ]),
  'skills.ios.guideline.ios.spies-mocks-verificar-comportamiento-real': heuristicDetector(
    'ios.testing.production-test-double',
    ['heuristics.ios.testing.production-test-double.ast']
  ),
  'skills.ios.guideline.ios.color-contrast-wcag-aa-mi-nimo': heuristicDetector(
    'ios.accessibility.low-contrast-static-color-pair',
    ['heuristics.ios.accessibility.low-contrast-static-color-pair.ast']
  ),
  'skills.ios.guideline.ios.contraste-wcag-2-1-aa-mi-nimo': heuristicDetector(
    'ios.accessibility.low-contrast-static-color-pair',
    ['heuristics.ios.accessibility.low-contrast-static-color-pair.ast']
  ),
  'skills.ios.no-legacy-swiftui-observable-wrapper': heuristicDetector(
    'ios.legacy-swiftui-observable-wrapper',
    ['heuristics.ios.legacy-swiftui-observable-wrapper.ast']
  ),
  'skills.ios.guideline.ios.environmentobject-solo-si-el-objeto-es-global-y-estable':
    heuristicDetector('ios.swiftui.environment-object', [
      'heuristics.ios.swiftui.environment-object.ast',
    ]),
  'skills.ios.guideline.ios.environment-environmentkey-para-dependencias-globales-del-a-rbol':
    heuristicDetector('ios.swiftui.environment-key-over-environment-object', [
      'heuristics.ios.swiftui.environment-object.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.always-mark-state-and-stateobject-as-private-makes-dependencies-clear': heuristicDetector(
    'ios.swiftui.non-private-state-ownership',
    ['heuristics.ios.swiftui.non-private-state-ownership.ast']
  ),
  'skills.ios.guideline.ios.state-para-local-estado-privado-del-view': heuristicDetector(
    'ios.swiftui.state-local-private',
    [
      'heuristics.ios.swiftui.non-private-state-ownership.ast',
      'heuristics.ios.passed-value-state-wrapper.ast',
    ]
  ),
  'skills.ios.guideline.ios.state-solo-para-estado-local-y-privado': heuristicDetector(
    'ios.swiftui.state-local-private',
    [
      'heuristics.ios.swiftui.non-private-state-ownership.ast',
      'heuristics.ios.passed-value-state-wrapper.ast',
    ]
  ),
  'skills.ios.no-passed-value-state-wrapper': heuristicDetector('ios.passed-value-state-wrapper', [
    'heuristics.ios.passed-value-state-wrapper.ast',
  ]),
  'skills.ios.guideline.ios.stateobject-viewmodel-ownership': heuristicDetector(
    'ios.passed-value-state-wrapper',
    ['heuristics.ios.passed-value-state-wrapper.ast']
  ),
  'skills.ios.guideline.ios.binding-para-compartir-pasar-estado-editable-a-child-views':
    heuristicDetector('ios.swiftui.binding-passed-state-wrapper', [
      'heuristics.ios.passed-value-state-wrapper.ast',
    ]),
  'skills.ios.no-navigation-view': heuristicDetector('ios.navigation-view', [
    'heuristics.ios.navigation-view.ast',
  ]),
  'skills.ios.guideline.ios.deep-links-deben-mapear-a-rutas-del-path':
    heuristicDetector('ios.navigation.path-restoration', [
      'heuristics.ios.navigation.path-without-restoration.ast',
    ]),
  'skills.ios.guideline.ios.state-restoration-rehidratar-path-desde-estado-persistido-si-aplica':
    heuristicDetector('ios.navigation.path-restoration', [
      'heuristics.ios.navigation.path-without-restoration.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.use-modern-apis-no-deprecated-modifiers-or-patterns-see-references-mod':
    heuristicDetector('ios.swiftui.modern-api-replacements', [
      'heuristics.ios.navigation-view.ast',
      'heuristics.ios.foreground-color.ast',
      'heuristics.ios.corner-radius.ast',
      'heuristics.ios.tab-item.ast',
      'heuristics.ios.on-tap-gesture.ast',
      'heuristics.ios.scrollview-shows-indicators.ast',
      'heuristics.ios.string-format.ast',
      'heuristics.ios.sheet-is-presented.ast',
      'heuristics.ios.legacy-onchange.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.use-navigationdestination-for-for-type-safe-navigation':
    heuristicDetector('ios.swiftui.untyped-navigation-link-destination', [
      'heuristics.ios.swiftui.untyped-navigation-link-destination.ast',
    ]),
  'skills.ios.guideline.ios.coordinator-para-navegacio-n-no-acoplamiento-entre-views':
    heuristicDetector('ios.navigation.no-view-coupled-destination', [
      'heuristics.ios.swiftui.untyped-navigation-link-destination.ast',
    ]),
  'skills.ios.guideline.ios.coordinator-pattern-para-navegacio-n-compleja':
    heuristicDetector('ios.navigation.coordinator-pattern', [
      'heuristics.ios.swiftui.untyped-navigation-link-destination.ast',
    ]),
  'skills.ios.guideline.ios.mvvm-c-coordinator-para-navegacio-n':
    heuristicDetector('ios.navigation.mvvm-c-coordinator', [
      'heuristics.ios.swiftui.untyped-navigation-link-destination.ast',
    ]),
  'skills.ios.no-foreground-color': heuristicDetector('ios.foreground-color', [
    'heuristics.ios.foreground-color.ast',
  ]),
  'skills.ios.no-corner-radius': heuristicDetector('ios.corner-radius', [
    'heuristics.ios.corner-radius.ast',
  ]),
  'skills.ios.no-tab-item': heuristicDetector('ios.tab-item', [
    'heuristics.ios.tab-item.ast',
  ]),
  'skills.ios.no-on-tap-gesture': heuristicDetector('ios.on-tap-gesture', [
    'heuristics.ios.on-tap-gesture.ast',
  ]),
  'skills.ios.no-string-format': heuristicDetector('ios.string-format', [
    'heuristics.ios.string-format.ast',
  ]),
  'skills.ios.no-foreach-indices': heuristicDetector('ios.foreach-indices', [
    'heuristics.ios.foreach-indices.ast',
  ]),
  'skills.ios.guideline.ios-swiftui-expert.ensure-foreach-uses-stable-identity-see-references-list-patterns-md':
    heuristicDetector('ios.swiftui.foreach-self-identity', [
      'heuristics.ios.swiftui.foreach-self-identity.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.verify-list-patterns-use-stable-identity-see-references-list-patterns-':
    heuristicDetector('ios.swiftui.foreach-self-identity', [
      'heuristics.ios.swiftui.foreach-self-identity.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.use-scrollviewreader-for-programmatic-scrolling-with-stable-ids':
    heuristicDetector('ios.swiftui.scrollviewreader-stable-ids', [
      'heuristics.ios.foreach-indices.ast',
      'heuristics.ios.swiftui.foreach-self-identity.ast',
    ]),
  'skills.ios.guideline.ios.scrollviewreader-scroll-programa-tico':
    heuristicDetector('ios.swiftui.scrollviewreader-programmatic-scroll-stable-ids', [
      'heuristics.ios.foreach-indices.ast',
      'heuristics.ios.swiftui.foreach-self-identity.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.use-self-printchanges-to-debug-unexpected-view-updates':
    heuristicDetector('ios.swiftui.self-print-changes', [
      'heuristics.ios.swiftui.self-print-changes.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.avoid-inline-filtering-in-foreach-prefilter-and-cache':
    heuristicDetector('ios.swiftui.inline-foreach-transform', [
      'heuristics.ios.swiftui.inline-foreach-transform.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.ensure-constant-number-of-views-per-foreach-element':
    heuristicDetector('ios.swiftui.foreach-conditional-view-count', [
      'heuristics.ios.swiftui.foreach-conditional-view-count.ast',
    ]),
  'skills.ios.no-contains-user-filter': heuristicDetector('ios.contains-user-filter', [
    'heuristics.ios.contains-user-filter.ast',
  ]),
  'skills.ios.no-geometryreader': heuristicDetector('ios.geometryreader', [
    'heuristics.ios.geometryreader.ast',
  ]),
  'skills.ios.no-font-weight-bold': heuristicDetector('ios.font-weight-bold', [
    'heuristics.ios.font-weight-bold.ast',
  ]),
  'skills.ios.guideline.ios-swiftui-expert.prefer-static-member-lookup-blue-vs-color-blue':
    heuristicDetector('ios.swiftui.explicit-color-static-member', [
      'heuristics.ios.swiftui.explicit-color-static-member.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.prefer-viewbuilder-let-content-content-over-closure-based-content-prop':
    heuristicDetector('ios.swiftui.closure-based-viewbuilder-content', [
      'heuristics.ios.swiftui.closure-based-viewbuilder-content.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.use-viewbuilder-functions-only-for-small-simple-sections':
    heuristicDetector('ios.swiftui.large-viewbuilder-function', [
      'heuristics.ios.swiftui.large-viewbuilder-function.ast',
    ]),
  'skills.ios.guideline.ios.composicio-n-de-views-views-pequen-os-reutilizables':
    heuristicDetector('ios.swiftui.large-viewbuilder-function', [
      'heuristics.ios.swiftui.large-viewbuilder-function.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.pass-only-needed-values-to-views-avoid-large-config-or-context-objects':
    heuristicDetector('ios.swiftui.large-config-context-prop', [
      'heuristics.ios.swiftui.large-config-context-prop.ast',
    ]),
  'skills.ios.guideline.ios.evitar-invalidaciones-pasar-valores-mi-nimos-y-evitar-objetos-contexto':
    heuristicDetector('ios.swiftui.invalidation-minimal-inputs', [
      'heuristics.ios.swiftui.large-config-context-prop.ast',
      'heuristics.ios.swiftui.redundant-reactive-state-assignment.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.prefer-modifiers-over-conditional-views-for-state-changes-maintains-vi':
    heuristicDetector('ios.swiftui.conditional-same-view-identity', [
      'heuristics.ios.swiftui.conditional-same-view-identity.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.sheets-should-own-their-actions-and-call-dismiss-internally':
    heuristicDetector('ios.swiftui.parent-owned-sheet-action', [
      'heuristics.ios.swiftui.parent-owned-sheet-action.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.avoid-redundant-state-updates-in-onreceive-onchange-scroll-handlers':
    heuristicDetector('ios.swiftui.redundant-reactive-state-assignment', [
      'heuristics.ios.swiftui.redundant-reactive-state-assignment.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.use-lazyvstack-lazyhstack-for-large-lists':
    heuristicDetector('ios.swiftui.non-lazy-scroll-foreach', [
      'heuristics.ios.swiftui.non-lazy-scroll-foreach.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.no-object-creation-in-body':
    heuristicDetector('ios.swiftui.body-object-creation', [
      'heuristics.ios.swiftui.body-object-creation.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.keep-view-body-simple-and-pure-no-side-effects-or-complex-logic':
    heuristicDetector('ios.swiftui.body-object-creation', [
      'heuristics.ios.swiftui.body-object-creation.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.suggest-image-downsampling-when-uiimage-data-is-encountered':
    heuristicDetector('ios.swiftui.image-data-decoding', [
      'heuristics.ios.swiftui.image-data-decoding.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.use-imagerenderer-for-rendering-swiftui-views':
    heuristicDetector('ios.swiftui.imagerenderer', [
      'heuristics.ios.swiftui.manual-rendering-without-imagerenderer.ast',
    ]),
  'skills.ios.guideline.ios.reduce-motion-respetar-preferencia-del-sistema':
    heuristicDetector('ios.accessibility.reduce-motion', [
      'heuristics.ios.accessibility.animation-without-reduce-motion.ast',
    ]),
  'skills.ios.guideline.ios.reduce-motion-respetar-preferencias-del-usuario':
    heuristicDetector('ios.accessibility.reduce-motion', [
      'heuristics.ios.accessibility.animation-without-reduce-motion.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.action-handlers-should-reference-methods-not-contain-inline-logic':
    heuristicDetector('ios.swiftui.inline-action-logic', [
      'heuristics.ios.swiftui.inline-action-logic.ast',
    ]),
  'skills.ios.no-scrollview-shows-indicators': heuristicDetector(
    'ios.scrollview-shows-indicators',
    ['heuristics.ios.scrollview-shows-indicators.ast']
  ),
  'skills.ios.no-sheet-is-presented': heuristicDetector('ios.sheet-is-presented', [
    'heuristics.ios.sheet-is-presented.ast',
  ]),
  'skills.ios.no-legacy-onchange': heuristicDetector('ios.legacy-onchange', [
    'heuristics.ios.legacy-onchange.ast',
  ]),
  'skills.ios.guideline.ios.task-task-id-trabajos-async-con-cancelacio-n-automa-tica': heuristicDetector(
    'ios.swiftui.onappear-task',
    ['heuristics.ios.swiftui.onappear-task.ast']
  ),
  'skills.ios.guideline.ios.task-para-lanzar-contextos-asi-ncronos-desde-co-digo-si-ncrono':
    heuristicDetector('ios.swiftui.sync-triggered-task', [
      'heuristics.ios.swiftui.onappear-task.ast',
      'heuristics.ios.swiftui.onchange-task.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.use-task-modifier-for-automatic-cancellation-of-async-work': heuristicDetector(
    'ios.swiftui.onappear-task',
    ['heuristics.ios.swiftui.onappear-task.ast']
  ),
  'skills.ios.guideline.ios-swiftui-expert.use-task-id-for-value-dependent-tasks': heuristicDetector(
    'ios.swiftui.onchange-task',
    ['heuristics.ios.swiftui.onchange-task.ast']
  ),
  'skills.ios.guideline.ios-swiftui-expert.use-let-for-read-only-values-var-onchange-for-reactive-reads':
    heuristicDetector('ios.swiftui.onchange-readonly-var', [
      'heuristics.ios.swiftui.onchange-readonly-var.ast',
    ]),
  'skills.ios.no-uiscreen-main-bounds': heuristicDetector('ios.uiscreen-main-bounds', [
    'heuristics.ios.uiscreen-main-bounds.ast',
  ]),
  'skills.ios.guideline.ios-swiftui-expert.views-should-work-in-any-context-don-t-assume-screen-size-or-presentat':
    heuristicDetector('ios.uiscreen-main-bounds', [
      'heuristics.ios.uiscreen-main-bounds.ast',
    ]),
  'skills.ios.prefer-swift-testing': heuristicDetector('ios.testing.xctest-import', [
    'heuristics.ios.testing.xctest-import.ast',
    'heuristics.ios.testing.xctest-suite-modernizable.ast',
  ]),
  'skills.ios.guideline.ios.swift-testing-ios-17-framework-de-testing-moderno-preferido':
    heuristicDetector('ios.testing.xctest-import', [
      'heuristics.ios.testing.xctest-import.ast',
      'heuristics.ios.testing.xctest-suite-modernizable.ast',
    ]),
  'skills.ios.no-xctassert': heuristicDetector('ios.testing.xctassert', [
    'heuristics.ios.testing.xctassert.ast',
  ]),
  'skills.ios.no-xctunwrap': heuristicDetector('ios.testing.xctunwrap', [
    'heuristics.ios.testing.xctunwrap.ast',
  ]),
  'skills.ios.guideline.ios.expect-y-require-assertions-de-swift-testing':
    heuristicDetector('ios.testing.swift-testing-assertions', [
      'heuristics.ios.testing.xctassert.ast',
      'heuristics.ios.testing.xctunwrap.ast',
    ]),
  'skills.ios.no-wait-for-expectations': heuristicDetector('ios.testing.wait-for-expectations', [
    'heuristics.ios.testing.wait-for-expectations.ast',
  ]),
  'skills.ios.guideline.ios.wait-for-existence-xctwaiter-para-elementos-asi-ncronos':
    heuristicDetector('ios.testing.wait-for-expectations', [
      'heuristics.ios.testing.wait-for-expectations.ast',
    ]),
  'skills.ios.no-legacy-expectation-description': heuristicDetector(
    'ios.testing.legacy-expectation-description',
    ['heuristics.ios.testing.legacy-expectation-description.ast']
  ),
  'skills.ios.no-mixed-testing-frameworks': heuristicDetector('ios.testing.mixed-frameworks', [
    'heuristics.ios.testing.mixed-frameworks.ast',
  ]),
  'skills.ios.guideline.ios.quick-nimble-prohibido-usar-swift-testing-nativo': heuristicDetector(
    'ios.testing.quick-nimble',
    ['heuristics.ios.testing.quick-nimble.ast']
  ),
  'skills.ios.guideline.ios.xcuitest-ui-testing-nativo': heuristicDetector(
    'ios.testing.third-party-ui-test-framework',
    ['heuristics.ios.testing.third-party-ui-test-framework.ast']
  ),
  'skills.ios.no-nsmanagedobject-boundary': heuristicDetector(
    'ios.core-data.nsmanagedobject-boundary',
    ['heuristics.ios.core-data.nsmanagedobject-boundary.ast']
  ),
  'skills.ios.no-nsmanagedobject-async-boundary': heuristicDetector(
    'ios.core-data.nsmanagedobject-async-boundary',
    ['heuristics.ios.core-data.nsmanagedobject-async-boundary.ast']
  ),
  'skills.ios.no-core-data-layer-leak': heuristicDetector('ios.core-data.layer-leak', [
    'heuristics.ios.core-data.layer-leak.ast',
  ]),
  'skills.ios.guideline.ios.core-data-solo-para-proyectos-legacy': heuristicDetector(
    'ios.persistence.core-data-legacy-boundary',
    [
      'heuristics.ios.core-data.nsmanagedobject-boundary.ast',
      'heuristics.ios.core-data.nsmanagedobject-async-boundary.ast',
      'heuristics.ios.core-data.layer-leak.ast',
      'heuristics.ios.core-data.nsmanagedobject-state-leak.ast',
    ]
  ),
  'skills.ios.no-swiftdata-layer-leak': heuristicDetector('ios.swiftdata.layer-leak', [
    'heuristics.ios.swiftdata.layer-leak.ast',
  ]),
  'skills.ios.guideline.ios.swiftdata-ios-17-persistencia-moderna-preferida':
    heuristicDetector('ios.persistence.swiftdata-preferred', [
      'heuristics.ios.core-data.layer-leak.ast',
      'heuristics.ios.swiftdata.layer-leak.ast',
    ]),
  'skills.ios.no-nsmanagedobject-state-leak': heuristicDetector(
    'ios.core-data.nsmanagedobject-state-leak',
    ['heuristics.ios.core-data.nsmanagedobject-state-leak.ast']
  ),
  'skills.backend.no-empty-catch': heuristicDetector('typescript.empty-catch', [
    'heuristics.ts.empty-catch.ast',
  ]),
  'skills.backend.no-console-log': heuristicDetector('typescript.console-log', [
    'heuristics.ts.console-log.ast',
  ]),
  'skills.backend.avoid-explicit-any': heuristicDetector('typescript.explicit-any', [
    'heuristics.ts.explicit-any.ast',
  ]),
  'skills.backend.no-solid-violations': heuristicDetector('typescript.solid', [
    'heuristics.ts.solid.srp.class-command-query-mix.ast',
    'heuristics.ts.solid.isp.interface-command-query-mix.ast',
    'heuristics.ts.solid.ocp.discriminator-switch.ast',
    'heuristics.ts.solid.lsp.override-not-implemented.ast',
    'heuristics.ts.solid.dip.framework-import.ast',
    'heuristics.ts.solid.dip.concrete-instantiation.ast',
  ]),
  'skills.backend.enforce-clean-architecture': heuristicDetector(
    'typescript.clean-architecture',
    [
      'heuristics.ts.solid.dip.framework-import.ast',
      'heuristics.ts.solid.dip.concrete-instantiation.ast',
    ]
  ),
  'skills.backend.no-god-classes': heuristicDetector('typescript.god-class', [
    'heuristics.ts.god-class-large-class.ast',
  ]),
  'skills.backend.guideline.backend.dependency-injection-injectable-inject-providers-array':
    heuristicDetector('typescript.nestjs.constructor-di-without-decorator', [
      'heuristics.ts.nestjs.constructor-di-without-decorator.ast',
    ]),
  'skills.backend.guideline.backend.event-store-log-de-eventos-para-auditori-a':
    heuristicDetector('typescript.backend.persistence-mutation-without-audit-event', [
      'heuristics.ts.backend.persistence-mutation-without-audit-event.ast',
    ]),
  'skills.backend.guideline.backend.audit-logging-registrar-cambios-cri-ticos':
    heuristicDetector('typescript.backend.persistence-mutation-without-audit-event', [
      'heuristics.ts.backend.persistence-mutation-without-audit-event.ast',
    ]),
  'skills.backend.guideline.backend.event-sourcing-para-auditori-a-auditlogs-table':
    heuristicDetector('typescript.backend.persistence-mutation-without-audit-event', [
      'heuristics.ts.backend.persistence-mutation-without-audit-event.ast',
    ]),
  'skills.backend.guideline.backend.emitir-eventos-de-dominio-ordercreatedevent-ordercancelledevent':
    heuristicDetector('typescript.backend.persistence-mutation-without-audit-event', [
      'heuristics.ts.backend.persistence-mutation-without-audit-event.ast',
    ]),
  'skills.backend.guideline.backend.domain-events-ordercreatedevent-userregisteredevent':
    heuristicDetector('typescript.backend.persistence-mutation-without-audit-event', [
      'heuristics.ts.backend.persistence-mutation-without-audit-event.ast',
    ]),
  'skills.backend.guideline.backend.event-handlers-onevent-order-created': heuristicDetector(
    'typescript.backend.event-handler-without-on-event',
    ['heuristics.ts.backend.event-handler-without-on-event.ast']
  ),
  'skills.backend.guideline.backend.no-cachear-datos-sensibles-o-cifrar-antes-de-cachear':
    heuristicDetector('typescript.backend.sensitive-cache-write', [
      'heuristics.ts.backend.sensitive-cache-write.ast',
    ]),
  'skills.backend.guideline.backend.refresh-tokens-no-solo-access-tokens':
    heuristicDetector('typescript.backend.auth-response-without-refresh-token', [
      'heuristics.ts.backend.auth-response-without-refresh-token.ast',
    ]),
  'skills.backend.guideline.backend.no-defaults-en-produccio-n-fallar-si-falta-config-cri-tica':
    heuristicDetector('typescript.backend.process-env-default-fallback', [
      'heuristics.ts.backend.process-env-default-fallback.ast',
    ]),
  'skills.backend.guideline.backend.correlation-ids-para-tracing-distribuido':
    heuristicDetector('typescript.backend.log-without-context', [
      'heuristics.ts.backend.log-without-context.ast',
    ]),
  'skills.backend.guideline.backend.nestjs-config-configmodule-para-variables-de-entorno':
    heuristicDetector('typescript.backend.direct-process-env-read', [
      'heuristics.ts.backend.direct-process-env-read.ast',
    ]),
  'skills.backend.guideline.backend.validation-de-config-joi-o-class-validator-para-env':
    heuristicDetector('typescript.backend.config-module-without-validation', [
      'heuristics.ts.backend.config-module-without-validation.ast',
    ]),
  'skills.backend.guideline.backend.compression-gzip-para-responses-grandes':
    heuristicDetector('typescript.backend.missing-compression-middleware', [
      'heuristics.ts.backend.missing-compression-middleware.ast',
    ]),
  'skills.backend.guideline.backend.soft-deletes-deletedat-en-lugar-de-delete-fi-sico':
    heuristicDetector('typescript.backend.hard-delete-without-soft-delete', [
      'heuristics.ts.backend.hard-delete-without-soft-delete.ast',
    ]),
  'skills.backend.guideline.backend.soft-deletes-por-defecto-deletedat-column':
    heuristicDetector('typescript.backend.hard-delete-without-soft-delete', [
      'heuristics.ts.backend.hard-delete-without-soft-delete.ast',
    ]),
  'skills.backend.guideline.backend.class-validator-decorators-isstring-isemail-min-max':
    heuristicDetector('typescript.backend.dto-property-without-validation', [
      'heuristics.ts.backend.dto-property-without-validation.ast',
    ]),
  'skills.backend.guideline.backend.class-transformer-transform-exclude-expose':
    heuristicDetector('typescript.backend.dto-property-without-validation', [
      'heuristics.ts.backend.dto-property-without-validation.ast',
    ]),
  'skills.backend.guideline.backend.dtos-en-boundaries-validacio-n-en-entrada-salida':
    heuristicDetector('typescript.backend.dto-property-without-validation', [
      'heuristics.ts.backend.dto-property-without-validation.ast',
    ]),
  'skills.backend.guideline.backend.dtos-para-validacio-n-class-validator-class-transformer':
    heuristicDetector('typescript.backend.dto-property-without-validation', [
      'heuristics.ts.backend.dto-property-without-validation.ast',
    ]),
  'skills.backend.guideline.backend.input-validation-siempre-validar-con-dtos':
    heuristicDetector('typescript.backend.dto-property-without-validation', [
      'heuristics.ts.backend.dto-property-without-validation.ast',
    ]),
  'skills.backend.guideline.backend.swagger-nestjs-swagger-decoradores-apiproperty':
    heuristicDetector('typescript.backend.dto-property-without-api-property', [
      'heuristics.ts.backend.dto-property-without-api-property.ast',
    ]),
  'skills.backend.guideline.backend.nested-validation-validatenested-type':
    heuristicDetector('typescript.backend.dto-nested-property-without-nested-validation', [
      'heuristics.ts.backend.dto-nested-property-without-nested-validation.ast',
    ]),
  'skills.backend.guideline.backend.pipes-para-validacio-n-global-validationpipe-en-main-ts':
    heuristicDetector('typescript.backend.missing-global-validation-pipe', [
      'heuristics.ts.backend.missing-global-validation-pipe.ast',
    ]),
  'skills.backend.guideline.backend.validationpipe-global-en-main-ts-con-whitelist-true':
    heuristicDetector('typescript.backend.missing-global-validation-pipe', [
      'heuristics.ts.backend.missing-global-validation-pipe.ast',
    ]),
  'skills.backend.guideline.backend.helmet-security-headers':
    heuristicDetector('typescript.backend.missing-helmet-security-headers', [
      'heuristics.ts.backend.missing-helmet-security-headers.ast',
    ]),
  'skills.backend.guideline.backend.guards-en-todas-las-rutas-protegidas-useguards-jwtauthguard':
    heuristicDetector('typescript.backend.controller-route-without-guard', [
      'heuristics.ts.backend.controller-route-without-guard.ast',
    ]),
  'skills.backend.guideline.backend.guards-para-autenticacio-n-autorizacio-n-useguards-jwtauthguard':
    heuristicDetector('typescript.backend.controller-route-without-guard', [
      'heuristics.ts.backend.controller-route-without-guard.ast',
    ]),
  'skills.backend.guideline.backend.role-based-access-control-roles-admin-user':
    heuristicDetector('typescript.backend.controller-route-without-roles', [
      'heuristics.ts.backend.controller-route-without-roles.ast',
    ]),
  'skills.backend.guideline.backend.rate-limiting-nestjs-throttler-para-prevenir-brute-force':
    heuristicDetector('typescript.backend.auth-route-without-throttle', [
      'heuristics.ts.backend.auth-route-without-throttle.ast',
    ]),
  'skills.backend.guideline.backend.rate-limiting-throttler-para-prevenir-abuse':
    heuristicDetector('typescript.backend.auth-route-without-throttle', [
      'heuristics.ts.backend.auth-route-without-throttle.ast',
    ]),
  'skills.backend.guideline.backend.callback-hell-usar-async-await': heuristicDetector(
    'typescript.callback-hell',
    ['heuristics.ts.callback-hell.ast']
  ),
  'skills.backend.guideline.backend.preferir-early-returns-guard-clauses-evitar-if-else-anidados':
    heuristicDetector('typescript.nested-if-else', ['heuristics.ts.nested-if-else.ast']),
  'skills.backend.guideline.backend.try-catch-silenciosos-siempre-loggear-o-propagar-ast-common-error-empt':
    heuristicDetector('typescript.empty-catch', ['heuristics.ts.empty-catch.ast']),
  'skills.backend.guideline.backend.hardcoded-values-config-en-variables-de-entorno':
    heuristicDetector('typescript.hardcoded-secret-token', [
      'heuristics.ts.hardcoded-secret-token.ast',
    ]),
  'skills.backend.guideline.backend.secrets-management-variables-de-entorno-nunca-en-co-digo':
    heuristicDetector('typescript.hardcoded-secret-token', [
      'heuristics.ts.hardcoded-secret-token.ast',
    ]),
  'skills.backend.guideline.backend.secrets-separados-aws-secrets-manager-hashicorp-vault':
    heuristicDetector('typescript.hardcoded-secret-token', [
      'heuristics.ts.hardcoded-secret-token.ast',
    ]),
  'skills.backend.guideline.backend.log-levels-error-warn-info-debug': heuristicDetector(
    'typescript.console-logging',
    ['heuristics.ts.console-log.ast', 'heuristics.ts.console-error.ast']
  ),
  'skills.backend.guideline.backend.no-loggear-datos-sensibles-passwords-tokens-pii':
    heuristicDetector('typescript.backend.sensitive-data-logging', [
      'heuristics.ts.backend.sensitive-data-logging.ast',
    ]),
  'skills.backend.guideline.backend.contexto-en-logs-userid-requestid-traceid':
    heuristicDetector('typescript.backend.log-without-context', [
      'heuristics.ts.backend.log-without-context.ast',
    ]),
  'skills.backend.guideline.backend.loggear-errores-con-contexto-completo':
    heuristicDetector('typescript.backend.log-without-context', [
      'heuristics.ts.backend.log-without-context.ast',
    ]),
  'skills.backend.guideline.backend.magic-numbers-usar-constantes-con-nombres-descriptivos':
    heuristicDetector('typescript.backend.magic-number-literal', [
      'heuristics.ts.backend.magic-number-literal.ast',
    ]),
  'skills.backend.guideline.backend.manejo-de-errores-lanzar-excepciones-especi-ficas':
    heuristicDetector('typescript.backend.generic-error-throw', [
      'heuristics.ts.backend.generic-error-throw.ast',
    ]),
  'skills.backend.guideline.backend.custom-exceptions-validationexception-notfoundexception-unauthorizedex':
    heuristicDetector('typescript.backend.generic-error-throw', [
      'heuristics.ts.backend.generic-error-throw.ast',
      'heuristics.ts.backend.raw-throw-expression.ast',
    ]),
  'skills.backend.guideline.backend.mocks-en-produccio-n-solo-datos-reales':
    heuristicDetector('typescript.backend.production-mock-or-spy', [
      'heuristics.ts.backend.production-mock-or-spy.ast',
    ]),
  'skills.backend.guideline.backend.en-produccio-n-ni-un-mocks-ni-un-spies-todo-real-de-bbdd-supabase-post':
    heuristicDetector('typescript.backend.production-mock-or-spy', [
      'heuristics.ts.backend.production-mock-or-spy.ast',
    ]),
  'skills.backend.guideline.backend.no-exponer-stack-traces-solo-en-desarrollo':
    heuristicDetector('typescript.backend.error-stack-in-http-response', [
      'heuristics.ts.backend.error-stack-in-http-response.ast',
    ]),
  'skills.backend.guideline.backend.error-responses-consistentes-statuscode-message-timestamp-path':
    heuristicDetector('typescript.backend.inconsistent-error-response', [
      'heuristics.ts.backend.inconsistent-error-response.ast',
    ]),
  'skills.backend.guideline.backend.http-status-codes-apropiados-200-201-400-401-403-404-500':
    heuristicDetector('typescript.backend.error-payload-success-status', [
      'heuristics.ts.backend.error-payload-success-status.ast',
    ]),
  'skills.backend.guideline.backend.http-status-codes-sema-ntica-correcta':
    heuristicDetector('typescript.backend.error-payload-success-status', [
      'heuristics.ts.backend.error-payload-success-status.ast',
    ]),
  'skills.backend.guideline.backend.retornar-dtos-no-exponer-entidades-directamente':
    heuristicDetector('typescript.backend.controller-entity-response', [
      'heuristics.ts.backend.controller-entity-response.ast',
    ]),
  'skills.backend.guideline.backend.controllers-delgados-solo-routing-y-validacio-n-lo-gica-en-servicios':
    heuristicDetector('typescript.backend.controller-business-logic', [
      'heuristics.ts.backend.controller-business-logic.ast',
    ]),
  'skills.backend.guideline.backend.lo-gica-en-controllers-mover-a-servicios-use-cases':
    heuristicDetector('typescript.backend.controller-business-logic', [
      'heuristics.ts.backend.controller-business-logic.ast',
    ]),
  'skills.backend.guideline.backend.no-lo-gica-de-negocio-en-repositorios-solo-crud-y-queries':
    heuristicDetector('typescript.backend.repository-business-logic', [
      'heuristics.ts.backend.repository-business-logic.ast',
    ]),
  'skills.backend.guideline.backend.repositories-para-datos-abstraer-acceso-a-bd-con-interfaces':
    heuristicDetector('typescript.backend.repository-business-logic', [
      'heuristics.ts.backend.repository-business-logic.ast',
    ]),
  'skills.backend.guideline.backend.anemic-domain-models-entidades-solo-con-getters-setters':
    heuristicDetector('typescript.backend.anemic-domain-model', [
      'heuristics.ts.backend.anemic-domain-model.ast',
    ]),
  'skills.backend.guideline.backend.cors-configurado-solo-ori-genes-permitidos':
    heuristicDetector('typescript.backend.permissive-cors', [
      'heuristics.ts.backend.permissive-cors.ast',
    ]),
  'skills.backend.guideline.backend.cors-configurar-ori-genes-permitidos':
    heuristicDetector('typescript.backend.permissive-cors', [
      'heuristics.ts.backend.permissive-cors.ast',
    ]),
  'skills.backend.guideline.backend.enums-para-valores-fijos-orderstatus-paymentmethod-incidenttype':
    heuristicDetector('typescript.backend.string-literal-union-enum', [
      'heuristics.ts.backend.string-literal-union-enum.ast',
    ]),
  'skills.backend.guideline.backend.password-hashing-bcrypt-con-salt-rounds-10':
    heuristicDetector('typescript.bcrypt-weak-salt-rounds', [
      'heuristics.ts.bcrypt-weak-salt-rounds.ast',
    ]),
  'skills.backend.guideline.backend.queries-parametrizadas-prevenir-sql-injection':
    heuristicDetector('typescript.sql-interpolated-unsafe-call', [
      'heuristics.ts.sql-interpolated-unsafe-call.ast',
    ]),
  'skills.backend.guideline.backend.sql-injection-prevention-queries-parametrizadas':
    heuristicDetector('typescript.sql-interpolated-unsafe-call', [
      'heuristics.ts.sql-interpolated-unsafe-call.ast',
    ]),
  'skills.frontend.no-empty-catch': heuristicDetector('typescript.empty-catch', [
    'heuristics.ts.empty-catch.ast',
  ]),
  'skills.frontend.no-console-log': heuristicDetector('typescript.console-log', [
    'heuristics.ts.console-log.ast',
  ]),
  'skills.frontend.avoid-explicit-any': heuristicDetector('typescript.explicit-any', [
    'heuristics.ts.explicit-any.ast',
  ]),
  'skills.frontend.guideline.frontend.no-any-usar-unknown-si-el-tipo-es-desconocido-luego-type-guard':
    heuristicDetector('typescript.explicit-any', ['heuristics.ts.explicit-any.ast']),
  'skills.frontend.guideline.frontend.no-catch-vaci-os-prohibido-silenciar-errores-ast-common-error-emptycat':
    heuristicDetector('typescript.empty-catch', ['heuristics.ts.empty-catch.ast']),
  'skills.frontend.guideline.frontend.tokens-en-headers-authorization-bearer-token-nunca-en-urls':
    heuristicDetector('typescript.sensitive-token-in-url', [
      'heuristics.ts.sensitive-token-in-url.ast',
    ]),
  'skills.frontend.guideline.frontend.msw-mock-service-worker-mock-apis-en-tests-no-axios-fetch-directamente':
    heuristicDetector('typescript.frontend-test-direct-network-call', [
      'heuristics.ts.frontend-test-direct-network-call.ast',
    ]),
  'skills.frontend.guideline.frontend.keyboard-navigation-todos-los-interactivos-accesibles-por-teclado':
    heuristicDetector('typescript.non-semantic-clickable', [
      'heuristics.tsx.non-semantic-clickable.ast',
    ]),
  'skills.frontend.guideline.frontend.semantic-html-button-para-botones-nav-para-navegacio-n-etc':
    heuristicDetector('typescript.non-semantic-clickable', [
      'heuristics.tsx.non-semantic-clickable.ast',
    ]),
  'skills.frontend.guideline.frontend.accesibilidad-aria-semantic-html-primero-aria-cuando-sea-necesario':
    heuristicDetector('typescript.semantic-html-aria', [
      'heuristics.tsx.non-semantic-clickable.ast',
      'heuristics.tsx.redundant-aria-role.ast',
    ]),
  'skills.frontend.guideline.frontend.preferir-early-returns-y-destructuring-evitar-if-else-anidados-callbac':
    heuristicDetector('typescript.early-returns-control-flow', [
      'heuristics.ts.callback-hell.ast',
      'heuristics.ts.nested-if-else.ast',
    ]),
  'skills.frontend.guideline.frontend.route-handlers-app-api-para-endpoints-backend':
    heuristicDetector('typescript.next-pages-api-route', [
      'heuristics.ts.next-pages-api-route.ast',
    ]),
  'skills.frontend.no-solid-violations': heuristicDetector('typescript.solid', [
    'heuristics.ts.solid.srp.class-command-query-mix.ast',
    'heuristics.ts.solid.isp.interface-command-query-mix.ast',
    'heuristics.ts.solid.ocp.discriminator-switch.ast',
    'heuristics.ts.solid.lsp.override-not-implemented.ast',
    'heuristics.ts.solid.dip.framework-import.ast',
    'heuristics.ts.solid.dip.concrete-instantiation.ast',
  ]),
  'skills.frontend.enforce-clean-architecture': heuristicDetector(
    'typescript.clean-architecture',
    [
      'heuristics.ts.solid.dip.framework-import.ast',
      'heuristics.ts.solid.dip.concrete-instantiation.ast',
    ]
  ),
  'skills.frontend.no-god-classes': heuristicDetector('typescript.god-class', [
    'heuristics.ts.god-class-large-class.ast',
  ]),
  'skills.ios.guideline.ios.verificar-que-no-viole-solid-srp-ocp-lsp-isp-dip': heuristicDetector(
    'ios.solid',
    [
      'heuristics.ios.solid.srp.presentation-mixed-responsibilities.ast',
      'heuristics.ios.solid.ocp.discriminator-switch.ast',
      'heuristics.ios.solid.dip.concrete-framework-dependency.ast',
      'heuristics.ios.solid.isp.fat-protocol-dependency.ast',
      'heuristics.ios.solid.lsp.narrowed-precondition.ast',
    ]
  ),
  'skills.ios.guideline.ios.feature-first-cada-feature-es-un-bounded-context-no-se-acoplan-entre-s':
    heuristicDetector('ios.architecture.cross-feature-import', [
      'heuristics.ios.architecture.cross-feature-import.ast',
    ]),
  'skills.ios.guideline.ios.las-features-no-se-importan-entre-si':
    heuristicDetector('ios.architecture.cross-feature-import', [
      'heuristics.ios.architecture.cross-feature-import.ast',
    ]),
  'skills.ios.guideline.ios.shared-kernel-solo-tipos-mi-nimos-compartidos-entre-features':
    heuristicDetector('ios.architecture.cross-feature-import', [
      'heuristics.ios.architecture.cross-feature-import.ast',
    ]),
  'skills.ios.guideline.ios.clean-por-feature-presentation-application-domain-infrastructure-domai':
    heuristicDetector('ios.architecture.layer-direction', [
      'heuristics.ios.architecture.layer-direction-violation.ast',
    ]),
  'skills.ios.guideline.ios.seguir-clean-architecture-domain-application-infrastructure-presentati':
    heuristicDetector('ios.architecture.layer-direction', [
      'heuristics.ios.architecture.layer-direction-violation.ast',
    ]),
  'skills.ios.guideline.ios.ddd-entidades-value-objects-repositorios-protocolos-eventos-de-dominio':
    heuristicDetector('ios.architecture.layer-direction', [
      'heuristics.ios.architecture.layer-direction-violation.ast',
    ]),
  'skills.ios.guideline.ios.public-api-solo-exponer-lo-necesario-public-internal-private':
    heuristicDetector('ios.architecture.excessive-public-api', [
      'heuristics.ios.architecture.excessive-public-api.ast',
    ]),
  'skills.ios.guideline.ios.testability-inyectar-protocols-no-tipos-concretos':
    heuristicDetector('ios.testability.protocol-boundaries', [
      'heuristics.ios.solid.dip.concrete-framework-dependency.ast',
    ]),
  'skills.ios.guideline.ios.network-layer-abstrai-do-apiclient-protocol-en-domain':
    heuristicDetector('ios.networking.protocol-boundary', [
      'heuristics.ios.solid.dip.concrete-framework-dependency.ast',
    ]),
  'skills.ios.guideline.ios.protocols-en-domain-ordersrepositoryprotocol-networkserviceprotocol':
    heuristicDetector('ios.domain.protocol-boundaries', [
      'heuristics.ios.solid.dip.concrete-framework-dependency.ast',
    ]),
  'skills.ios.guideline.ios.repository-pattern-ordersrepositoryprotocol-ordersrepository':
    heuristicDetector('ios.repository.protocol-boundary', [
      'heuristics.ios.solid.dip.concrete-framework-dependency.ast',
    ]),
  'skills.ios.guideline.ios.protocol-composition-combinar-mu-ltiples-protocols':
    heuristicDetector('ios.protocol-composition.interface-segregation', [
      'heuristics.ios.solid.isp.fat-protocol-dependency.ast',
    ]),
  'skills.android.no-thread-sleep': heuristicDetector('android.thread-sleep', [
    'heuristics.android.thread-sleep.ast',
  ]),
  'skills.android.no-globalscope': heuristicDetector('android.globalscope', [
    'heuristics.android.globalscope.ast',
  ]),
  'skills.android.no-runblocking': heuristicDetector('android.run-blocking', [
    'heuristics.android.run-blocking.ast',
  ]),
  'skills.android.guideline.android.coroutines-async-await-no-callbacks': heuristicDetector(
    'android.coroutines.baseline',
    [
      'heuristics.android.globalscope.ast',
      'heuristics.android.run-blocking.ast',
    ]
  ),
  'skills.android.guideline.android.asynctask-deprecated-usar-coroutines': heuristicDetector(
    'android.concurrency.asynctask',
    ['heuristics.android.concurrency.asynctask.ast']
  ),
  'skills.android.guideline.android.god-activities-single-activity-composables': heuristicDetector(
    'android.architecture.god-activity',
    ['heuristics.android.architecture.god-activity.ast']
  ),
  'skills.android.guideline.android.app-startup-androidx-startup-para-lazy-init': heuristicDetector(
    'android.startup.application-oncreate-heavy-init',
    ['heuristics.android.startup.application-oncreate-heavy-init.ast']
  ),
  'skills.android.guideline.android.lazycolumn-lazyrow-virtualizacio-n-de-listas': heuristicDetector(
    'android.compose.lazy-collection',
    ['heuristics.android.compose.non-lazy-scrollable-collection.ast']
  ),
  'skills.android.guideline.android.launchedeffect-keys-controlar-cua-ndo-se-relanza-effect': heuristicDetector(
    'android.compose.launched-effect-key',
    ['heuristics.android.compose.unstable-launched-effect-key.ast']
  ),
  'skills.android.guideline.android.launchedeffect-side-effects-con-lifecycle': heuristicDetector(
    'android.compose.launched-effect-lifecycle',
    ['heuristics.android.compose.launched-effect-busy-loop.ast']
  ),
  'skills.android.guideline.android.log-levels-e-error-w-warn-i-info-d-debug': heuristicDetector(
    'android.observability.production-logging',
    ['heuristics.android.observability.production-logging.ast']
  ),
  'skills.android.guideline.android.modifier-orden-importa-padding-antes-que-background': heuristicDetector(
    'android.compose.modifier-order',
    ['heuristics.android.compose.modifier-background-before-padding.ast']
  ),
  'skills.android.guideline.android.accessibility-semantics-contentdescription': heuristicDetector(
    'android.accessibility.content-description',
    ['heuristics.android.accessibility.missing-content-description.ast']
  ),
  'skills.android.guideline.android.contentdescription-para-ima-genes-y-botones': heuristicDetector(
    'android.accessibility.content-description',
    ['heuristics.android.accessibility.missing-content-description.ast']
  ),
  'skills.android.guideline.android.text-scaling-soportar-font-scaling-del-sistema': heuristicDetector(
    'android.accessibility.fontscale-disabled',
    ['heuristics.android.accessibility.fontscale-disabled.ast']
  ),
  'skills.android.guideline.android.theme-color-scheme-typography-shapes': heuristicDetector(
    'android.compose.incomplete-material-theme',
    ['heuristics.android.compose.incomplete-material-theme.ast']
  ),
  'skills.android.guideline.android.bottom-navigation-material-3-navigationbar': heuristicDetector(
    'android.compose.material3-navigationbar',
    ['heuristics.android.compose.legacy-bottom-navigation.ast']
  ),
  'skills.android.guideline.android.navigation-androidx-navigation-navigation-compose': heuristicDetector(
    'android.navigation.compose',
    ['heuristics.android.navigation.imperative-navigation.ast']
  ),
  'skills.android.guideline.android.navigation-component-jetpack-navigation-para-compose': heuristicDetector(
    'android.navigation.compose',
    ['heuristics.android.navigation.imperative-navigation.ast']
  ),
  'skills.android.guideline.android.navigation-compose-androidx-navigation-navigation-compose': heuristicDetector(
    'android.navigation.compose',
    ['heuristics.android.navigation.imperative-navigation.ast']
  ),
  'skills.android.guideline.android.remember-evitar-recrear-objetos': heuristicDetector(
    'android.compose.object-creation-without-remember',
    ['heuristics.android.compose.object-creation-without-remember.ast']
  ),
  'skills.android.guideline.android.remember-para-mantener-estado-entre-recomposiciones': heuristicDetector(
    'android.compose.state-creation-without-remember',
    ['heuristics.android.compose.state-creation-without-remember.ast']
  ),
  'skills.android.guideline.android.null-safety-no-force-unwrap-usar-let-requirenotnull': heuristicDetector(
    'android.null-safety.force-unwrap',
    ['heuristics.android.null-safety.force-unwrap.ast']
  ),
  'skills.android.guideline.android.viewmodelscope-scope-de-viewmodel-cancelado-automa-ticamente': heuristicDetector(
    'android.coroutines.viewmodel-scope',
    ['heuristics.android.coroutines.manual-scope-in-viewmodel.ast']
  ),
  'skills.android.guideline.android.dispatchers-main-ui-io-network-disk-default-cpu': heuristicDetector(
    'android.coroutines.dispatchers',
    [
      'heuristics.android.coroutines.dispatchers-main-boundary-leak.ast',
      'heuristics.android.coroutines.hardcoded-background-dispatcher.ast',
    ]
  ),
  'skills.android.guideline.android.withcontext-cambiar-dispatcher': heuristicDetector(
    'android.coroutines.with-context',
    ['heuristics.android.coroutines.with-context.ast']
  ),
  'skills.android.guideline.android.lifecyclescope-scope-de-activity-fragment': heuristicDetector(
    'android.coroutines.lifecycle-scope',
    ['heuristics.android.coroutines.lifecycle-scope-boundary-leak.ast']
  ),
  'skills.android.guideline.android.supervisorscope-errores-no-cancelan-otros-jobs': heuristicDetector(
    'android.coroutines.supervisor-scope',
    ['heuristics.android.coroutines.supervisor-scope.ast']
  ),
  'skills.android.guideline.android.try-catch-manejo-de-errores-en-coroutines': heuristicDetector(
    'android.coroutines.try-catch',
    ['heuristics.android.coroutines.try-catch.ast']
  ),
  'skills.android.guideline.android.local-properties-api-keys-no-subir-a-git': heuristicDetector(
    'android.security.local-properties',
    ['heuristics.android.security.local-properties-tracked.ast']
  ),
  'skills.android.guideline.android.datastore-androidx-datastore-datastore-preferences-reemplazo-de-shared': heuristicDetector(
    'android.persistence.shared-preferences',
    ['heuristics.android.persistence.shared-preferences-usage.ast']
  ),
  'skills.android.guideline.android.junit5-framework-de-testing-preferido-sobre-junit4': heuristicDetector(
    'android.testing.junit4-usage',
    ['heuristics.android.testing.junit4-usage.ast']
  ),
  'skills.android.guideline.android.en-produccio-n-ni-un-mocks-ni-un-spies-todo-real-de-apis-y-persistenci': heuristicDetector(
    'android.testing.production-mock-usage',
    ['heuristics.android.testing.production-mock-usage.ast']
  ),
  'skills.android.guideline.android.hardcoded-strings-usar-strings-xml': heuristicDetector(
    'android.ui.hardcoded-string',
    ['heuristics.android.ui.hardcoded-string.ast']
  ),
  'skills.android.guideline.android.stateflow-estado-mutable-observable': heuristicDetector(
    'android.flow.state-exposure',
    ['heuristics.android.flow.livedata-state-exposure.ast']
  ),
  'skills.android.guideline.android.stateflow-hot-stream-siempre-tiene-valor-para-estado': heuristicDetector(
    'android.flow.state-exposure',
    ['heuristics.android.flow.livedata-state-exposure.ast']
  ),
  'skills.android.guideline.android.stateflow-sharedflow-para-exponer-estado-del-viewmodel': heuristicDetector(
    'android.flow.state-exposure',
    ['heuristics.android.flow.livedata-state-exposure.ast']
  ),
  'skills.android.guideline.android.biometric-auth-biometricprompt-api': heuristicDetector(
    'android.security.biometric-prompt',
    ['heuristics.android.security.legacy-fingerprint-api.ast']
  ),
  'skills.android.guideline.android.no-singleton-usar-inyeccio-n-de-dependencias-hilt-dagger':
    heuristicDetector('android.architecture.custom-singleton-object', [
      'heuristics.android.architecture.custom-singleton-object.ast',
    ]),
  'skills.android.guideline.android.singletons-everywhere-usar-hilt-di': heuristicDetector(
    'android.architecture.custom-singleton-object',
    ['heuristics.android.architecture.custom-singleton-object.ast']
  ),
  'skills.android.guideline.android.statein-convertir-cold-flow-a-hot-stateflow': heuristicDetector(
    'android.flow.viewmodel-flow-without-statein',
    ['heuristics.android.flow.viewmodel-flow-without-statein.ast']
  ),
  'skills.android.guideline.android.sharedflow-hot-stream-puede-no-tener-valor-para-eventos': heuristicDetector(
    'android.flow.sharedflow-used-as-state',
    ['heuristics.android.flow.sharedflow-used-as-state.ast']
  ),
  'skills.android.no-solid-violations': heuristicDetector('android.solid', [
    'heuristics.android.solid.srp.presentation-mixed-responsibilities.ast',
    'heuristics.android.solid.ocp.discriminator-branching.ast',
    'heuristics.android.solid.dip.concrete-framework-dependency.ast',
    'heuristics.android.solid.isp.fat-interface-dependency.ast',
    'heuristics.android.solid.lsp.narrowed-precondition.ast',
  ]),
  'skills.android.guideline.android.verificar-que-no-viole-solid-srp-ocp-lsp-isp-dip':
    heuristicDetector('android.solid', [
      'heuristics.android.solid.srp.presentation-mixed-responsibilities.ast',
      'heuristics.android.solid.ocp.discriminator-branching.ast',
      'heuristics.android.solid.dip.concrete-framework-dependency.ast',
      'heuristics.android.solid.isp.fat-interface-dependency.ast',
      'heuristics.android.solid.lsp.narrowed-precondition.ast',
    ]),
};

export const listSkillsDetectorBindings = (): ReadonlyArray<{
  ruleId: string;
  binding: SkillsDetectorBinding;
}> => {
  return Object.entries(registryByRuleId)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([ruleId, binding]) => ({
      ruleId,
      binding,
    }));
};

export const resolveSkillsDetectorBinding = (
  ruleId: string
): SkillsDetectorBinding | undefined => {
  return registryByRuleId[ruleId];
};

export const resolveMappedHeuristicRuleIds = (
  ruleId: SkillsCompiledRule['id']
): ReadonlyArray<string> => {
  return registryByRuleId[ruleId]?.mappedHeuristicRuleIds ?? [];
};

export const resolveMappedHeuristicRuleIdsForCompiledRule = (
  rule: SkillsCompiledRule
): ReadonlyArray<string> => {
  const dynamicAstNodeIds = normalizeSkillsAstNodeIds(rule.astNodeIds);
  if (dynamicAstNodeIds.length > 0) {
    return dynamicAstNodeIds;
  }
  return resolveMappedHeuristicRuleIds(rule.id);
};
