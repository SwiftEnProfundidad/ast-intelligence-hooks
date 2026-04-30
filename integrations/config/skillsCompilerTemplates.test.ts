import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SKILLS_LOCK_COMPILER_VERSION,
  skillsCompilerTemplates,
} from './skillsCompilerTemplates';

test('skillsCompilerTemplates mantiene versión de compilador en semver y nombres coherentes', () => {
  assert.match(SKILLS_LOCK_COMPILER_VERSION, /^\d+\.\d+\.\d+$/);

  for (const [key, template] of Object.entries(skillsCompilerTemplates)) {
    assert.equal(template.name, key);
    assert.ok(template.description.length > 0);
  }
});

test('skillsCompilerTemplates no contiene ids de regla duplicados entre bundles', () => {
  const seen = new Set<string>();
  for (const template of Object.values(skillsCompilerTemplates)) {
    for (const rule of template.rules) {
      assert.equal(seen.has(rule.id), false, `Duplicated rule id: ${rule.id}`);
      seen.add(rule.id);
    }
  }
});

test('skillsCompilerTemplates define reglas locked con severidades y plataformas válidas', () => {
  const validSeverities = new Set(['WARN', 'ERROR', 'CRITICAL']);
  const validPlatforms = new Set(['ios', 'android', 'backend', 'frontend']);

  for (const template of Object.values(skillsCompilerTemplates)) {
    assert.ok(template.rules.length > 0);
    for (const rule of template.rules) {
      assert.equal(rule.locked, true);
      assert.equal(validSeverities.has(rule.severity), true);
      assert.equal(validPlatforms.has(rule.platform), true);
    }
  }
});

test('skillsCompilerTemplates usa stages válidos solo cuando están definidos', () => {
  const validStages = new Set(['PRE_COMMIT', 'PRE_PUSH', 'CI']);

  for (const template of Object.values(skillsCompilerTemplates)) {
    for (const rule of template.rules) {
      if (typeof rule.stage === 'undefined') {
        continue;
      }
      assert.equal(validStages.has(rule.stage), true);
    }
  }
});

test('skillsCompilerTemplates mantiene bundles iOS enterprise esperados', () => {
  const requiredIosBundles = [
    'ios-guidelines',
    'ios-concurrency-guidelines',
    'ios-core-data-guidelines',
    'ios-swift-testing-guidelines',
    'ios-swiftui-expert-guidelines',
  ];

  for (const bundleName of requiredIosBundles) {
    const bundle = skillsCompilerTemplates[bundleName];
    assert.ok(bundle, `Missing iOS bundle: ${bundleName}`);
    assert.equal(bundle.rules.length > 0, true);
    assert.equal(bundle.rules.every((rule) => rule.platform === 'ios'), true);
  }
});

