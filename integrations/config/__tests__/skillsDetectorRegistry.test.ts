import assert from 'node:assert/strict';
import test from 'node:test';
import {
  listSkillsDetectorBindings,
  resolveMappedHeuristicRuleIds,
  resolveSkillsDetectorBinding,
} from '../skillsDetectorRegistry';

test('resuelve detectores heuristics para reglas canonicales backend/frontend/ios/android', () => {
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.backend.no-console-log'), [
    'heuristics.ts.console-log.ast',
  ]);
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.backend.no-loggear-datos-sensibles-passwords-tokens-pii'),
    ['heuristics.ts.no-sensitive-log.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.backend.password-hashing-bcrypt-con-salt-rounds-10'),
    ['heuristics.ts.password-hashing-bcrypt-salt-rounds-10.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.backend.guideline.backend.rate-limiting-nestjs-throttler-para-prevenir-brute-force'
    ),
    ['heuristics.ts.rate-limiting-throttler.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.backend.guideline.backend.rate-limiting-throttler-para-prevenir-abuse'),
    ['heuristics.ts.rate-limiting-throttler.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.backend.guideline.backend.winston-logger-estructurado-json-logs'),
    ['heuristics.ts.winston-structured-json-logger.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.backend.guideline.backend.loggear-errores-con-contexto-completo'),
    ['heuristics.ts.error-logging-full-context.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.backend.guideline.backend.me-tricas-prometheus-prom-client-para-me-tricas'),
    ['heuristics.ts.prometheus-prom-client.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.buildconfig-constantes-en-tiempo-de-compilacio-n'),
    ['heuristics.android.buildconfig-constantes-en-tiempo-de-compilacio-n.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.touch-targets-mi-nimo-48dp'),
    ['heuristics.android.touch-targets-mi-nimo-48dp.ast']
  );
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.backend.no-singleton'), [
    'heuristics.ts.singleton-pattern.ast',
  ]);
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.backend.magic-numbers-usar-constantes-con-nombres-descriptivos'),
    ['heuristics.ts.magic-numbers.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.backend.hardcoded-values-config-en-variables-de-entorno'),
    ['heuristics.ts.hardcoded-values.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.backend.no-defaults-en-produccio-n-fallar-si-falta-config-cri-tica'),
    ['heuristics.ts.env-default-fallback.ast']
  );
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.backend.callback-hell-usar-async-await'), [
    'heuristics.ts.callback-hell.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.backend.no-god-classes'), [
    'heuristics.ts.god-class-large-class.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.backend.enforce-clean-architecture'), [
    'heuristics.ts.clean-architecture.ast',
  ]);
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.backend.mocks-en-produccio-n-solo-datos-reales'),
    ['heuristics.ts.production-mock.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.backend.guideline.backend.retornar-dtos-no-exponer-entidades-directamente'
    ),
    ['heuristics.ts.return-dtos-no-exponer-entidades-directamente.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.backend.guideline.backend.transacciones-para-operaciones-cri-ticas'),
    ['heuristics.ts.transacciones-para-operaciones-cri-ticas.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.backend.guideline.backend.transacciones-para-operaciones-multi-tabla'),
    ['heuristics.ts.transacciones-para-operaciones-multi-tabla.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.backend.exception-filters-catch-para-manejo-global'),
    ['heuristics.ts.exception-filter.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.backend.guards-para-autenticacio-n-autorizacio-n-useguards-jwtauthguard'
    ),
    ['heuristics.ts.guards-useguards-jwtauthguard.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.backend.interceptors-para-logging-transformacio-n-no-en-cada-endpoint'
    ),
    ['heuristics.ts.interceptors-useinterceptors-logging-transform.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.backend.guideline.backend.input-validation-siempre-validar-con-dtos'),
    ['heuristics.ts.input-validation-siempre-validar-con-dtos.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.backend.guideline.backend.versionado-api-v1-api-v2'),
    ['heuristics.ts.versionado-api-v1-api-v2.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.backend.guideline.backend.nested-validation-validatenested-type'),
    ['heuristics.ts.nested-validation-validatenested-type.ast']
  );
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.frontend.no-solid-violations'), [
    'heuristics.ts.solid.srp.class-command-query-mix.ast',
    'heuristics.ts.solid.isp.interface-command-query-mix.ast',
    'heuristics.ts.solid.ocp.discriminator-switch.ast',
    'heuristics.ts.solid.lsp.override-not-implemented.ast',
    'heuristics.ts.solid.dip.framework-import.ast',
    'heuristics.ts.solid.dip.concrete-instantiation.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.frontend.no-singleton'), [
    'heuristics.ts.singleton-pattern.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.frontend.callback-hell-usar-async-await'), [
    'heuristics.ts.callback-hell.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.frontend.no-class-components'), [
    'heuristics.ts.react-class-component.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.frontend.enforce-clean-architecture'), [
    'heuristics.ts.clean-architecture.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-force-unwrap'), [
    'heuristics.ios.force-unwrap.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-foreground-color'), [
    'heuristics.ios.foreground-color.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-legacy-swiftui-observable-wrapper'), [
    'heuristics.ios.legacy-swiftui-observable-wrapper.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-passed-value-state-wrapper'), [
    'heuristics.ios.passed-value-state-wrapper.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-foreach-indices'), [
    'heuristics.ios.foreach-indices.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-contains-user-filter'), [
    'heuristics.ios.contains-user-filter.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-geometryreader'), [
    'heuristics.ios.geometryreader.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-font-weight-bold'), [
    'heuristics.ios.font-weight-bold.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-preconcurrency'), [
    'heuristics.ios.preconcurrency.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-nonisolated-unsafe'), [
    'heuristics.ios.nonisolated-unsafe.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-assume-isolated'), [
    'heuristics.ios.assume-isolated.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-sheet-is-presented'), [
    'heuristics.ios.sheet-is-presented.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-legacy-onchange'), [
    'heuristics.ios.legacy-onchange.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.prefer-swift-testing'), [
    'heuristics.ios.testing.xctest-import.ast',
    'heuristics.ios.testing.xctest-suite-modernizable.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.critical-test-quality'), [
    'heuristics.ios.testing.xctest-import.ast',
    'heuristics.ios.testing.xctest-suite-modernizable.ast',
    'heuristics.ios.testing.xctassert.ast',
    'heuristics.ios.testing.xctunwrap.ast',
    'heuristics.ios.testing.wait-for-expectations.ast',
    'heuristics.ios.testing.legacy-expectation-description.ast',
    'heuristics.ios.testing.mixed-frameworks.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-xctassert'), [
    'heuristics.ios.testing.xctassert.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-wait-for-expectations'), [
    'heuristics.ios.testing.wait-for-expectations.ast',
  ]);
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.ios.no-legacy-expectation-description'),
    ['heuristics.ios.testing.legacy-expectation-description.ast']
  );
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-mixed-testing-frameworks'), [
    'heuristics.ios.testing.mixed-frameworks.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-nsmanagedobject-async-boundary'), [
    'heuristics.ios.core-data.nsmanagedobject-async-boundary.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-core-data-layer-leak'), [
    'heuristics.ios.core-data.layer-leak.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-nsmanagedobject-state-leak'), [
    'heuristics.ios.core-data.nsmanagedobject-state-leak.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.android.no-globalscope'), [
    'heuristics.android.globalscope.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.android.no-solid-violations'), [
    'heuristics.android.solid.srp.presentation-mixed-responsibilities.ast',
    'heuristics.android.solid.dip.concrete-framework-dependency.ast',
    'heuristics.android.solid.ocp.discriminator-branching.ast',
    'heuristics.android.solid.isp.fat-interface-dependency.ast',
    'heuristics.android.solid.lsp.narrowed-precondition.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.android.enforce-clean-architecture'), [
    'heuristics.android.solid.srp.presentation-mixed-responsibilities.ast',
    'heuristics.android.solid.dip.concrete-framework-dependency.ast',
    'heuristics.android.solid.ocp.discriminator-branching.ast',
    'heuristics.android.solid.isp.fat-interface-dependency.ast',
    'heuristics.android.solid.lsp.narrowed-precondition.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.android.no-console-log'), [
    'heuristics.android.no-console-log.ast',
  ]);
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.analytics-firebase-analytics-o-custom'),
    ['heuristics.android.analytics-firebase-analytics-o-custom.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.android-profiler-cpu-memory-network-profiling'),
    ['heuristics.android.android-profiler-cpu-memory-network-profiling.ast']
  );
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.android.guideline.android.timber-logging-library'), [
    'heuristics.android.timber-logging-library.ast',
  ]);
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.touch-targets-mi-nimo-48dp'),
    ['heuristics.android.touch-targets-mi-nimo-48dp.ast']
  );
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.android.hardcoded-strings-usar-strings-xml'), [
    'heuristics.android.hardcoded-strings.ast',
  ]);
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.localization-strings-xml-por-idioma-values-es-values-en'),
    ['heuristics.android.localization-strings-xml-por-idioma-values-es-values-en.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.plurals-values-plurals-xml'),
    ['heuristics.android.plurals-values-plurals-xml.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.no-singleton-usar-inyeccio-n-de-dependencias-hilt-dagger'),
    ['heuristics.android.no-singleton.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.hilt-com-google-dagger-hilt-android'),
    ['heuristics.android.hilt-com-google-dagger-hilt-android.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.hilt-di-framework-no-manual-factories'),
    ['heuristics.android.hilt-di-framework-no-manual-factories.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.hiltandroidapp-application-class'),
    ['heuristics.android.hiltandroidapp-application-class.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.androidentrypoint-activity-fragment-viewmodel'),
    ['heuristics.android.androidentrypoint-activity-fragment-viewmodel.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.inject-constructor-constructor-injection'),
    ['heuristics.android.inject-constructor-constructor-injection.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.module-installin-provide-dependencies'),
    ['heuristics.android.module-installin-provide-dependencies.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.binds-para-implementaciones-de-interfaces-ma-s-eficiente'
    ),
    ['heuristics.android.binds-para-implementaciones-de-interfaces-ma-s-eficiente.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.provides-para-interfaces-o-third-party'),
    ['heuristics.android.provides-para-interfaces-o-third-party.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.workmanager-androidx-work-work-runtime-ktx'),
    ['heuristics.android.workmanager-androidx-work-work-runtime-ktx.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.version-catalogs-libs-versions-toml-para-dependencias'
    ),
    ['heuristics.android.version-catalogs-libs-versions-toml-para-dependencias.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.workmanager-background-tasks'),
    ['heuristics.android.workmanager-background-tasks.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.aaa-pattern-arrange-act-assert'),
    ['heuristics.android.aaa-pattern-arrange-act-assert.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.given-when-then-bdd-style'),
    ['heuristics.android.given-when-then-bdd-style.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.test-unit-tests-jvm'),
    ['heuristics.android.test-unit-tests-jvm.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.viewmodelscope-scope-de-viewmodel-cancelado-automa-ticamente'
    ),
    ['heuristics.android.viewmodelscope-scope-de-viewmodel-cancelado-automa-ticamente.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.viewmodelscoped-para-dependencias-de-viewmodel'),
    ['heuristics.android.viewmodelscoped-para-dependencias-de-viewmodel.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.composable-functions-composable-para-ui'),
    ['heuristics.android.composable-functions-composable-para-ui.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.arguments-pasar-datos-entre-pantallas'),
    ['heuristics.android.arguments-pasar-datos-entre-pantallas.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.adaptive-layouts-responsive-design-windowsizeclass'
    ),
    ['heuristics.android.adaptive-layouts-responsive-design-windowsizeclass.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle'
    ),
    ['heuristics.android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.theme-color-scheme-typography-shapes'),
    ['heuristics.android.theme-color-scheme-typography-shapes.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.dark-theme-soportar-desde-di-a-1-issystemindarktheme'
    ),
    ['heuristics.android.dark-theme-soportar-desde-di-a-1-issystemindarktheme.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.text-scaling-soportar-font-scaling-del-sistema'),
    ['heuristics.android.text-scaling-soportar-font-scaling-del-sistema.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.accessibility-semantics-contentdescription'),
    ['heuristics.android.accessibility-semantics-contentdescription.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.contentdescription-para-ima-genes-y-botones'),
    ['heuristics.android.contentdescription-para-ima-genes-y-botones.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.talkback-screen-reader-de-android'),
    ['heuristics.android.talkback-screen-reader-de-android.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.preview-preview-para-ver-ui-sin-correr-app'),
    ['heuristics.android.preview-preview-para-ver-ui-sin-correr-app.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.god-activities-single-activity-composables'),
    ['heuristics.android.god-activities-single-activity-composables.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.single-activity-mu-ltiples-composables-fragments-no-activities'
    ),
    ['heuristics.android.single-activity-multiples-composables-fragments-no-activities.ast']
  );
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.android.no-force-unwrap'), [
    'heuristics.android.force-unwrap.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.android.no-java-new-code'), [
    'heuristics.android.java-source.ast',
  ]);
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.asynctask-deprecated-usar-coroutines'),
    ['heuristics.android.asynctask-deprecated.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.coroutines-async-await-no-callbacks'),
    ['heuristics.android.coroutines-async-await-no-callbacks.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.suspend-functions-en-api-service'),
    ['heuristics.android.suspend-functions-en-api-service.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.dao-data-access-objects-con-suspend-functions'),
    ['heuristics.android.dao-data-access-objects-con-suspend-functions.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.transaction-para-operaciones-multi-query'),
    ['heuristics.android.transaction-para-operaciones-multi-query.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.stateflow-estado-mutable-observable'),
    ['heuristics.android.stateflow-estado-mutable-observable.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.sharedflow-hot-stream-puede-no-tener-valor-para-eventos'
    ),
    ['heuristics.android.sharedflow-hot-stream-puede-no-tener-valor-para-eventos.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.flow-builders-flow-emit-flowof-asflow'),
    ['heuristics.android.flow-builders-flow-emit-flowof-asflow.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.collect-terminal-operator-para-consumir-flow'
    ),
    ['heuristics.android.collect-terminal-operator-para-consumir-flow.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.collect-as-state-consumir-flow-en-compose'),
    ['heuristics.android.collect-as-state-consumir-flow-en-compose.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.remember-evitar-recrear-objetos'),
    ['heuristics.android.remember-evitar-recrear-objetos.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.remember-para-mantener-estado-entre-recomposiciones'
    ),
    ['heuristics.android.remember-para-mantener-estado-entre-recomposiciones.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input'
    ),
    ['heuristics.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.derivedstateof-ca-lculos-derivados-de-state'
    ),
    ['heuristics.android.derivedstateof-ca-lculos-derivados-de-state.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.launchedeffect-side-effects-con-lifecycle'
    ),
    ['heuristics.android.launchedeffect-side-effects-con-lifecycle.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.launchedeffect-keys-controlar-cuando-se-relanza-effect'
    ),
    ['heuristics.android.launchedeffect-keys-controlar-cuando-se-relanza-effect.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.uistate-sealed-class-loading-success-error-states'
    ),
    ['heuristics.android.uistate-sealed-class-loading-success-error-states.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.use-cases-lo-gica-de-negocio-encapsulada'),
    ['heuristics.android.use-cases-lo-gica-de-negocio-encapsulada.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.repository-pattern-abstraer-acceso-a-datos'),
    ['heuristics.android.repository-pattern-abstraer-acceso-a-datos.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.repository-pattern-ordersrep'),
    ['heuristics.android.repository-pattern-abstraer-acceso-a-datos.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.app-startup-androidx-startup-para-lazy-init'),
    ['heuristics.android.app-startup-androidx-startup-para-lazy-init.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.baseline-profiles-optimizacio-n-de-startup'),
    ['heuristics.android.baseline-profiles-optimizacio-n-de-startup.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.state-hoisting-elevar-estado-al-nivel-apropiado'),
    ['heuristics.android.state-hoisting-elevar-estado-al-nivel-apropiado.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.single-source-of-truth-viewmodel-es-la-fuente'),
    ['heuristics.android.single-source-of-truth-viewmodel-es-la-fuente.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.skip-recomposition-para-metros-inmutables-o-estables'),
    ['heuristics.android.skip-recomposition-para-metros-inmutables-o-estables.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.stability-composables-estables-recomponen-menos'),
    ['heuristics.android.stability-composables-estables-recomponen-menos.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.string-formatting-1-s-2-d-para-argumentos'),
    ['heuristics.android.string-formatting-1-s-2-d-para-argumentos.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.viewmodel-androidx-lifecycle-viewmodel'),
    ['heuristics.android.viewmodel-androidx-lifecycle-viewmodel.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.guideline.android.viewmodel-sobrevive-configuration-changes'),
    ['heuristics.android.viewmodel-sobrevive-configuration-changes.ast']
  );
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.android.findviewbyid-view-binding-o-compose'), [
    'heuristics.android.findviewbyid.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.android.rxjava-new-code'), [
    'heuristics.android.rxjava-new-code.ast',
  ]);
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.dispatchers-main-ui-io-network-disk-default-cpu'),
    ['heuristics.android.dispatchers-main-ui-io-network-disk-default-cpu.ast']
  );
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.android.withcontext-change-dispatcher'), [
    'heuristics.android.withcontext-change-dispatcher.ast',
  ]);
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.android.try-catch-manejo-de-errores-en-coroutines'),
    ['heuristics.android.try-catch-manejo-de-errores-en-coroutines.ast']
  );
});

