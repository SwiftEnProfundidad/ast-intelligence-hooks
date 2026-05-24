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
  ]));

  assert.equal(summary.total, 5);
  assert.deepEqual(summary.byStatus, {
    AST_IMPLEMENTED: 0,
    IMPLEMENTAR_DETECTOR: 0,
    REQUIERE_ESTUDIO: 0,
    NO_ES_REGLA_DE_CODIGO: 5,
  });
  assert.deepEqual(
    summary.rules.map((rule) => rule.status),
    [
      'NO_ES_REGLA_DE_CODIGO',
      'NO_ES_REGLA_DE_CODIGO',
      'NO_ES_REGLA_DE_CODIGO',
      'NO_ES_REGLA_DE_CODIGO',
      'NO_ES_REGLA_DE_CODIGO',
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