test('skillsCompilerTemplates mantiene el bundle Android baseline esperado', () => {
  const bundle = skillsCompilerTemplates['android-guidelines'];
  assert.ok(bundle, 'Missing Android bundle: android-guidelines');
  assert.deepEqual(bundle.rules.map((rule) => rule.id), [
    'skills.android.no-thread-sleep',
    'skills.android.no-globalscope',
    'skills.android.no-console-log',
    'skills.android.guideline.android.timber-logging-library',
    'skills.android.guideline.android.analytics-firebase-analytics-o-custom',
    'skills.android.guideline.android.android-profiler-cpu-memory-network-profiling',
    'skills.android.guideline.android.touch-targets-mi-nimo-48dp',
    'skills.android.guideline.android.buildconfig-constantes-en-tiempo-de-compilacio-n',
    'skills.android.hardcoded-strings-usar-strings-xml',
    'skills.android.guideline.android.localization-strings-xml-por-idioma-values-es-values-en',
    'skills.android.guideline.android.plurals-values-plurals-xml',
    'skills.android.no-singleton-usar-inyeccio-n-de-dependencias-hilt-dagger',
    'skills.android.guideline.android.hilt-com-google-dagger-hilt-android',
    'skills.android.guideline.android.hilt-di-framework-no-manual-factories',
    'skills.android.guideline.android.hiltandroidapp-application-class',
    'skills.android.guideline.android.androidentrypoint-activity-fragment-viewmodel',
    'skills.android.guideline.android.viewmodel-androidx-lifecycle-viewmodel',
    'skills.android.guideline.android.viewmodel-sobrevive-configuration-changes',
    'skills.android.guideline.android.inject-constructor-constructor-injection',
    'skills.android.guideline.android.module-installin-provide-dependencies',
    'skills.android.guideline.android.binds-para-implementaciones-de-interfaces-ma-s-eficiente',
    'skills.android.guideline.android.provides-para-interfaces-o-third-party',
    'skills.android.guideline.android.workmanager-androidx-work-work-runtime-ktx',
    'skills.android.guideline.android.version-catalogs-libs-versions-toml-para-dependencias',
    'skills.android.guideline.android.workmanager-background-tasks',
    'skills.android.guideline.android.androidtest-instrumented-tests-device-emulator',
    'skills.android.guideline.android.aaa-pattern-arrange-act-assert',
    'skills.android.guideline.android.given-when-then-bdd-style',
    'skills.android.guideline.android.test-unit-tests-jvm',
    'skills.android.guideline.android.viewmodelscope-scope-de-viewmodel-cancelado-automa-ticamente',
    'skills.android.guideline.android.viewmodelscoped-para-dependencias-de-viewmodel',
    'skills.android.guideline.android.composable-functions-composable-para-ui',
    'skills.android.guideline.android.arguments-pasar-datos-entre-pantallas',
    'skills.android.guideline.android.adaptive-layouts-responsive-design-windowsizeclass',
    'skills.android.guideline.android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle',
    'skills.android.guideline.android.theme-color-scheme-typography-shapes',
    'skills.android.guideline.android.dark-theme-soportar-desde-di-a-1-issystemindarktheme',
    'skills.android.guideline.android.accessibility-semantics-contentdescription',
    'skills.android.guideline.android.contentdescription-para-ima-genes-y-botones',
    'skills.android.guideline.android.talkback-screen-reader-de-android',
    'skills.android.guideline.android.text-scaling-soportar-font-scaling-del-sistema',
    'skills.android.guideline.android.god-activities-single-activity-composables',
    'skills.android.guideline.android.single-activity-mu-ltiples-composables-fragments-no-activities',
    'skills.android.no-runblocking',
    'skills.android.guideline.android.coroutines-async-await-no-callbacks',
    'skills.android.guideline.android.async-await-paralelismo',
    'skills.android.guideline.android.supervisorscope-errores-no-cancelan-otros-jobs',
    'skills.android.guideline.android.suspend-functions-en-api-service',
    'skills.android.guideline.android.suspend-functions-para-operaciones-async',
    'skills.android.guideline.android.dao-data-access-objects-con-suspend-functions',
    'skills.android.guideline.android.transaction-para-operaciones-multi-query',
    'skills.android.guideline.android.stateflow-estado-mutable-observable',
    'skills.android.guideline.android.sharedflow-hot-stream-puede-no-tener-valor-para-eventos',
    'skills.android.guideline.android.flow-builders-flow-emit-flowof-asflow',
    'skills.android.guideline.android.collect-terminal-operator-para-consumir-flow',
    'skills.android.guideline.android.collect-as-state-consumir-flow-en-compose',
    'skills.android.guideline.android.remember-evitar-recrear-objetos',
    'skills.android.guideline.android.remember-para-mantener-estado-entre-recomposiciones',
    'skills.android.guideline.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input',
    'skills.android.guideline.android.derivedstateof-ca-lculos-derivados-de-state',
    'skills.android.guideline.android.launchedeffect-side-effects-con-lifecycle',
    'skills.android.guideline.android.launchedeffect-keys-controlar-cuando-se-relanza-effect',
    'skills.android.guideline.android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n',
    'skills.android.guideline.android.preview-preview-para-ver-ui-sin-correr-app',
    'skills.android.guideline.android.recomposition-composables-deben-ser-idempotentes',
    'skills.android.guideline.android.uistate-sealed-class-loading-success-error-states',
    'skills.android.guideline.android.use-cases-lo-gica-de-negocio-encapsulada',
    'skills.android.guideline.android.repository-pattern-abstraer-acceso-a-datos',
    'skills.android.guideline.android.repository-pattern-ordersrep',
    'skills.android.guideline.android.app-startup-androidx-startup-para-lazy-init',
    'skills.android.guideline.android.baseline-profiles-optimizacio-n-de-startup',
    'skills.android.guideline.android.single-source-of-truth-viewmodel-es-la-fuente',
    'skills.android.guideline.android.skip-recomposition-para-metros-inmutables-o-estables',
    'skills.android.guideline.android.stability-composables-estables-recomponen-menos',
    'skills.android.guideline.android.string-formatting-1-s-2-d-para-argumentos',
    'skills.android.guideline.android.state-hoisting-elevar-estado-al-nivel-apropiado',
  ]);
  assert.equal(bundle.rules.every((rule) => rule.platform === 'android'), true);
});

