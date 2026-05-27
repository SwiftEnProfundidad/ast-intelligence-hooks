import assert from 'node:assert/strict';
import test from 'node:test';
import { classifySkillsRules } from '../skillsRuleClassification';
import type { SkillsLockV1 } from '../skillsLock';

const buildLock = (rules: SkillsLockV1['bundles'][number]['rules']): SkillsLockV1 => ({
  version: '1.0',
  compilerVersion: '1.0.0',
  generatedAt: '2026-05-16T00:00:00.000Z',
  bundles: [
    {
      name: 'test-guidelines',
      version: '1.0.0',
      source: 'file:test',
      hash: 'a'.repeat(64),
      rules,
    },
  ],
});

test('classifySkillsRules separa AST, detector pendiente, estudio y no codigo', () => {
  const summary = classifySkillsRules(buildLock([
    {
      id: 'skills.ios.no-force-try',
      description: 'No force try',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-guidelines',
      sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
      confidence: 'HIGH',
      locked: true,
      evaluationMode: 'AUTO',
      origin: 'core',
    },
    {
      id: 'skills.backend.no-custom-rule-yet',
      description: 'No custom rule yet',
      severity: 'WARN',
      platform: 'backend',
      sourceSkill: 'backend-guidelines',
      sourcePath: 'vendor/skills/backend-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'AUTO',
      origin: 'core',
    },
    {
      id: 'skills.frontend.guideline.frontend.no-god-components',
      description: 'No god components',
      severity: 'WARN',
      platform: 'frontend',
      sourceSkill: 'frontend-guidelines',
      sourcePath: 'vendor/skills/frontend-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.android.guideline.android.color-contrast-wcag-aa-mi-nimo',
      description: 'Color contrast WCAG AA mínimo',
      severity: 'WARN',
      platform: 'android',
      sourceSkill: 'android-guidelines',
      sourcePath: 'vendor/skills/android-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.frontend.guideline.frontend.naming-clear-domain-language',
      description: 'Use clear domain language in names',
      severity: 'WARN',
      platform: 'frontend',
      sourceSkill: 'frontend-guidelines',
      sourcePath: 'vendor/skills/frontend-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.android.guideline.android.actu-a-como-un-arquitecto-de-soluciones-y-software-designer',
      description: 'Actúa como un Arquitecto de Soluciones y Software Designer',
      severity: 'WARN',
      platform: 'android',
      sourceSkill: 'android-guidelines',
      sourcePath: 'vendor/skills/android-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
  ]));

  assert.equal(summary.total, 6);
  assert.deepEqual(summary.byStatus, {
    AST_IMPLEMENTED: 1,
    IMPLEMENTAR_DETECTOR: 2,
    REQUIERE_ESTUDIO: 2,
    NO_ES_REGLA_DE_CODIGO: 1,
  });
  assert.equal(
    summary.rules.find((rule) => rule.ruleId === 'skills.ios.no-force-try')?.status,
    'AST_IMPLEMENTED'
  );
  assert.equal(
    summary.rules.find((rule) => rule.ruleId === 'skills.backend.no-custom-rule-yet')?.status,
    'IMPLEMENTAR_DETECTOR'
  );
  assert.equal(
    summary.rules.find((rule) => rule.ruleId === 'skills.frontend.guideline.frontend.no-god-components')?.status,
    'IMPLEMENTAR_DETECTOR'
  );
  assert.equal(
    summary.rules.find((rule) => rule.ruleId === 'skills.frontend.guideline.frontend.naming-clear-domain-language')?.status,
    'REQUIERE_ESTUDIO'
  );
  assert.equal(
    summary.rules.find((rule) => rule.ruleId.includes('color-contrast'))?.status,
    'REQUIERE_ESTUDIO'
  );
  assert.equal(
    summary.rules.find((rule) => rule.ruleId.includes('actu-a-como'))?.status,
    'NO_ES_REGLA_DE_CODIGO'
  );
});

test('classifySkillsRules no exige detector AST para reglas iOS de proceso y validacion operativa', () => {
  const summary = classifySkillsRules(buildLock([
    {
      id: 'skills.ios.guideline.ios.coverage-80-objetivo-95-en-lo-gica-cri-tica',
      description: 'Coverage 80%, objetivo 95% en lógica crítica',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-guidelines',
      sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.ios.guideline.ios.fast-tests-10ms-unitarios',
      description: 'Fast tests <10ms unitarios',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-guidelines',
      sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.ios.guideline.ios.instruments-time-profiler-allocations-leaks',
      description: 'Instruments Time Profiler, Allocations, Leaks',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-guidelines',
      sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.ios.guideline.ios.testflight-beta-distribution',
      description: 'TestFlight beta distribution',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-guidelines',
      sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.ios.guideline.ios.fastlane-automatizacio-n-de-builds-tests-deployments',
      description: 'Fastlane automatización de builds, tests y deployments',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-guidelines',
      sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.ios.guideline.ios-concurrency.use-grep-for-swiftupcomingfeature-to-find-enabled-upcoming-features',
      description: 'Use grep for SWIFT_UPCOMING_FEATURE to find enabled upcoming features',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-concurrency-guidelines',
      sourcePath: 'vendor/skills/swift-concurrency/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.ios.guideline.ios-concurrency.then-use-references-sendable-md-and-references-threading-md-especially',
      description: 'Then use references/sendable.md and references/threading.md especially',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-concurrency-guidelines',
      sourcePath: 'vendor/skills/swift-concurrency/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.ios.guideline.ios-concurrency.async-sequences-md-asyncsequence-asyncstream-when-to-use-vs-regular-as',
      description: 'async-sequences.md AsyncSequence AsyncStream when to use vs regular async sequences',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-concurrency-guidelines',
      sourcePath: 'vendor/skills/swift-concurrency/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.ios.guideline.ios.xcode-usar-la-u-ltima-versio-n-estable-disponible',
      description: 'Xcode usar la última versión estable disponible',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-guidelines',
      sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.ios.guideline.ios.xcodebuild-cli-para-builds',
      description: 'xcodebuild CLI para builds',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-guidelines',
      sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.ios.guideline.ios.voiceover-testear-con-screen-reader',
      description: 'VoiceOver testear con screen reader',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-guidelines',
      sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
  ]));

  assert.equal(summary.total, 11);
  assert.deepEqual(summary.byStatus, {
    AST_IMPLEMENTED: 0,
    IMPLEMENTAR_DETECTOR: 0,
    REQUIERE_ESTUDIO: 0,
    NO_ES_REGLA_DE_CODIGO: 11,
  });
  assert.deepEqual(
    summary.rules.map((rule) => rule.status),
    [
      'NO_ES_REGLA_DE_CODIGO',
      'NO_ES_REGLA_DE_CODIGO',
      'NO_ES_REGLA_DE_CODIGO',
      'NO_ES_REGLA_DE_CODIGO',
      'NO_ES_REGLA_DE_CODIGO',
      'NO_ES_REGLA_DE_CODIGO',
      'NO_ES_REGLA_DE_CODIGO',
      'NO_ES_REGLA_DE_CODIGO',
      'NO_ES_REGLA_DE_CODIGO',
      'NO_ES_REGLA_DE_CODIGO',
      'NO_ES_REGLA_DE_CODIGO',
    ]
  );
});

test('classifySkillsRules mantiene reglas iOS code-like en estudio en vez de cerrarlas como no codigo', () => {
  const summary = classifySkillsRules(buildLock([
    {
      id: 'skills.ios.guideline.ios.asyncsequence-y-asyncstream-para-flujos-de-datos',
      description: 'AsyncSequence y AsyncStream para flujos de datos',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-guidelines',
      sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.ios.guideline.ios.if-let-para-unwrap-opcional-usado-una-vez',
      description: 'if-let para unwrap opcional usado una vez',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-guidelines',
      sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.ios.guideline.ios.viewthatfits-para-layouts-adaptativos',
      description: 'ViewThatFits para layouts adaptativos',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-guidelines',
      sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
  ]));

  assert.deepEqual(
    summary.rules.map((rule) => [rule.ruleId, rule.status]),
    [
      ['skills.ios.guideline.ios.asyncsequence-y-asyncstream-para-flujos-de-datos', 'NO_ES_REGLA_DE_CODIGO'],
      ['skills.ios.guideline.ios.if-let-para-unwrap-opcional-usado-una-vez', 'NO_ES_REGLA_DE_CODIGO'],
      ['skills.ios.guideline.ios.viewthatfits-para-layouts-adaptativos', 'NO_ES_REGLA_DE_CODIGO'],
    ]
  );
});

test('classifySkillsRules no exige detector AST para reglas Android de proceso y validacion operativa', () => {
  const summary = classifySkillsRules(buildLock([
    {
      id: 'skills.android.guideline.android.aaa-pattern-arrange-act-assert',
      description: 'AAA pattern Arrange Act Assert',
      severity: 'WARN',
      platform: 'android',
      sourceSkill: 'android-guidelines',
      sourcePath: 'vendor/skills/android-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.android.guideline.android.androidtest-instrumented-tests-device-emulator',
      description: 'androidTest instrumented tests device emulator',
      severity: 'WARN',
      platform: 'android',
      sourceSkill: 'android-guidelines',
      sourcePath: 'vendor/skills/android-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.android.guideline.android.baseline-profiles-optimizacio-n-de-startup',
      description: 'Baseline Profiles optimizacion de startup',
      severity: 'WARN',
      platform: 'android',
      sourceSkill: 'android-guidelines',
      sourcePath: 'vendor/skills/android-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
  ]));

  assert.equal(summary.total, 3);
  assert.deepEqual(summary.byStatus, {
    AST_IMPLEMENTED: 0,
    IMPLEMENTAR_DETECTOR: 0,
    REQUIERE_ESTUDIO: 0,
    NO_ES_REGLA_DE_CODIGO: 3,
  });
});

test('classifySkillsRules no degrada reglas Android de leaks de codigo a proceso operativo', () => {
  const summary = classifySkillsRules(buildLock([
    {
      id: 'skills.android.guideline.android.context-leaks-no-referencias-a-activity-en-objetos-long-lived',
      description: 'Context leaks no referencias a Activity en objetos long lived',
      severity: 'WARN',
      platform: 'android',
      sourceSkill: 'android-guidelines',
      sourcePath: 'vendor/skills/android-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.android.guideline.android.leakcanary-deteccio-n-de-memory-leaks',
      description: 'LeakCanary deteccion de memory leaks',
      severity: 'WARN',
      platform: 'android',
      sourceSkill: 'android-guidelines',
      sourcePath: 'vendor/skills/android-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
  ]));

  assert.equal(
    summary.rules.find((rule) => rule.ruleId.includes('context-leaks'))?.status,
    'REQUIERE_ESTUDIO'
  );
  assert.equal(
    summary.rules.find((rule) => rule.ruleId.includes('leakcanary'))?.status,
    'NO_ES_REGLA_DE_CODIGO'
  );
});

test('classifySkillsRules no exige detector AST para reglas Android de CI y pipelines', () => {
  const summary = classifySkillsRules(buildLock([
    {
      id: 'skills.android.guideline.android.github-actions-gitlab-ci-pipelines',
      description: 'GitHub Actions / GitLab CI pipelines',
      severity: 'WARN',
      platform: 'android',
      sourceSkill: 'android-guidelines',
      sourcePath: 'vendor/skills/android-enterprise-rules/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
  ]));

  assert.equal(summary.byStatus.NO_ES_REGLA_DE_CODIGO, 1);
  assert.equal(summary.byStatus.REQUIERE_ESTUDIO, 0);
});

test('classifySkillsRules no exige detector runtime para reglas iOS de arquitectura de proyecto', () => {
  const rules = [
    'skills.ios.guideline.ios.measure-twice-cut-once-planificar-arquitectura-dependencias-y-flujo-de',
    'skills.ios.guideline.ios.spm-swift-package-manager-para-modularizacio-n-interna',
    'skills.ios.guideline.ios.local-packages-para-features-grandes',
    'skills.ios.guideline.ios.feature-modules-orders-users-auth-como-packages',
    'skills.ios.guideline.ios.un-target-por-plataforma-cuando-sea-necesario',
    'skills.ios.guideline.ios.testability-cada-package-con-sus-tests',
  ];

  const summary = classifySkillsRules(buildLock(rules.map((id) => ({
    id,
    description: id,
    severity: 'WARN',
    platform: 'ios',
    sourceSkill: 'ios-guidelines',
    sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
    confidence: 'MEDIUM',
    locked: true,
    evaluationMode: 'DECLARATIVE',
    origin: 'core',
  }))));

  assert.equal(summary.total, rules.length);
  assert.equal(summary.byStatus.NO_ES_REGLA_DE_CODIGO, rules.length);
  assert.equal(summary.byStatus.REQUIERE_ESTUDIO, 0);
  assert.deepEqual(
    summary.rules.map((rule) => rule.status),
    rules.map(() => 'NO_ES_REGLA_DE_CODIGO')
  );
});

test('classifySkillsRules no exige detector runtime para capacidades iOS opcionales o de integracion', () => {
  const rules = [
    'skills.ios.guideline.ios.biometric-auth-face-id-touch-id-localauthentication',
    'skills.ios.guideline.ios.compartir-dtos-con-backend-typescript-swift-codegen-quicktype-openapi',
    'skills.ios.guideline.ios.filemanager-archivos-ima-genes-documents',
    'skills.ios.guideline.ios.icloud-sync-entre-dispositivos-nsubiquitouskeyvaluestore-cloudkit',
    'skills.ios.guideline.ios.jailbreak-detection-opcional-para-apps-cri-ticas',
    'skills.ios.guideline.ios.network-reachability-detectar-conectividad',
    'skills.ios.guideline.ios.offline-first-opcional-sync-con-swiftdata',
    'skills.ios.guideline.ios.retry-logic-para-requests-fallidos',
    'skills.ios.guideline.ios.secure-enclave-para-keys-criptogra-ficas',
  ];

  const summary = classifySkillsRules(buildLock(rules.map((id) => ({
    id,
    description: id,
    severity: 'WARN',
    platform: 'ios',
    sourceSkill: 'ios-guidelines',
    sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
    confidence: 'MEDIUM',
    locked: true,
    evaluationMode: 'DECLARATIVE',
    origin: 'core',
  }))));

  assert.equal(summary.total, rules.length);
  assert.equal(summary.byStatus.NO_ES_REGLA_DE_CODIGO, rules.length);
  assert.equal(summary.byStatus.REQUIERE_ESTUDIO, 0);
  assert.deepEqual(
    summary.rules.map((rule) => rule.status),
    rules.map(() => 'NO_ES_REGLA_DE_CODIGO')
  );
});

test('classifySkillsRules audita recomendaciones positivas de lenguaje iOS sin violacion por ausencia', () => {
  const rules = [
    'skills.ios.guideline.ios.asyncsequence-y-asyncstream-para-flujos-de-datos',
    'skills.ios.guideline.ios.copy-on-write-para-structs-grandes-array-dictionary-ya-lo-hacen',
    'skills.ios.guideline.ios.equatable-hashable-implementar-para-comparacio-n-y-colecciones',
    'skills.ios.guideline.ios.nil-coalescing-valores-por-defecto',
    'skills.ios.guideline.ios.numberformatter-formateo-de-nu-meros-monedas',
    'skills.ios.guideline.ios.operators-map-filter-flatmap-combinelatest-merge',
    'skills.ios.guideline.ios.optional-chaining-cadenas-de-opcionales',
    'skills.ios.guideline.ios.result-builders-para-dsls-swiftui-ya-lo-usa',
    'skills.ios.guideline.ios.publishers-asyncsequence-para-async-combine-para-streams-complejos',
  ];

  const summary = classifySkillsRules(buildLock(rules.map((id) => ({
    id,
    description: id,
    severity: 'WARN',
    platform: 'ios',
    sourceSkill: 'ios-guidelines',
    sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
    confidence: 'MEDIUM',
    locked: true,
    evaluationMode: 'DECLARATIVE',
    origin: 'core',
  }))));

  assert.equal(summary.total, rules.length);
  assert.equal(summary.byStatus.NO_ES_REGLA_DE_CODIGO, rules.length);
  assert.equal(summary.byStatus.REQUIERE_ESTUDIO, 0);
  assert.deepEqual(
    summary.rules.map((rule) => rule.status),
    rules.map(() => 'NO_ES_REGLA_DE_CODIGO')
  );
});

test('classifySkillsRules mantiene recomendaciones iOS code-like de arquitectura y estilo en estudio', () => {
  const rules = [
    'skills.ios.guideline.ios-swift-testing.keep-tests-isolated-expressive-and-aligned-with-swift-concurrency',
    'skills.ios.guideline.ios-swiftui-expert.use-native-glasseffect-glasseffectcontainer-and-glass-button-styles',
    'skills.ios.guideline.ios.custom-view-modifiers-reutilizar-estilos',
    'skills.ios.guideline.ios.declarativo-describe-el-ui-no-co-mo-construirlo',
    'skills.ios.guideline.ios.equatable-views-para-optimizar-renders',
    'skills.ios.guideline.ios.extensions-agrupar-por-funcionalidad-archivos-separados',
    'skills.ios.guideline.ios.factory-pattern-para-crear-dependencias-complejas',
    'skills.ios.guideline.ios.if-let-para-unwrap-opcional-usado-una-vez',
    'skills.ios.guideline.ios.inmutabilidad-let-var-siempre-que-sea-posible',
    'skills.ios.guideline.ios.mark-organizar-co-digo-dentro-de-archivos',
    'skills.ios.guideline.ios.memoization-cachear-ca-lculos-costosos',
    'skills.ios.guideline.ios.mvvm-model-view-viewmodel-binding-con-combine',
    'skills.ios.guideline.ios.mvvm-model-view-viewmodel-preferido-con-swiftui',
    'skills.ios.guideline.ios.page-object-pattern-encapsular-lo-gica-de-ui-en-objetos',
    'skills.ios.guideline.ios.preferencekeys-para-comunicacio-n-child-parent',
    'skills.ios.guideline.ios.preferences-comunicacio-n-child-parent',
    'skills.ios.guideline.ios.protocol-extensions-default-implementations',
    'skills.ios.guideline.ios.protocols-over-inheritance-composicio-n-de-comportamiento',
    'skills.ios.guideline.ios.published-en-viewmodels-para-binding-con-views',
    'skills.ios.guideline.ios.struct-por-defecto-class-solo-cuando-necesites-identity-o-herencia',
    'skills.ios.guideline.ios.use-cases-createorderusecase-updateorderstatususecase',
    'skills.ios.guideline.ios.viewmodels-por-pantalla-orderslistviewmodel-orderdetailviewmodel',
    'skills.ios.guideline.ios.viewmodifiers-nativos-primero-antes-de-crear-custom-viewmodifiers',
    'skills.ios.guideline.ios.viewthatfits-para-layouts-adaptativos',
    'skills.ios.guideline.ios.viper-solo-si-el-equipo-lo-conoce-bien-overkill-para-apps-pequen-as',
  ];

  const summary = classifySkillsRules(buildLock(rules.map((id) => ({
    id,
    description: id,
    severity: 'WARN',
    platform: 'ios',
    sourceSkill: 'ios-guidelines',
    sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
    confidence: 'MEDIUM',
    locked: true,
    evaluationMode: 'DECLARATIVE',
    origin: 'core',
  }))));

  assert.equal(summary.total, rules.length);
  assert.equal(summary.byStatus.NO_ES_REGLA_DE_CODIGO, rules.length);
  assert.equal(summary.byStatus.REQUIERE_ESTUDIO, 0);
  assert.deepEqual(
    summary.rules.map((rule) => rule.status),
    rules.map(() => 'NO_ES_REGLA_DE_CODIGO')
  );
});

test('classifySkillsRules no exige detector runtime para verificacion lifecycle de deinit', () => {
  const rules = [
    'skills.ios.guideline.ios.deinit-verificar-que-se-llama-cuando-debiera',
  ];

  const summary = classifySkillsRules(buildLock(rules.map((id) => ({
    id,
    description: id,
    severity: 'WARN',
    platform: 'ios',
    sourceSkill: 'ios-guidelines',
    sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
    confidence: 'MEDIUM',
    locked: true,
    evaluationMode: 'DECLARATIVE',
    origin: 'core',
  }))));

  assert.equal(summary.total, rules.length);
  assert.equal(summary.byStatus.NO_ES_REGLA_DE_CODIGO, rules.length);
  assert.equal(summary.byStatus.REQUIERE_ESTUDIO, 0);
});

test('classifySkillsRules no exige detector runtime para setup Android de proyecto e integraciones', () => {
  const rules = [
    'skills.android.guideline.android.analytics-firebase-analytics-o-custom',
    'skills.android.guideline.android.app-module-composicio-n-final',
    'skills.android.guideline.android.build-types-debug-release-staging',
    'skills.android.guideline.android.build-variants-combinacio-n-de-build-type-flavor',
    'skills.android.guideline.android.buildconfig-constantes-en-tiempo-de-compilacio-n',
    'skills.android.guideline.android.buildsrc-para-lo-gica-compartida-de-build',
    'skills.android.guideline.android.core-modules-core-network-core-database-core-ui',
    'skills.android.guideline.android.compose-bom-androidx-compose-compose-bom',
    'skills.android.guideline.android.crashlytics-firebase-para-crash-reporting',
    'skills.android.guideline.android.database-database-class-abstracta',
  ];

  const summary = classifySkillsRules(buildLock(rules.map((id) => ({
    id,
    description: id,
    severity: 'WARN',
    platform: 'android',
    sourceSkill: 'android-guidelines',
    sourcePath: 'vendor/skills/android-enterprise-rules/SKILL.md',
    confidence: 'MEDIUM',
    locked: true,
    evaluationMode: 'DECLARATIVE',
    origin: 'core',
  }))));

  assert.equal(summary.total, rules.length);
  assert.equal(summary.byStatus.NO_ES_REGLA_DE_CODIGO, rules.length);
  assert.equal(summary.byStatus.REQUIERE_ESTUDIO, 0);
});

test('classifySkillsRules trata instrucciones meta iOS con detector como no runtime', () => {
  const summary = classifySkillsRules(buildLock([
    {
      id: 'skills.ios.guideline.ios-concurrency.use-grep-for-swiftstrictconcurrency-or-swiftdefaultactorisolation-in-p',
      description: 'Use grep for SwiftStrictConcurrency or SwiftDefaultActorIsolation in project settings',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-concurrency-guidelines',
      sourcePath: 'vendor/skills/swift-concurrency/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.ios.guideline.ios-concurrency.use-read-on-package-swift-for-swiftpm-settings-tools-version-strict-co',
      description: 'Use read on Package.swift for SwiftPM settings, tools version and strict concurrency',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-concurrency-guidelines',
      sourcePath: 'vendor/skills/swift-concurrency/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.ios.guideline.ios-concurrency.use-references-linting-md-for-rule-intent-and-preferred-fixes-avoid-du',
      description: 'Use references/linting.md for rule intent and preferred fixes',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-concurrency-guidelines',
      sourcePath: 'vendor/skills/swift-concurrency/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
    {
      id: 'skills.ios.guideline.ios-concurrency.use-references-threading-md-to-avoid-thread-centric-debugging-and-rely',
      description: 'Use references/threading.md to avoid thread-centric debugging and rely on structured concurrency',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-concurrency-guidelines',
      sourcePath: 'vendor/skills/swift-concurrency/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
  ]));

  assert.equal(summary.total, 4);
  assert.deepEqual(summary.byStatus, {
    AST_IMPLEMENTED: 0,
    IMPLEMENTAR_DETECTOR: 0,
    REQUIERE_ESTUDIO: 0,
    NO_ES_REGLA_DE_CODIGO: 4,
  });
});

test('classifySkillsRules trata referencias documentales SwiftUI como no runtime aunque tengan detector', () => {
  const summary = classifySkillsRules(buildLock([
    {
      id: 'skills.ios.guideline.ios-swiftui-expert.references-state-management-md-property-wrappers-and-data-flow-prefer-',
      description: 'References state-management.md property wrappers and data flow preferences',
      severity: 'WARN',
      platform: 'ios',
      sourceSkill: 'ios-swiftui-expert-guidelines',
      sourcePath: 'vendor/skills/swiftui-expert-skill/SKILL.md',
      confidence: 'MEDIUM',
      locked: true,
      evaluationMode: 'DECLARATIVE',
      origin: 'core',
    },
  ]));

  assert.equal(summary.rules[0]?.status, 'NO_ES_REGLA_DE_CODIGO');
});
