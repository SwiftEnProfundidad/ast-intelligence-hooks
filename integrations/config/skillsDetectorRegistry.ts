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
  'skills.ios.guideline.ios-swiftui-expert.always-mark-state-and-stateobject-as-private-makes-dependencies-clear':
    heuristicDetector('ios.swiftui.state-wrapper-private', [
      'heuristics.ios.swiftui.state-wrapper-private.ast',
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
  'skills.ios.guideline.ios-swiftui-expert.avoid-inline-filtering-in-foreach-prefilter-and-cache':
    heuristicDetector('ios.swiftui.inline-filtering-in-foreach', [
      'heuristics.ios.swiftui.inline-filtering-in-foreach.ast',
    ]),
  'skills.ios.guideline.ios-swiftui-expert.prefer-static-member-lookup-blue-vs-color-blue':
    heuristicDetector('ios.swiftui.explicit-color-static-member', [
      'heuristics.ios.swiftui.explicit-color-static-member.ast',
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
  'skills.ios.critical-test-quality': heuristicDetector('ios.testing.critical-quality', [
    'heuristics.ios.testing.xctest-import.ast',
    'heuristics.ios.testing.xctest-suite-modernizable.ast',
    'heuristics.ios.testing.xctassert.ast',
    'heuristics.ios.testing.xctunwrap.ast',
    'heuristics.ios.testing.wait-for-expectations.ast',
    'heuristics.ios.testing.legacy-expectation-description.ast',
    'heuristics.ios.testing.mixed-frameworks.ast',
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
  'skills.ios.no-solid-violations': heuristicDetector('ios.solid', [
    'heuristics.ios.solid.srp.presentation-mixed-responsibilities.ast',
    'heuristics.ios.solid.dip.concrete-framework-dependency.ast',
    'heuristics.ios.solid.ocp.discriminator-switch.ast',
    'heuristics.ios.solid.isp.fat-protocol-dependency.ast',
    'heuristics.ios.solid.lsp.narrowed-precondition.ast',
  ]),
  'skills.ios.guideline.ios.verificar-que-no-viole-solid-srp-ocp-lsp-isp-dip':
    heuristicDetector('ios.solid', [
      'heuristics.ios.solid.srp.presentation-mixed-responsibilities.ast',
      'heuristics.ios.solid.dip.concrete-framework-dependency.ast',
      'heuristics.ios.solid.ocp.discriminator-switch.ast',
      'heuristics.ios.solid.isp.fat-protocol-dependency.ast',
      'heuristics.ios.solid.lsp.narrowed-precondition.ast',
    ]),
  'skills.android.no-solid-violations': heuristicDetector('android.solid', [
    'heuristics.android.solid.srp.presentation-mixed-responsibilities.ast',
    'heuristics.android.solid.dip.concrete-framework-dependency.ast',
    'heuristics.android.solid.ocp.discriminator-branching.ast',
    'heuristics.android.solid.isp.fat-interface-dependency.ast',
    'heuristics.android.solid.lsp.narrowed-precondition.ast',
  ]),
  'skills.android.enforce-clean-architecture': heuristicDetector('android.clean-architecture', [
    'heuristics.android.solid.srp.presentation-mixed-responsibilities.ast',
    'heuristics.android.solid.dip.concrete-framework-dependency.ast',
    'heuristics.android.solid.ocp.discriminator-branching.ast',
    'heuristics.android.solid.isp.fat-interface-dependency.ast',
    'heuristics.android.solid.lsp.narrowed-precondition.ast',
  ]),
  'skills.backend.no-empty-catch': heuristicDetector('typescript.empty-catch', [
    'heuristics.ts.empty-catch.ast',
  ]),
  'skills.backend.no-console-log': heuristicDetector('typescript.console-log', [
    'heuristics.ts.console-log.ast',
  ]),
  'skills.backend.no-loggear-datos-sensibles-passwords-tokens-pii': heuristicDetector(
    'typescript.sensitive-log',
    ['heuristics.ts.no-sensitive-log.ast']
  ),
  'skills.backend.password-hashing-bcrypt-con-salt-rounds-10': heuristicDetector(
    'typescript.password-hashing',
    ['heuristics.ts.password-hashing-bcrypt-salt-rounds-10.ast']
  ),
  'skills.backend.guideline.backend.rate-limiting-nestjs-throttler-para-prevenir-brute-force':
    heuristicDetector('typescript.rate-limiting-throttler', [
      'heuristics.ts.rate-limiting-throttler.ast',
    ]),
  'skills.backend.guideline.backend.rate-limiting-throttler-para-prevenir-abuse':
    heuristicDetector('typescript.rate-limiting-throttler', [
      'heuristics.ts.rate-limiting-throttler.ast',
    ]),
  'skills.backend.guideline.backend.cors-configurado-solo-ori-genes-permitidos': heuristicDetector(
    'typescript.cors-configured',
    ['heuristics.ts.cors-configured.ast']
  ),
  'skills.backend.guideline.backend.cors-configurar-ori-genes-permitidos': heuristicDetector(
    'typescript.cors-configured',
    ['heuristics.ts.cors-configured.ast']
  ),
  'skills.backend.guideline.backend.pipes-para-validacio-n-global-validationpipe-en-main-ts':
    heuristicDetector('typescript.validationpipe-global', [
      'heuristics.ts.validationpipe-global.ast',
    ]),
  'skills.backend.guideline.backend.validationpipe-global-en-main-ts-con-whitelist-true':
    heuristicDetector('typescript.validationpipe-global', [
      'heuristics.ts.validationpipe-global.ast',
    ]),
  'skills.backend.guideline.backend.versionado-api-v1-api-v2':
    heuristicDetector('typescript.versionado-api-v1-api-v2', [
      'heuristics.ts.versionado-api-v1-api-v2.ast',
    ]),
  'skills.backend.guideline.backend.validation-de-config-joi-o-class-validator-para-env':
    heuristicDetector('typescript.validation-config', ['heuristics.ts.validation-config.ast']),
  'skills.backend.guideline.backend.class-validator-decorators-isstring-isemail-min-max':
    heuristicDetector('typescript.class-validator-decorators', [
      'heuristics.ts.class-validator-decorators.ast',
    ]),
  'skills.backend.guideline.backend.class-transformer-transform-exclude-expose':
    heuristicDetector('typescript.class-transformer-decorators', [
      'heuristics.ts.class-transformer-decorators.ast',
    ]),
  'skills.backend.guideline.backend.input-validation-siempre-validar-con-dtos':
    heuristicDetector('typescript.input-validation-siempre-validar-con-dtos', [
      'heuristics.ts.input-validation-siempre-validar-con-dtos.ast',
    ]),
  'skills.backend.guideline.backend.nested-validation-validatenested-type':
    heuristicDetector('typescript.nested-validation-validatenested-type', [
      'heuristics.ts.nested-validation-validatenested-type.ast',
    ]),
  'skills.backend.guideline.backend.dtos-en-boundaries-validacio-n-en-entrada-salida':
    heuristicDetector('typescript.dto-boundaries', [
      'heuristics.ts.dtos-en-boundaries-validacio-n-en-entrada-salida.ast',
    ]),
  'skills.backend.guideline.backend.dtos-separados-createorderdto-updateorderdto-orderresponsedto':
    heuristicDetector('typescript.dto-separated-contracts', [
      'heuristics.ts.dtos-separados-createorderdto-updateorderdto-orderresponsedto.ast',
    ]),
  'skills.backend.guideline.backend.retornar-dtos-no-exponer-entidades-directamente':
    heuristicDetector('typescript.return-dtos', [
      'heuristics.ts.return-dtos-no-exponer-entidades-directamente.ast',
    ]),
  'skills.backend.guideline.backend.transacciones-para-operaciones-cri-ticas':
    heuristicDetector('typescript.transactions', [
      'heuristics.ts.transacciones-para-operaciones-cri-ticas.ast',
    ]),
  'skills.backend.guideline.backend.transacciones-para-operaciones-multi-tabla':
    heuristicDetector('typescript.transactions', [
      'heuristics.ts.transacciones-para-operaciones-multi-tabla.ast',
    ]),
  'skills.backend.guideline.backend.winston-logger-estructurado-json-logs': heuristicDetector(
    'typescript.winston-structured-json-logger',
    ['heuristics.ts.winston-structured-json-logger.ast']
  ),
  'skills.backend.guideline.backend.loggear-errores-con-contexto-completo': heuristicDetector(
    'typescript.error-logging-full-context',
    ['heuristics.ts.error-logging-full-context.ast']
  ),
  'skills.backend.guideline.backend.correlation-ids-para-tracing-distribuido': heuristicDetector(
    'typescript.correlation-ids',
    ['heuristics.ts.correlation-ids.ast']
  ),
  'skills.backend.guideline.backend.me-tricas-prometheus-prom-client-para-me-tricas':
    heuristicDetector('typescript.prometheus-metrics', ['heuristics.ts.prometheus-prom-client.ast']),
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
    ['heuristics.ts.clean-architecture.ast']
  ),
  'skills.backend.mocks-en-produccio-n-solo-datos-reales': heuristicDetector(
    'typescript.production-mock',
    ['heuristics.ts.production-mock.ast']
  ),
  'skills.backend.exception-filters-catch-para-manejo-global': heuristicDetector(
    'typescript.exception-filter',
    ['heuristics.ts.exception-filter.ast']
  ),
  'skills.backend.guards-para-autenticacio-n-autorizacio-n-useguards-jwtauthguard': heuristicDetector(
    'typescript.guard',
    ['heuristics.ts.guards-useguards-jwtauthguard.ast']
  ),
  'skills.backend.interceptors-para-logging-transformacio-n-no-en-cada-endpoint': heuristicDetector(
    'typescript.interceptor',
    ['heuristics.ts.interceptors-useinterceptors-logging-transform.ast']
  ),
  'skills.backend.no-singleton': heuristicDetector('typescript.singleton', [
    'heuristics.ts.singleton-pattern.ast',
  ]),
  'skills.backend.magic-numbers-usar-constantes-con-nombres-descriptivos': heuristicDetector(
    'typescript.magic-numbers',
    ['heuristics.ts.magic-numbers.ast']
  ),
  'skills.backend.hardcoded-values-config-en-variables-de-entorno': heuristicDetector(
    'typescript.hardcoded-values',
    ['heuristics.ts.hardcoded-values.ast']
  ),
  'skills.backend.no-defaults-en-produccio-n-fallar-si-falta-config-cri-tica': heuristicDetector(
    'typescript.env-default-fallback',
    ['heuristics.ts.env-default-fallback.ast']
  ),
  'skills.backend.callback-hell-usar-async-await': heuristicDetector('typescript.callback-hell', [
    'heuristics.ts.callback-hell.ast',
  ]),
  'skills.backend.no-god-classes': heuristicDetector('typescript.god-class', [
    'heuristics.ts.god-class-large-class.ast',
  ]),
  'skills.backend.guideline.backend.callback-hell-usar-async-await': heuristicDetector(
    'typescript.new-promise-async',
    ['heuristics.ts.new-promise-async.ast']
  ),
  'skills.backend.guideline.backend.try-catch-silenciosos-siempre-loggear-o-propagar':
    heuristicDetector('typescript.empty-catch', ['heuristics.ts.empty-catch.ast']),
  'skills.backend.guideline.backend.hardcoded-values-config-en-variables-de-entorno':
    heuristicDetector('typescript.hardcoded-secret-token', [
      'heuristics.ts.hardcoded-secret-token.ast',
    ]),
  'skills.backend.guideline.backend.magic-numbers-usar-constantes-con-nombres-descriptivos':
    heuristicDetector('typescript.magic-number', ['heuristics.ts.magic-number.ast']),
  'skills.backend.guideline.backend.mocks-en-produccion-usar-fakes-spies-de-test':
    heuristicDetector('typescript.production-mock-artifact', [
      'heuristics.ts.production-mock-artifact.ast',
    ]),
  'skills.backend.guideline.backend.anemic-domain-models-entidades-con-comportamiento':
    heuristicDetector('typescript.anemic-domain-model', [
      'heuristics.ts.anemic-domain-model.ast',
    ]),
  'skills.backend.guideline.backend.logica-en-controllers-mover-logica-de-negocio-a-casos-de-uso-servicios':
    heuristicDetector('typescript.controller-business-logic', [
      'heuristics.ts.controller-business-logic.ast',
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
    ['heuristics.ts.clean-architecture.ast']
  ),
  'skills.frontend.no-singleton': heuristicDetector('typescript.singleton', [
    'heuristics.ts.singleton-pattern.ast',
  ]),
  'skills.frontend.callback-hell-usar-async-await': heuristicDetector('typescript.callback-hell', [
    'heuristics.ts.callback-hell.ast',
  ]),
  'skills.frontend.no-class-components': heuristicDetector('typescript.react-class-component', [
    'heuristics.ts.react-class-component.ast',
  ]),
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
    'android.coroutines-async-await-no-callbacks',
    ['heuristics.android.coroutines-async-await-no-callbacks.ast']
  ),
  'skills.android.guideline.android.async-await-paralelismo': heuristicDetector(
    'android.async-await-paralelismo',
    ['heuristics.android.async-await-paralelismo.ast']
  ),
  'skills.android.guideline.android.supervisorscope-errores-no-cancelan-otros-jobs': heuristicDetector(
    'android.supervisorscope-errores-no-cancelan-otros-jobs',
    ['heuristics.android.supervisorscope-errores-no-cancelan-otros-jobs.ast']
  ),
  'skills.android.guideline.android.suspend-functions-en-api-service': heuristicDetector(
    'android.suspend-functions-en-api-service',
    ['heuristics.android.suspend-functions-en-api-service.ast']
  ),
  'skills.android.guideline.android.suspend-functions-para-operaciones-async': heuristicDetector(
    'android.suspend-functions-para-operaciones-async',
    ['heuristics.android.suspend-functions-para-operaciones-async.ast']
  ),
  'skills.android.guideline.android.dao-data-access-objects-con-suspend-functions': heuristicDetector(
    'android.dao-data-access-objects-con-suspend-functions',
    ['heuristics.android.dao-data-access-objects-con-suspend-functions.ast']
  ),
  'skills.android.guideline.android.transaction-para-operaciones-multi-query': heuristicDetector(
    'android.transaction-para-operaciones-multi-query',
    ['heuristics.android.transaction-para-operaciones-multi-query.ast']
  ),
  'skills.android.guideline.android.stateflow-estado-mutable-observable': heuristicDetector(
    'android.stateflow-estado-mutable-observable',
    ['heuristics.android.stateflow-estado-mutable-observable.ast']
  ),
  'skills.android.guideline.android.sharedflow-hot-stream-puede-no-tener-valor-para-eventos':
    heuristicDetector('android.sharedflow-hot-stream-puede-no-tener-valor-para-eventos', [
      'heuristics.android.sharedflow-hot-stream-puede-no-tener-valor-para-eventos.ast',
    ]),
  'skills.android.guideline.android.flow-builders-flow-emit-flowof-asflow': heuristicDetector(
    'android.flow-builders-flow-emit-flowof-asflow',
    ['heuristics.android.flow-builders-flow-emit-flowof-asflow.ast']
  ),
  'skills.android.guideline.android.collect-terminal-operator-para-consumir-flow':
    heuristicDetector('android.collect-terminal-operator-para-consumir-flow', [
      'heuristics.android.collect-terminal-operator-para-consumir-flow.ast',
    ]),
  'skills.android.guideline.android.collect-as-state-consumir-flow-en-compose':
    heuristicDetector('android.collect-as-state-consumir-flow-en-compose', [
      'heuristics.android.collect-as-state-consumir-flow-en-compose.ast',
    ]),
  'skills.android.guideline.android.remember-evitar-recrear-objetos': heuristicDetector(
    'android.remember-evitar-recrear-objetos',
    ['heuristics.android.remember-evitar-recrear-objetos.ast']
  ),
  'skills.android.guideline.android.remember-para-mantener-estado-entre-recomposiciones':
    heuristicDetector('android.remember-para-mantener-estado-entre-recomposiciones', [
      'heuristics.android.remember-para-mantener-estado-entre-recomposiciones.ast',
    ]),
  'skills.android.guideline.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input':
    heuristicDetector('android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input', [
      'heuristics.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input.ast',
    ]),
  'skills.android.guideline.android.derivedstateof-ca-lculos-derivados-de-state': heuristicDetector(
    'android.derivedstateof-ca-lculos-derivados-de-state',
    ['heuristics.android.derivedstateof-ca-lculos-derivados-de-state.ast']
  ),
  'skills.android.guideline.android.launchedeffect-side-effects-con-lifecycle': heuristicDetector(
    'android.launchedeffect-side-effects-con-lifecycle',
    ['heuristics.android.launchedeffect-side-effects-con-lifecycle.ast']
  ),
  'skills.android.guideline.android.launchedeffect-keys-controlar-cuando-se-relanza-effect':
    heuristicDetector('android.launchedeffect-keys-controlar-cuando-se-relanza-effect', [
      'heuristics.android.launchedeffect-keys-controlar-cuando-se-relanza-effect.ast',
    ]),
  'skills.android.guideline.android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n':
    heuristicDetector('android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n', [
      'heuristics.android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n.ast',
    ]),
  'skills.android.guideline.android.preview-preview-para-ver-ui-sin-correr-app': heuristicDetector(
    'android.preview-preview-para-ver-ui-sin-correr-app',
    ['heuristics.android.preview-preview-para-ver-ui-sin-correr-app.ast']
  ),
  'skills.android.guideline.android.recomposition-composables-deben-ser-idempotentes':
    heuristicDetector('android.recomposition-composables-deben-ser-idempotentes', [
      'heuristics.android.recomposition-composables-deben-ser-idempotentes.ast',
    ]),
  'skills.android.guideline.android.uistate-sealed-class-loading-success-error-states':
    heuristicDetector('android.uistate-sealed-class-loading-success-error-states', [
      'heuristics.android.uistate-sealed-class-loading-success-error-states.ast',
    ]),
  'skills.android.guideline.android.use-cases-lo-gica-de-negocio-encapsulada': heuristicDetector(
    'android.use-cases-lo-gica-de-negocio-encapsulada',
    ['heuristics.android.use-cases-lo-gica-de-negocio-encapsulada.ast']
  ),
  'skills.android.guideline.android.repository-pattern-abstraer-acceso-a-datos': heuristicDetector(
    'android.repository-pattern-abstraer-acceso-a-datos',
    ['heuristics.android.repository-pattern-abstraer-acceso-a-datos.ast']
  ),
  'skills.android.guideline.android.repository-pattern-ordersrep': heuristicDetector(
    'android.repository-pattern-abstraer-acceso-a-datos',
    ['heuristics.android.repository-pattern-abstraer-acceso-a-datos.ast']
  ),
  'skills.android.guideline.android.app-startup-androidx-startup-para-lazy-init': heuristicDetector(
    'android.app-startup-androidx-startup-para-lazy-init',
    ['heuristics.android.app-startup-androidx-startup-para-lazy-init.ast']
  ),
  'skills.android.guideline.android.baseline-profiles-optimizacio-n-de-startup': heuristicDetector(
    'android.baseline-profiles-optimizacio-n-de-startup',
    ['heuristics.android.baseline-profiles-optimizacio-n-de-startup.ast']
  ),
  'skills.android.guideline.android.state-hoisting-elevar-estado-al-nivel-apropiado':
    heuristicDetector('android.state-hoisting', [
      'heuristics.android.state-hoisting-elevar-estado-al-nivel-apropiado.ast',
    ]),
  'skills.android.no-force-unwrap': heuristicDetector('android.force-unwrap', [
    'heuristics.android.force-unwrap.ast',
  ]),
  'skills.android.no-java-new-code': heuristicDetector('android.java-source', [
    'heuristics.android.java-source.ast',
  ]),
  'skills.android.asynctask-deprecated-usar-coroutines': heuristicDetector('android.asynctask', [
    'heuristics.android.asynctask-deprecated.ast',
  ]),
  'skills.android.findviewbyid-view-binding-o-compose': heuristicDetector('android.findviewbyid', [
    'heuristics.android.findviewbyid.ast',
  ]),
  'skills.android.rxjava-new-code': heuristicDetector('android.rxjava-new-code', [
    'heuristics.android.rxjava-new-code.ast',
  ]),
  'skills.android.dispatchers-main-ui-io-network-disk-default-cpu': heuristicDetector(
    'android.dispatchers-main-ui-io-network-disk-default-cpu',
    ['heuristics.android.dispatchers-main-ui-io-network-disk-default-cpu.ast']
  ),
  'skills.android.withcontext-change-dispatcher': heuristicDetector('android.withcontext-change-dispatcher', [
    'heuristics.android.withcontext-change-dispatcher.ast',
  ]),
  'skills.android.no-console-log': heuristicDetector('android.no-console-log', [
    'heuristics.android.no-console-log.ast',
  ]),
  'skills.android.guideline.android.analytics-firebase-analytics-o-custom': heuristicDetector(
    'android.analytics-firebase-analytics-o-custom',
    ['heuristics.android.analytics-firebase-analytics-o-custom.ast']
  ),
  'skills.android.guideline.android.android-profiler-cpu-memory-network-profiling': heuristicDetector(
    'android.android-profiler-cpu-memory-network-profiling',
    ['heuristics.android.android-profiler-cpu-memory-network-profiling.ast']
  ),
  'skills.android.guideline.android.timber-logging-library': heuristicDetector(
    'android.timber-logging-library',
    ['heuristics.android.timber-logging-library.ast']
  ),
  'skills.android.guideline.android.touch-targets-mi-nimo-48dp': heuristicDetector(
    'android.touch-targets-mi-nimo-48dp',
    ['heuristics.android.touch-targets-mi-nimo-48dp.ast']
  ),
  'skills.android.guideline.android.buildconfig-constantes-en-tiempo-de-compilacio-n': heuristicDetector(
    'android.buildconfig-constantes-en-tiempo-de-compilacio-n',
    ['heuristics.android.buildconfig-constantes-en-tiempo-de-compilacio-n.ast']
  ),
  'skills.android.hardcoded-strings-usar-strings-xml': heuristicDetector('android.hardcoded-strings', [
    'heuristics.android.hardcoded-strings.ast',
  ]),
  'skills.android.guideline.android.localization-strings-xml-por-idioma-values-es-values-en': heuristicDetector(
    'android.localization-strings-xml-por-idioma-values-es-values-en',
    ['heuristics.android.localization-strings-xml-por-idioma-values-es-values-en.ast']
  ),
  'skills.android.guideline.android.plurals-values-plurals-xml': heuristicDetector(
    'android.plurals-values-plurals-xml',
    ['heuristics.android.plurals-values-plurals-xml.ast']
  ),
  'skills.android.no-singleton-usar-inyeccio-n-de-dependencias-hilt-dagger': heuristicDetector(
    'android.no-singleton',
    ['heuristics.android.no-singleton.ast']
  ),
  'skills.android.guideline.android.hilt-com-google-dagger-hilt-android': heuristicDetector(
    'android.hilt-dependency',
    ['heuristics.android.hilt-com-google-dagger-hilt-android.ast']
  ),
  'skills.android.guideline.android.hilt-di-framework-no-manual-factories': heuristicDetector(
    'android.hilt-framework',
    ['heuristics.android.hilt-di-framework-no-manual-factories.ast']
  ),
  'skills.android.guideline.android.hiltandroidapp-application-class': heuristicDetector(
    'android.hiltandroidapp',
    ['heuristics.android.hiltandroidapp-application-class.ast']
  ),
  'skills.android.guideline.android.androidentrypoint-activity-fragment-viewmodel': heuristicDetector(
    'android.androidentrypoint',
    ['heuristics.android.androidentrypoint-activity-fragment-viewmodel.ast']
  ),
  'skills.android.guideline.android.viewmodel-androidx-lifecycle-viewmodel': heuristicDetector(
    'android.viewmodel',
    ['heuristics.android.viewmodel-androidx-lifecycle-viewmodel.ast']
  ),
  'skills.android.guideline.android.viewmodel-sobrevive-configuration-changes': heuristicDetector(
    'android.viewmodel',
    ['heuristics.android.viewmodel-sobrevive-configuration-changes.ast']
  ),
  'skills.android.guideline.android.single-source-of-truth-viewmodel-es-la-fuente':
    heuristicDetector('android.single-source-of-truth-viewmodel-es-la-fuente', [
      'heuristics.android.single-source-of-truth-viewmodel-es-la-fuente.ast',
    ]),
  'skills.android.guideline.android.skip-recomposition-para-metros-inmutables-o-estables':
    heuristicDetector('android.skip-recomposition-para-metros-inmutables-o-estables', [
      'heuristics.android.skip-recomposition-para-metros-inmutables-o-estables.ast',
    ]),
  'skills.android.guideline.android.stability-composables-estables-recomponen-menos':
    heuristicDetector('android.stability-composables-estables-recomponen-menos', [
      'heuristics.android.stability-composables-estables-recomponen-menos.ast',
    ]),
  'skills.android.guideline.android.string-formatting-1-s-2-d-para-argumentos':
    heuristicDetector('android.string-formatting-1-s-2-d-para-argumentos', [
      'heuristics.android.string-formatting-1-s-2-d-para-argumentos.ast',
    ]),
  'skills.android.guideline.android.inject-constructor-constructor-injection': heuristicDetector(
    'android.inject-constructor',
    ['heuristics.android.inject-constructor-constructor-injection.ast']
  ),
  'skills.android.guideline.android.module-installin-provide-dependencies': heuristicDetector(
    'android.module-installin',
    ['heuristics.android.module-installin-provide-dependencies.ast']
  ),
  'skills.android.guideline.android.binds-para-implementaciones-de-interfaces-ma-s-eficiente':
    heuristicDetector('android.binds-para-implementaciones-de-interfaces-ma-s-eficiente', [
      'heuristics.android.binds-para-implementaciones-de-interfaces-ma-s-eficiente.ast',
    ]),
  'skills.android.guideline.android.provides-para-interfaces-o-third-party': heuristicDetector(
    'android.provides-para-interfaces-o-third-party',
    ['heuristics.android.provides-para-interfaces-o-third-party.ast']
  ),
  'skills.android.guideline.android.workmanager-androidx-work-work-runtime-ktx': heuristicDetector(
    'android.workmanager-androidx-work-work-runtime-ktx',
    ['heuristics.android.workmanager-androidx-work-work-runtime-ktx.ast']
  ),
  'skills.android.guideline.android.version-catalogs-libs-versions-toml-para-dependencias':
    heuristicDetector('android.version-catalogs-libs-versions-toml', [
      'heuristics.android.version-catalogs-libs-versions-toml-para-dependencias.ast',
    ]),
  'skills.android.guideline.android.workmanager-background-tasks': heuristicDetector(
    'android.workmanager-background-tasks',
    ['heuristics.android.workmanager-background-tasks.ast']
  ),
  'skills.android.guideline.android.androidtest-instrumented-tests-device-emulator': heuristicDetector(
    'android.androidtest-instrumented-tests-device-emulator',
    ['heuristics.android.androidtest-instrumented-tests-device-emulator.ast']
  ),
  'skills.android.guideline.android.aaa-pattern-arrange-act-assert': heuristicDetector(
    'android.aaa-pattern-arrange-act-assert',
    ['heuristics.android.aaa-pattern-arrange-act-assert.ast']
  ),
  'skills.android.guideline.android.given-when-then-bdd-style': heuristicDetector(
    'android.given-when-then-bdd-style',
    ['heuristics.android.given-when-then-bdd-style.ast']
  ),
  'skills.android.guideline.android.test-unit-tests-jvm': heuristicDetector(
    'android.test-unit-tests-jvm',
    ['heuristics.android.test-unit-tests-jvm.ast']
  ),
  'skills.android.guideline.android.viewmodelscope-scope-de-viewmodel-cancelado-automa-ticamente': heuristicDetector(
    'android.viewmodelscope',
    ['heuristics.android.viewmodelscope-scope-de-viewmodel-cancelado-automa-ticamente.ast']
  ),
  'skills.android.guideline.android.viewmodelscoped-para-dependencias-de-viewmodel': heuristicDetector(
    'android.viewmodelscoped',
    ['heuristics.android.viewmodelscoped-para-dependencias-de-viewmodel.ast']
  ),
  'skills.android.guideline.android.composable-functions-composable-para-ui': heuristicDetector(
    'android.composable-functions',
    ['heuristics.android.composable-functions-composable-para-ui.ast']
  ),
  'skills.android.guideline.android.arguments-pasar-datos-entre-pantallas': heuristicDetector(
    'android.arguments-pasar-datos-entre-pantallas',
    ['heuristics.android.arguments-pasar-datos-entre-pantallas.ast']
  ),
  'skills.android.guideline.android.adaptive-layouts-responsive-design-windowsizeclass': heuristicDetector(
    'android.adaptive-layouts-responsive-design-windowsizeclass',
    ['heuristics.android.adaptive-layouts-responsive-design-windowsizeclass.ast']
  ),
  'skills.android.guideline.android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle': heuristicDetector(
    'android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle',
    ['heuristics.android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle.ast']
  ),
  'skills.android.guideline.android.theme-color-scheme-typography-shapes': heuristicDetector(
    'android.theme-color-scheme-typography-shapes',
    ['heuristics.android.theme-color-scheme-typography-shapes.ast']
  ),
  'skills.android.guideline.android.dark-theme-soportar-desde-di-a-1-issystemindarktheme': heuristicDetector(
    'android.dark-theme-soportar-desde-di-a-1-issystemindarktheme',
    ['heuristics.android.dark-theme-soportar-desde-di-a-1-issystemindarktheme.ast']
  ),
  'skills.android.guideline.android.text-scaling-soportar-font-scaling-del-sistema': heuristicDetector(
    'android.text-scaling-soportar-font-scaling-del-sistema',
    ['heuristics.android.text-scaling-soportar-font-scaling-del-sistema.ast']
  ),
  'skills.android.guideline.android.accessibility-semantics-contentdescription': heuristicDetector(
    'android.accessibility-semantics-contentdescription',
    ['heuristics.android.accessibility-semantics-contentdescription.ast']
  ),
  'skills.android.guideline.android.contentdescription-para-ima-genes-y-botones': heuristicDetector(
    'android.contentdescription-para-ima-genes-y-botones',
    ['heuristics.android.contentdescription-para-ima-genes-y-botones.ast']
  ),
  'skills.android.guideline.android.talkback-screen-reader-de-android': heuristicDetector(
    'android.talkback-screen-reader-de-android',
    ['heuristics.android.talkback-screen-reader-de-android.ast']
  ),
  'skills.android.guideline.android.god-activities-single-activity-composables': heuristicDetector(
    'android.god-activities',
    ['heuristics.android.god-activities-single-activity-composables.ast']
  ),
  'skills.android.guideline.android.single-activity-mu-ltiples-composables-fragments-no-activities':
    heuristicDetector('android.single-activity', [
      'heuristics.android.single-activity-multiples-composables-fragments-no-activities.ast',
    ]),
  'skills.android.try-catch-manejo-de-errores-en-coroutines': heuristicDetector(
    'android.try-catch-manejo-de-errores-en-coroutines',
    ['heuristics.android.try-catch-manejo-de-errores-en-coroutines.ast']
  ),
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