test('skillsCompilerTemplates mantiene los bundles backend y frontend esperados', () => {
  const backendBundle = skillsCompilerTemplates['backend-guidelines'];
  assert.ok(backendBundle, 'Missing backend bundle: backend-guidelines');
  assert.deepEqual(backendBundle.rules.map((rule) => rule.id), [
    'skills.backend.no-empty-catch',
    'skills.backend.no-console-log',
    'skills.backend.no-loggear-datos-sensibles-passwords-tokens-pii',
    'skills.backend.guideline.backend.winston-logger-estructurado-json-logs',
    'skills.backend.guideline.backend.loggear-errores-con-contexto-completo',
    'skills.backend.guideline.backend.correlation-ids-para-tracing-distribuido',
    'skills.backend.guideline.backend.me-tricas-prometheus-prom-client-para-me-tricas',
    'skills.backend.password-hashing-bcrypt-con-salt-rounds-10',
    'skills.backend.guideline.backend.rate-limiting-nestjs-throttler-para-prevenir-brute-force',
    'skills.backend.guideline.backend.rate-limiting-throttler-para-prevenir-abuse',
    'skills.backend.guideline.backend.cors-configurado-solo-ori-genes-permitidos',
    'skills.backend.guideline.backend.cors-configurar-ori-genes-permitidos',
    'skills.backend.guideline.backend.pipes-para-validacio-n-global-validationpipe-en-main-ts',
    'skills.backend.guideline.backend.validationpipe-global-en-main-ts-con-whitelist-true',
    'skills.backend.guideline.backend.versionado-api-v1-api-v2',
    'skills.backend.guideline.backend.validation-de-config-joi-o-class-validator-para-env',
    'skills.backend.guideline.backend.class-validator-decorators-isstring-isemail-min-max',
    'skills.backend.guideline.backend.class-transformer-transform-exclude-expose',
    'skills.backend.guideline.backend.input-validation-siempre-validar-con-dtos',
    'skills.backend.guideline.backend.nested-validation-validatenested-type',
    'skills.backend.guideline.backend.dtos-en-boundaries-validacio-n-en-entrada-salida',
    'skills.backend.guideline.backend.dtos-separados-createorderdto-updateorderdto-orderresponsedto',
    'skills.backend.guideline.backend.retornar-dtos-no-exponer-entidades-directamente',
    'skills.backend.guideline.backend.transacciones-para-operaciones-cri-ticas',
    'skills.backend.guideline.backend.transacciones-para-operaciones-multi-tabla',
    'skills.backend.mocks-en-produccio-n-solo-datos-reales',
    'skills.backend.exception-filters-catch-para-manejo-global',
    'skills.backend.guards-para-autenticacio-n-autorizacio-n-useguards-jwtauthguard',
    'skills.backend.interceptors-para-logging-transformacio-n-no-en-cada-endpoint',
    'skills.backend.avoid-explicit-any',
    'skills.backend.no-solid-violations',
    'skills.backend.enforce-clean-architecture',
    'skills.backend.no-singleton',
    'skills.backend.magic-numbers-usar-constantes-con-nombres-descriptivos',
    'skills.backend.hardcoded-values-config-en-variables-de-entorno',
    'skills.backend.no-defaults-en-produccio-n-fallar-si-falta-config-cri-tica',
    'skills.backend.callback-hell-usar-async-await',
    'skills.backend.no-god-classes',
  ]);
  assert.equal(backendBundle.rules.every((rule) => rule.platform === 'backend'), true);

  const frontendBundle = skillsCompilerTemplates['frontend-guidelines'];
  assert.ok(frontendBundle, 'Missing frontend bundle: frontend-guidelines');
  assert.deepEqual(frontendBundle.rules.map((rule) => rule.id), [
    'skills.frontend.no-console-log',
    'skills.frontend.no-empty-catch',
    'skills.frontend.avoid-explicit-any',
    'skills.frontend.no-solid-violations',
    'skills.frontend.enforce-clean-architecture',
    'skills.frontend.no-singleton',
    'skills.frontend.callback-hell-usar-async-await',
    'skills.frontend.no-class-components',
    'skills.frontend.no-god-classes',
  ]);
  assert.equal(frontendBundle.rules.every((rule) => rule.platform === 'frontend'), true);
});
