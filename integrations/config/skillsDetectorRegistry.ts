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
  'skills.ios.no-force-cast': heuristicDetector('ios.force-cast', [
    'heuristics.ios.force-cast.ast',
  ]),
  'skills.ios.no-callback-style-outside-bridges': heuristicDetector(
    'ios.callback-style',
    ['heuristics.ios.callback-style.ast']
  ),
  'skills.ios.no-dispatchqueue': heuristicDetector('ios.dispatchqueue', [
    'heuristics.ios.dispatchqueue.ast',
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
  'skills.ios.guideline.ios.implicitly-unwrapped-solo-para-iboutlets-y-casos-muy-especi-ficos': heuristicDetector(
    'ios.safety.non-iboutlet-iuo',
    ['heuristics.ios.safety.non-iboutlet-iuo.ast']
  ),
  'skills.ios.guideline.ios.singletons-dificultan-testing': heuristicDetector(
    'ios.architecture.custom-singleton',
    ['heuristics.ios.architecture.custom-singleton.ast']
  ),
  'skills.ios.guideline.ios.prohibido-print-y-logs-ad-hoc': heuristicDetector(
    'ios.logging.adhoc-print',
    ['heuristics.ios.logging.adhoc-print.ast']
  ),
  'skills.ios.guideline.ios.no-loggear-pii-tokens-emails-ids-sensibles': heuristicDetector(
    'ios.logging.sensitive-data',
    ['heuristics.ios.logging.sensitive-data.ast']
  ),
  'skills.ios.guideline.ios.alamofire-prohibido-usar-urlsession-nativo': heuristicDetector(
    'ios.networking.alamofire',
    ['heuristics.ios.networking.alamofire.ast']
  ),
  'skills.ios.guideline.ios.codable-decodificacio-n-automa-tica-de-json-nunca-jsonserialization': heuristicDetector(
    'ios.json.jsonserialization',
    ['heuristics.ios.json.jsonserialization.ast']
  ),
  'skills.ios.guideline.ios.codable-para-serializacio-n-json-nunca-jsonserialization': heuristicDetector(
    'ios.json.jsonserialization',
    ['heuristics.ios.json.jsonserialization.ast']
  ),
  'skills.ios.guideline.ios.cocoapods-prohibido': heuristicDetector(
    'ios.dependencies.cocoapods',
    ['heuristics.ios.dependencies.cocoapods.ast']
  ),
  'skills.ios.guideline.ios.carthage-prohibido': heuristicDetector(
    'ios.dependencies.carthage',
    ['heuristics.ios.dependencies.carthage.ast']
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
  'skills.ios.guideline.ios.localizable-strings-deprecado-usar-string-catalogs': heuristicDetector(
    'ios.localization.localizable-strings',
    ['heuristics.ios.localization.localizable-strings.ast']
  ),
  'skills.ios.guideline.ios.string-catalogs-xcstrings': heuristicDetector(
    'ios.localization.localizable-strings',
    ['heuristics.ios.localization.localizable-strings.ast']
  ),
  'skills.ios.guideline.ios.string-catalogs-xcstrings-sistema-moderno-de-localizacio-n-xcode-15': heuristicDetector(
    'ios.localization.localizable-strings',
    ['heuristics.ios.localization.localizable-strings.ast']
  ),
  'skills.ios.guideline.ios.cero-strings-hardcodeadas-en-ui': heuristicDetector(
    'ios.localization.hardcoded-ui-string',
    ['heuristics.ios.localization.hardcoded-ui-string.ast']
  ),
  'skills.ios.guideline.ios.string-localized-api-moderna-para-strings-traducibles': heuristicDetector(
    'ios.localization.hardcoded-ui-string',
    ['heuristics.ios.localization.hardcoded-ui-string.ast']
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
  'skills.ios.guideline.ios.accessibility-labels-accessibilitylabel': heuristicDetector(
    'ios.accessibility.icon-only-control-label',
    ['heuristics.ios.accessibility.icon-only-control-label.ast']
  ),
  'skills.ios.no-unchecked-sendable': heuristicDetector('ios.unchecked-sendable', [
    'heuristics.ios.unchecked-sendable.ast',
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
  'skills.ios.no-observable-object': heuristicDetector('ios.observable-object', [
    'heuristics.ios.observable-object.ast',
  ]),
  'skills.ios.no-legacy-swiftui-observable-wrapper': heuristicDetector(
    'ios.legacy-swiftui-observable-wrapper',
    ['heuristics.ios.legacy-swiftui-observable-wrapper.ast']
  ),
  'skills.ios.no-passed-value-state-wrapper': heuristicDetector('ios.passed-value-state-wrapper', [
    'heuristics.ios.passed-value-state-wrapper.ast',
  ]),
  'skills.ios.no-navigation-view': heuristicDetector('ios.navigation-view', [
    'heuristics.ios.navigation-view.ast',
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
  'skills.ios.no-contains-user-filter': heuristicDetector('ios.contains-user-filter', [
    'heuristics.ios.contains-user-filter.ast',
  ]),
  'skills.ios.no-geometryreader': heuristicDetector('ios.geometryreader', [
    'heuristics.ios.geometryreader.ast',
  ]),
  'skills.ios.no-font-weight-bold': heuristicDetector('ios.font-weight-bold', [
    'heuristics.ios.font-weight-bold.ast',
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
  'skills.ios.no-uiscreen-main-bounds': heuristicDetector('ios.uiscreen-main-bounds', [
    'heuristics.ios.uiscreen-main-bounds.ast',
  ]),
  'skills.ios.prefer-swift-testing': heuristicDetector('ios.testing.xctest-import', [
    'heuristics.ios.testing.xctest-import.ast',
    'heuristics.ios.testing.xctest-suite-modernizable.ast',
  ]),
  'skills.ios.no-xctassert': heuristicDetector('ios.testing.xctassert', [
    'heuristics.ios.testing.xctassert.ast',
  ]),
  'skills.ios.no-xctunwrap': heuristicDetector('ios.testing.xctunwrap', [
    'heuristics.ios.testing.xctunwrap.ast',
  ]),
  'skills.ios.no-wait-for-expectations': heuristicDetector('ios.testing.wait-for-expectations', [
    'heuristics.ios.testing.wait-for-expectations.ast',
  ]),
  'skills.ios.no-legacy-expectation-description': heuristicDetector(
    'ios.testing.legacy-expectation-description',
    ['heuristics.ios.testing.legacy-expectation-description.ast']
  ),
  'skills.ios.no-mixed-testing-frameworks': heuristicDetector('ios.testing.mixed-frameworks', [
    'heuristics.ios.testing.mixed-frameworks.ast',
  ]),
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
  'skills.ios.no-swiftdata-layer-leak': heuristicDetector('ios.swiftdata.layer-leak', [
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
  'skills.frontend.no-empty-catch': heuristicDetector('typescript.empty-catch', [
    'heuristics.ts.empty-catch.ast',
  ]),
  'skills.frontend.no-console-log': heuristicDetector('typescript.console-log', [
    'heuristics.ts.console-log.ast',
  ]),
  'skills.frontend.avoid-explicit-any': heuristicDetector('typescript.explicit-any', [
    'heuristics.ts.explicit-any.ast',
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
  'skills.android.no-solid-violations': heuristicDetector('android.solid', [
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