test('devuelve lista ordenada de bindings y binding completo por ruleId', () => {
  const bindings = listSkillsDetectorBindings();
  assert.equal(bindings.length > 0, true);
  const ids = bindings.map((entry) => entry.ruleId);
  const sorted = [...ids].sort((left, right) => left.localeCompare(right));
  assert.deepEqual(ids, sorted);

  const binding = resolveSkillsDetectorBinding('skills.backend.no-god-classes');
  assert.ok(binding);
  assert.equal(binding.detectorId, 'typescript.god-class');
  assert.equal(binding.detectorKind, 'heuristic');
  assert.deepEqual(binding.mappedHeuristicRuleIds, ['heuristics.ts.god-class-large-class.ast']);

  const frontendBinding = resolveSkillsDetectorBinding('skills.frontend.no-god-classes');
  assert.ok(frontendBinding);
  assert.equal(frontendBinding.detectorId, 'typescript.god-class');
  assert.equal(frontendBinding.detectorKind, 'heuristic');
  assert.deepEqual(frontendBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.god-class-large-class.ast',
  ]);

  const classComponentsBinding = resolveSkillsDetectorBinding('skills.frontend.no-class-components');
  assert.ok(classComponentsBinding);
  assert.equal(classComponentsBinding.detectorId, 'typescript.react-class-component');
  assert.equal(classComponentsBinding.detectorKind, 'heuristic');
  assert.deepEqual(classComponentsBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.react-class-component.ast',
  ]);

  const singletonBinding = resolveSkillsDetectorBinding('skills.backend.no-singleton');
  assert.ok(singletonBinding);
  assert.equal(singletonBinding.detectorId, 'typescript.singleton');
  assert.equal(singletonBinding.detectorKind, 'heuristic');
  assert.deepEqual(singletonBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.singleton-pattern.ast',
  ]);

  const sensitiveLogBinding = resolveSkillsDetectorBinding(
    'skills.backend.no-loggear-datos-sensibles-passwords-tokens-pii'
  );
  assert.ok(sensitiveLogBinding);
  assert.equal(sensitiveLogBinding.detectorId, 'typescript.sensitive-log');
  assert.equal(sensitiveLogBinding.detectorKind, 'heuristic');
  assert.deepEqual(sensitiveLogBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.no-sensitive-log.ast',
  ]);

  const passwordHashingBinding = resolveSkillsDetectorBinding(
    'skills.backend.password-hashing-bcrypt-con-salt-rounds-10'
  );
  assert.ok(passwordHashingBinding);
  assert.equal(passwordHashingBinding.detectorId, 'typescript.password-hashing');
  assert.equal(passwordHashingBinding.detectorKind, 'heuristic');
  assert.deepEqual(passwordHashingBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.password-hashing-bcrypt-salt-rounds-10.ast',
  ]);

  const rateLimitingBruteForceBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.rate-limiting-nestjs-throttler-para-prevenir-brute-force'
  );
  assert.ok(rateLimitingBruteForceBinding);
  assert.equal(rateLimitingBruteForceBinding.detectorId, 'typescript.rate-limiting-throttler');
  assert.equal(rateLimitingBruteForceBinding.detectorKind, 'heuristic');
  assert.deepEqual(rateLimitingBruteForceBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.rate-limiting-throttler.ast',
  ]);

  const rateLimitingAbuseBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.rate-limiting-throttler-para-prevenir-abuse'
  );
  assert.ok(rateLimitingAbuseBinding);
  assert.equal(rateLimitingAbuseBinding.detectorId, 'typescript.rate-limiting-throttler');
  assert.equal(rateLimitingAbuseBinding.detectorKind, 'heuristic');
  assert.deepEqual(rateLimitingAbuseBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.rate-limiting-throttler.ast',
  ]);

  const corsConfiguredBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.cors-configurado-solo-ori-genes-permitidos'
  );
  assert.ok(corsConfiguredBinding);
  assert.equal(corsConfiguredBinding.detectorId, 'typescript.cors-configured');
  assert.equal(corsConfiguredBinding.detectorKind, 'heuristic');
  assert.deepEqual(corsConfiguredBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.cors-configured.ast',
  ]);

  const corsAllowedOriginsBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.cors-configurar-ori-genes-permitidos'
  );
  assert.ok(corsAllowedOriginsBinding);
  assert.equal(corsAllowedOriginsBinding.detectorId, 'typescript.cors-configured');
  assert.equal(corsAllowedOriginsBinding.detectorKind, 'heuristic');
  assert.deepEqual(corsAllowedOriginsBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.cors-configured.ast',
  ]);

  const validationPipeGlobalBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.pipes-para-validacio-n-global-validationpipe-en-main-ts'
  );
  assert.ok(validationPipeGlobalBinding);
  assert.equal(validationPipeGlobalBinding.detectorId, 'typescript.validationpipe-global');
  assert.equal(validationPipeGlobalBinding.detectorKind, 'heuristic');
  assert.deepEqual(validationPipeGlobalBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.validationpipe-global.ast',
  ]);

  const validationPipeWhitelistBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.validationpipe-global-en-main-ts-con-whitelist-true'
  );
  assert.ok(validationPipeWhitelistBinding);
  assert.equal(validationPipeWhitelistBinding.detectorId, 'typescript.validationpipe-global');
  assert.equal(validationPipeWhitelistBinding.detectorKind, 'heuristic');
  assert.deepEqual(validationPipeWhitelistBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.validationpipe-global.ast',
  ]);

  const versionadoBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.versionado-api-v1-api-v2'
  );
  assert.ok(versionadoBinding);
  assert.equal(versionadoBinding.detectorId, 'typescript.versionado-api-v1-api-v2');
  assert.equal(versionadoBinding.detectorKind, 'heuristic');
  assert.deepEqual(versionadoBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.versionado-api-v1-api-v2.ast',
  ]);

  const validationConfigBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.validation-de-config-joi-o-class-validator-para-env'
  );
  assert.ok(validationConfigBinding);
  assert.equal(validationConfigBinding.detectorId, 'typescript.validation-config');
  assert.equal(validationConfigBinding.detectorKind, 'heuristic');
  assert.deepEqual(validationConfigBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.validation-config.ast',
  ]);

  const classValidatorBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.class-validator-decorators-isstring-isemail-min-max'
  );
  assert.ok(classValidatorBinding);
  assert.equal(classValidatorBinding.detectorId, 'typescript.class-validator-decorators');
  assert.equal(classValidatorBinding.detectorKind, 'heuristic');
  assert.deepEqual(classValidatorBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.class-validator-decorators.ast',
  ]);

  const classTransformerBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.class-transformer-transform-exclude-expose'
  );
  assert.ok(classTransformerBinding);
  assert.equal(classTransformerBinding.detectorId, 'typescript.class-transformer-decorators');
  assert.equal(classTransformerBinding.detectorKind, 'heuristic');
  assert.deepEqual(classTransformerBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.class-transformer-decorators.ast',
  ]);

  const inputValidationBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.input-validation-siempre-validar-con-dtos'
  );
  assert.ok(inputValidationBinding);
  assert.equal(inputValidationBinding.detectorId, 'typescript.input-validation-siempre-validar-con-dtos');
  assert.equal(inputValidationBinding.detectorKind, 'heuristic');
  assert.deepEqual(inputValidationBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.input-validation-siempre-validar-con-dtos.ast',
  ]);

  const nestedValidationBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.nested-validation-validatenested-type'
  );
  assert.ok(nestedValidationBinding);
  assert.equal(nestedValidationBinding.detectorId, 'typescript.nested-validation-validatenested-type');
  assert.equal(nestedValidationBinding.detectorKind, 'heuristic');
  assert.deepEqual(nestedValidationBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.nested-validation-validatenested-type.ast',
  ]);

  const dtoBoundaryBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.dtos-en-boundaries-validacio-n-en-entrada-salida'
  );
  assert.ok(dtoBoundaryBinding);
  assert.equal(dtoBoundaryBinding.detectorId, 'typescript.dto-boundaries');
  assert.equal(dtoBoundaryBinding.detectorKind, 'heuristic');
  assert.deepEqual(dtoBoundaryBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.dtos-en-boundaries-validacio-n-en-entrada-salida.ast',
  ]);

  const returnDtosBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.retornar-dtos-no-exponer-entidades-directamente'
  );
  assert.ok(returnDtosBinding);
  assert.equal(returnDtosBinding.detectorId, 'typescript.return-dtos');
  assert.equal(returnDtosBinding.detectorKind, 'heuristic');
  assert.deepEqual(returnDtosBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.return-dtos-no-exponer-entidades-directamente.ast',
  ]);

  const criticalTransactionsBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.transacciones-para-operaciones-cri-ticas'
  );
  assert.ok(criticalTransactionsBinding);
  assert.equal(criticalTransactionsBinding.detectorId, 'typescript.transactions');
  assert.equal(criticalTransactionsBinding.detectorKind, 'heuristic');
  assert.deepEqual(criticalTransactionsBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.transacciones-para-operaciones-cri-ticas.ast',
  ]);

  const multiTableTransactionsBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.transacciones-para-operaciones-multi-tabla'
  );
  assert.ok(multiTableTransactionsBinding);
  assert.equal(multiTableTransactionsBinding.detectorId, 'typescript.transactions');
  assert.equal(multiTableTransactionsBinding.detectorKind, 'heuristic');
  assert.deepEqual(multiTableTransactionsBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.transacciones-para-operaciones-multi-tabla.ast',
  ]);

  const winstonBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.winston-logger-estructurado-json-logs'
  );
  assert.ok(winstonBinding);
  assert.equal(winstonBinding.detectorId, 'typescript.winston-structured-json-logger');
  assert.equal(winstonBinding.detectorKind, 'heuristic');
  assert.deepEqual(winstonBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.winston-structured-json-logger.ast',
  ]);

  const errorLoggingBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.loggear-errores-con-contexto-completo'
  );
  assert.ok(errorLoggingBinding);
  assert.equal(errorLoggingBinding.detectorId, 'typescript.error-logging-full-context');
  assert.equal(errorLoggingBinding.detectorKind, 'heuristic');
  assert.deepEqual(errorLoggingBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.error-logging-full-context.ast',
  ]);

  const correlationIdsBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.correlation-ids-para-tracing-distribuido'
  );
  assert.ok(correlationIdsBinding);
  assert.equal(correlationIdsBinding.detectorId, 'typescript.correlation-ids');
  assert.equal(correlationIdsBinding.detectorKind, 'heuristic');
  assert.deepEqual(correlationIdsBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.correlation-ids.ast',
  ]);

  const viewModelBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.viewmodel-androidx-lifecycle-viewmodel'
  );
  assert.ok(viewModelBinding);
  assert.equal(viewModelBinding.detectorId, 'android.viewmodel');
  assert.equal(viewModelBinding.detectorKind, 'heuristic');
  assert.deepEqual(viewModelBinding.mappedHeuristicRuleIds, [
    'heuristics.android.viewmodel-androidx-lifecycle-viewmodel.ast',
  ]);

  const versionCatalogBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.version-catalogs-libs-versions-toml-para-dependencias'
  );
  assert.ok(versionCatalogBinding);
  assert.equal(versionCatalogBinding.detectorId, 'android.version-catalogs-libs-versions-toml');
  assert.equal(versionCatalogBinding.detectorKind, 'heuristic');
  assert.deepEqual(versionCatalogBinding.mappedHeuristicRuleIds, [
    'heuristics.android.version-catalogs-libs-versions-toml-para-dependencias.ast',
  ]);

  const workManagerDependencyBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.workmanager-androidx-work-work-runtime-ktx'
  );
  assert.ok(workManagerDependencyBinding);
  assert.equal(workManagerDependencyBinding.detectorId, 'android.workmanager-androidx-work-work-runtime-ktx');
  assert.equal(workManagerDependencyBinding.detectorKind, 'heuristic');
  assert.deepEqual(workManagerDependencyBinding.mappedHeuristicRuleIds, [
    'heuristics.android.workmanager-androidx-work-work-runtime-ktx.ast',
  ]);

  const bindsBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.binds-para-implementaciones-de-interfaces-ma-s-eficiente'
  );
  assert.ok(bindsBinding);
  assert.equal(bindsBinding.detectorId, 'android.binds-para-implementaciones-de-interfaces-ma-s-eficiente');
  assert.equal(bindsBinding.detectorKind, 'heuristic');
  assert.deepEqual(bindsBinding.mappedHeuristicRuleIds, [
    'heuristics.android.binds-para-implementaciones-de-interfaces-ma-s-eficiente.ast',
  ]);

  const providesBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.provides-para-interfaces-o-third-party'
  );
  assert.ok(providesBinding);
  assert.equal(providesBinding.detectorId, 'android.provides-para-interfaces-o-third-party');
  assert.equal(providesBinding.detectorKind, 'heuristic');
  assert.deepEqual(providesBinding.mappedHeuristicRuleIds, [
    'heuristics.android.provides-para-interfaces-o-third-party.ast',
  ]);

  const workManagerBackgroundTaskBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.workmanager-background-tasks'
  );
  assert.ok(workManagerBackgroundTaskBinding);
  assert.equal(workManagerBackgroundTaskBinding.detectorId, 'android.workmanager-background-tasks');
  assert.equal(workManagerBackgroundTaskBinding.detectorKind, 'heuristic');
  assert.deepEqual(workManagerBackgroundTaskBinding.mappedHeuristicRuleIds, [
    'heuristics.android.workmanager-background-tasks.ast',
  ]);

  const androidTestBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.androidtest-instrumented-tests-device-emulator'
  );
  assert.ok(androidTestBinding);
  assert.equal(androidTestBinding.detectorId, 'android.androidtest-instrumented-tests-device-emulator');
  assert.equal(androidTestBinding.detectorKind, 'heuristic');
  assert.deepEqual(androidTestBinding.mappedHeuristicRuleIds, [
    'heuristics.android.androidtest-instrumented-tests-device-emulator.ast',
  ]);

  const aaaBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.aaa-pattern-arrange-act-assert'
  );
  assert.ok(aaaBinding);
  assert.equal(aaaBinding.detectorId, 'android.aaa-pattern-arrange-act-assert');
  assert.equal(aaaBinding.detectorKind, 'heuristic');
  assert.deepEqual(aaaBinding.mappedHeuristicRuleIds, [
    'heuristics.android.aaa-pattern-arrange-act-assert.ast',
  ]);

  const bddBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.given-when-then-bdd-style'
  );
  assert.ok(bddBinding);
  assert.equal(bddBinding.detectorId, 'android.given-when-then-bdd-style');
  assert.equal(bddBinding.detectorKind, 'heuristic');
  assert.deepEqual(bddBinding.mappedHeuristicRuleIds, [
    'heuristics.android.given-when-then-bdd-style.ast',
  ]);

  const jvmUnitTestBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.test-unit-tests-jvm'
  );
  assert.ok(jvmUnitTestBinding);
  assert.equal(jvmUnitTestBinding.detectorId, 'android.test-unit-tests-jvm');
  assert.equal(jvmUnitTestBinding.detectorKind, 'heuristic');
  assert.deepEqual(jvmUnitTestBinding.mappedHeuristicRuleIds, [
    'heuristics.android.test-unit-tests-jvm.ast',
  ]);

  const singleSourceBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.single-source-of-truth-viewmodel-es-la-fuente'
  );
  assert.ok(singleSourceBinding);
  assert.equal(singleSourceBinding.detectorId, 'android.single-source-of-truth-viewmodel-es-la-fuente');
  assert.equal(singleSourceBinding.detectorKind, 'heuristic');
  assert.deepEqual(singleSourceBinding.mappedHeuristicRuleIds, [
    'heuristics.android.single-source-of-truth-viewmodel-es-la-fuente.ast',
  ]);

  const stabilityBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.stability-composables-estables-recomponen-menos'
  );
  assert.ok(stabilityBinding);
  assert.equal(stabilityBinding.detectorId, 'android.stability-composables-estables-recomponen-menos');
  assert.equal(stabilityBinding.detectorKind, 'heuristic');
  assert.deepEqual(stabilityBinding.mappedHeuristicRuleIds, [
    'heuristics.android.stability-composables-estables-recomponen-menos.ast',
  ]);

  const stringFormattingBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.string-formatting-1-s-2-d-para-argumentos'
  );
  assert.ok(stringFormattingBinding);
  assert.equal(
    stringFormattingBinding.detectorId,
    'android.string-formatting-1-s-2-d-para-argumentos'
  );
  assert.equal(stringFormattingBinding.detectorKind, 'heuristic');
  assert.deepEqual(stringFormattingBinding.mappedHeuristicRuleIds, [
    'heuristics.android.string-formatting-1-s-2-d-para-argumentos.ast',
  ]);

  const collectBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.collect-terminal-operator-para-consumir-flow'
  );
  assert.ok(collectBinding);
  assert.equal(collectBinding.detectorId, 'android.collect-terminal-operator-para-consumir-flow');
  assert.equal(collectBinding.detectorKind, 'heuristic');
  assert.deepEqual(collectBinding.mappedHeuristicRuleIds, [
    'heuristics.android.collect-terminal-operator-para-consumir-flow.ast',
  ]);

  const collectAsStateBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.collect-as-state-consumir-flow-en-compose'
  );
  assert.ok(collectAsStateBinding);
  assert.equal(collectAsStateBinding.detectorId, 'android.collect-as-state-consumir-flow-en-compose');
  assert.equal(collectAsStateBinding.detectorKind, 'heuristic');
  assert.deepEqual(collectAsStateBinding.mappedHeuristicRuleIds, [
    'heuristics.android.collect-as-state-consumir-flow-en-compose.ast',
  ]);

  const rememberBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.remember-evitar-recrear-objetos'
  );
  assert.ok(rememberBinding);
  assert.equal(rememberBinding.detectorId, 'android.remember-evitar-recrear-objetos');
  assert.equal(rememberBinding.detectorKind, 'heuristic');
  assert.deepEqual(rememberBinding.mappedHeuristicRuleIds, [
    'heuristics.android.remember-evitar-recrear-objetos.ast',
  ]);

  const derivedStateOfBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input'
  );
  assert.ok(derivedStateOfBinding);
  assert.equal(
    derivedStateOfBinding.detectorId,
    'android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input'
  );
  assert.equal(derivedStateOfBinding.detectorKind, 'heuristic');
  assert.deepEqual(derivedStateOfBinding.mappedHeuristicRuleIds, [
    'heuristics.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input.ast',
  ]);

  const derivedStateOfDerivedBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.derivedstateof-ca-lculos-derivados-de-state'
  );
  assert.ok(derivedStateOfDerivedBinding);
  assert.equal(
    derivedStateOfDerivedBinding.detectorId,
    'android.derivedstateof-ca-lculos-derivados-de-state'
  );
  assert.equal(derivedStateOfDerivedBinding.detectorKind, 'heuristic');
  assert.deepEqual(derivedStateOfDerivedBinding.mappedHeuristicRuleIds, [
    'heuristics.android.derivedstateof-ca-lculos-derivados-de-state.ast',
  ]);

  const launchedEffectBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.launchedeffect-side-effects-con-lifecycle'
  );
  assert.ok(launchedEffectBinding);
  assert.equal(
    launchedEffectBinding.detectorId,
    'android.launchedeffect-side-effects-con-lifecycle'
  );
  assert.equal(launchedEffectBinding.detectorKind, 'heuristic');
  assert.deepEqual(launchedEffectBinding.mappedHeuristicRuleIds, [
    'heuristics.android.launchedeffect-side-effects-con-lifecycle.ast',
  ]);

  const launchedEffectKeysBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.launchedeffect-keys-controlar-cuando-se-relanza-effect'
  );
  assert.ok(launchedEffectKeysBinding);
  assert.equal(
    launchedEffectKeysBinding.detectorId,
    'android.launchedeffect-keys-controlar-cuando-se-relanza-effect'
  );
  assert.equal(launchedEffectKeysBinding.detectorKind, 'heuristic');
  assert.deepEqual(launchedEffectKeysBinding.mappedHeuristicRuleIds, [
    'heuristics.android.launchedeffect-keys-controlar-cuando-se-relanza-effect.ast',
  ]);

  const disposableEffectBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n'
  );
  assert.ok(disposableEffectBinding);
  assert.equal(
    disposableEffectBinding.detectorId,
    'android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n'
  );
  assert.equal(disposableEffectBinding.detectorKind, 'heuristic');
  assert.deepEqual(disposableEffectBinding.mappedHeuristicRuleIds, [
    'heuristics.android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n.ast',
  ]);

  const rememberStateBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.remember-para-mantener-estado-entre-recomposiciones'
  );
  assert.ok(rememberStateBinding);
  assert.equal(
    rememberStateBinding.detectorId,
    'android.remember-para-mantener-estado-entre-recomposiciones'
  );
  assert.equal(rememberStateBinding.detectorKind, 'heuristic');
  assert.deepEqual(rememberStateBinding.mappedHeuristicRuleIds, [
    'heuristics.android.remember-para-mantener-estado-entre-recomposiciones.ast',
  ]);

  const previewBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.preview-preview-para-ver-ui-sin-correr-app'
  );
  assert.ok(previewBinding);
  assert.equal(previewBinding.detectorId, 'android.preview-preview-para-ver-ui-sin-correr-app');
  assert.equal(previewBinding.detectorKind, 'heuristic');
  assert.deepEqual(previewBinding.mappedHeuristicRuleIds, [
    'heuristics.android.preview-preview-para-ver-ui-sin-correr-app.ast',
  ]);

  const accessibilityBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.accessibility-semantics-contentdescription'
  );
  assert.ok(accessibilityBinding);
  assert.equal(accessibilityBinding.detectorId, 'android.accessibility-semantics-contentdescription');
  assert.equal(accessibilityBinding.detectorKind, 'heuristic');
  assert.deepEqual(accessibilityBinding.mappedHeuristicRuleIds, [
    'heuristics.android.accessibility-semantics-contentdescription.ast',
  ]);
  const textScalingBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.text-scaling-soportar-font-scaling-del-sistema'
  );
  assert.ok(textScalingBinding);
  assert.equal(textScalingBinding.detectorId, 'android.text-scaling-soportar-font-scaling-del-sistema');
  assert.equal(textScalingBinding.detectorKind, 'heuristic');
  assert.deepEqual(textScalingBinding.mappedHeuristicRuleIds, [
    'heuristics.android.text-scaling-soportar-font-scaling-del-sistema.ast',
  ]);
  const touchTargetsBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.touch-targets-mi-nimo-48dp'
  );
  assert.ok(touchTargetsBinding);
  assert.equal(touchTargetsBinding.detectorId, 'android.touch-targets-mi-nimo-48dp');
  assert.equal(touchTargetsBinding.detectorKind, 'heuristic');
  assert.deepEqual(touchTargetsBinding.mappedHeuristicRuleIds, [
    'heuristics.android.touch-targets-mi-nimo-48dp.ast',
  ]);
  const analyticsBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.analytics-firebase-analytics-o-custom'
  );
  assert.ok(analyticsBinding);
  assert.equal(analyticsBinding.detectorId, 'android.analytics-firebase-analytics-o-custom');
  assert.equal(analyticsBinding.detectorKind, 'heuristic');
  assert.deepEqual(analyticsBinding.mappedHeuristicRuleIds, [
    'heuristics.android.analytics-firebase-analytics-o-custom.ast',
  ]);
  const profilerBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.android-profiler-cpu-memory-network-profiling'
  );
  assert.ok(profilerBinding);
  assert.equal(profilerBinding.detectorId, 'android.android-profiler-cpu-memory-network-profiling');
  assert.equal(profilerBinding.detectorKind, 'heuristic');
  assert.deepEqual(profilerBinding.mappedHeuristicRuleIds, [
    'heuristics.android.android-profiler-cpu-memory-network-profiling.ast',
  ]);
  const transactionBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.transaction-para-operaciones-multi-query'
  );
  assert.ok(transactionBinding);
  assert.equal(transactionBinding.detectorId, 'android.transaction-para-operaciones-multi-query');
  assert.equal(transactionBinding.detectorKind, 'heuristic');
  assert.deepEqual(transactionBinding.mappedHeuristicRuleIds, [
    'heuristics.android.transaction-para-operaciones-multi-query.ast',
  ]);
  const contentDescriptionBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.contentdescription-para-ima-genes-y-botones'
  );
  assert.ok(contentDescriptionBinding);
  assert.equal(contentDescriptionBinding.detectorId, 'android.contentdescription-para-ima-genes-y-botones');
  assert.equal(contentDescriptionBinding.detectorKind, 'heuristic');
  assert.deepEqual(contentDescriptionBinding.mappedHeuristicRuleIds, [
    'heuristics.android.contentdescription-para-ima-genes-y-botones.ast',
  ]);
  const talkbackBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.talkback-screen-reader-de-android'
  );
  assert.ok(talkbackBinding);
  assert.equal(talkbackBinding.detectorId, 'android.talkback-screen-reader-de-android');
  assert.equal(talkbackBinding.detectorKind, 'heuristic');
  assert.deepEqual(talkbackBinding.mappedHeuristicRuleIds, [
    'heuristics.android.talkback-screen-reader-de-android.ast',
  ]);

  const recompositionBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.recomposition-composables-deben-ser-idempotentes'
  );
  assert.ok(recompositionBinding);
  assert.equal(recompositionBinding.detectorId, 'android.recomposition-composables-deben-ser-idempotentes');
  assert.equal(recompositionBinding.detectorKind, 'heuristic');
  assert.deepEqual(recompositionBinding.mappedHeuristicRuleIds, [
    'heuristics.android.recomposition-composables-deben-ser-idempotentes.ast',
  ]);

  const uiStateBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.uistate-sealed-class-loading-success-error-states'
  );
  assert.ok(uiStateBinding);
  assert.equal(uiStateBinding.detectorId, 'android.uistate-sealed-class-loading-success-error-states');
  assert.equal(uiStateBinding.detectorKind, 'heuristic');
  assert.deepEqual(uiStateBinding.mappedHeuristicRuleIds, [
    'heuristics.android.uistate-sealed-class-loading-success-error-states.ast',
  ]);

  const useCasesBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.use-cases-lo-gica-de-negocio-encapsulada'
  );
  assert.ok(useCasesBinding);
  assert.equal(useCasesBinding.detectorId, 'android.use-cases-lo-gica-de-negocio-encapsulada');
  assert.equal(useCasesBinding.detectorKind, 'heuristic');
  assert.deepEqual(useCasesBinding.mappedHeuristicRuleIds, [
    'heuristics.android.use-cases-lo-gica-de-negocio-encapsulada.ast',
  ]);

  const repositoryBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.repository-pattern-abstraer-acceso-a-datos'
  );
  assert.ok(repositoryBinding);
  assert.equal(repositoryBinding.detectorId, 'android.repository-pattern-abstraer-acceso-a-datos');
  assert.equal(repositoryBinding.detectorKind, 'heuristic');
  assert.deepEqual(repositoryBinding.mappedHeuristicRuleIds, [
    'heuristics.android.repository-pattern-abstraer-acceso-a-datos.ast',
  ]);

  const ordersRepBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.repository-pattern-ordersrep'
  );
  assert.ok(ordersRepBinding);
  assert.equal(ordersRepBinding.detectorId, 'android.repository-pattern-abstraer-acceso-a-datos');
  assert.equal(ordersRepBinding.detectorKind, 'heuristic');
  assert.deepEqual(ordersRepBinding.mappedHeuristicRuleIds, [
    'heuristics.android.repository-pattern-abstraer-acceso-a-datos.ast',
  ]);

  const stateHoistingBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.state-hoisting-elevar-estado-al-nivel-apropiado'
  );
  assert.ok(stateHoistingBinding);
  assert.equal(stateHoistingBinding.detectorId, 'android.state-hoisting');
  assert.equal(stateHoistingBinding.detectorKind, 'heuristic');
  assert.deepEqual(stateHoistingBinding.mappedHeuristicRuleIds, [
    'heuristics.android.state-hoisting-elevar-estado-al-nivel-apropiado.ast',
  ]);

  const appStartupBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.app-startup-androidx-startup-para-lazy-init'
  );
  assert.ok(appStartupBinding);
  assert.equal(appStartupBinding.detectorId, 'android.app-startup-androidx-startup-para-lazy-init');
  assert.equal(appStartupBinding.detectorKind, 'heuristic');
  assert.deepEqual(appStartupBinding.mappedHeuristicRuleIds, [
    'heuristics.android.app-startup-androidx-startup-para-lazy-init.ast',
  ]);

  const baselineProfilesBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.baseline-profiles-optimizacio-n-de-startup'
  );
  assert.ok(baselineProfilesBinding);
  assert.equal(
    baselineProfilesBinding.detectorId,
    'android.baseline-profiles-optimizacio-n-de-startup'
  );
  assert.equal(baselineProfilesBinding.detectorKind, 'heuristic');
  assert.deepEqual(baselineProfilesBinding.mappedHeuristicRuleIds, [
    'heuristics.android.baseline-profiles-optimizacio-n-de-startup.ast',
  ]);

  const skipRecompositionBinding = resolveSkillsDetectorBinding(
    'skills.android.guideline.android.skip-recomposition-para-metros-inmutables-o-estables'
  );
  assert.ok(skipRecompositionBinding);
  assert.equal(
    skipRecompositionBinding.detectorId,
    'android.skip-recomposition-para-metros-inmutables-o-estables'
  );
  assert.equal(skipRecompositionBinding.detectorKind, 'heuristic');
  assert.deepEqual(skipRecompositionBinding.mappedHeuristicRuleIds, [
    'heuristics.android.skip-recomposition-para-metros-inmutables-o-estables.ast',
  ]);

  const metricsBinding = resolveSkillsDetectorBinding(
    'skills.backend.guideline.backend.me-tricas-prometheus-prom-client-para-me-tricas'
  );
  assert.ok(metricsBinding);
  assert.equal(metricsBinding.detectorId, 'typescript.prometheus-metrics');
  assert.equal(metricsBinding.detectorKind, 'heuristic');
  assert.deepEqual(metricsBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.prometheus-prom-client.ast',
  ]);

  const magicNumbersBinding = resolveSkillsDetectorBinding(
    'skills.backend.magic-numbers-usar-constantes-con-nombres-descriptivos'
  );
  assert.ok(magicNumbersBinding);
  assert.equal(magicNumbersBinding.detectorId, 'typescript.magic-numbers');
  assert.equal(magicNumbersBinding.detectorKind, 'heuristic');
  assert.deepEqual(magicNumbersBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.magic-numbers.ast',
  ]);

  const hardcodedValuesBinding = resolveSkillsDetectorBinding(
    'skills.backend.hardcoded-values-config-en-variables-de-entorno'
  );
  assert.ok(hardcodedValuesBinding);
  assert.equal(hardcodedValuesBinding.detectorId, 'typescript.hardcoded-values');
  assert.equal(hardcodedValuesBinding.detectorKind, 'heuristic');
  assert.deepEqual(hardcodedValuesBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.hardcoded-values.ast',
  ]);

  const noDefaultsBinding = resolveSkillsDetectorBinding(
    'skills.backend.no-defaults-en-produccio-n-fallar-si-falta-config-cri-tica'
  );
  assert.ok(noDefaultsBinding);
  assert.equal(noDefaultsBinding.detectorId, 'typescript.env-default-fallback');
  assert.equal(noDefaultsBinding.detectorKind, 'heuristic');
  assert.deepEqual(noDefaultsBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.env-default-fallback.ast',
  ]);

  const callbackHellBinding = resolveSkillsDetectorBinding(
    'skills.backend.callback-hell-usar-async-await'
  );
  assert.ok(callbackHellBinding);
  assert.equal(callbackHellBinding.detectorId, 'typescript.callback-hell');
  assert.equal(callbackHellBinding.detectorKind, 'heuristic');
  assert.deepEqual(callbackHellBinding.mappedHeuristicRuleIds, [
    'heuristics.ts.callback-hell.ast',
  ]);
});

test('regla no mapeada devuelve lista vacia y binding undefined', () => {
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.backend.non-existent-rule'), []);
  assert.equal(resolveSkillsDetectorBinding('skills.backend.non-existent-rule'), undefined);
});
