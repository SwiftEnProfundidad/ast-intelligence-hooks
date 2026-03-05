import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import type { Finding } from '../../../core/gate/Finding';
import type { RuleSet } from '../../../core/rules/RuleSet';
import {
  evaluateAstIntelligenceDualValidation,
  resolveAstIntelligenceDualValidationMode,
} from '../astIntelligenceDualValidation';

const createSkillsRule = (params: {
  id: string;
  source: string;
  platform?: 'ios' | 'android' | 'backend' | 'frontend';
}): RuleSet[number] => ({
  id: params.id,
  description: params.id,
  severity: 'ERROR',
  platform: params.platform ?? 'backend',
  when: {
    kind: 'FileContent',
    regex: ['a^'],
  },
  then: {
    kind: 'Finding',
    message: params.id,
    source: params.source,
  },
});

test('resolveAstIntelligenceDualValidationMode normaliza alias soportados', () => {
  assert.equal(resolveAstIntelligenceDualValidationMode('strict'), 'strict');
  assert.equal(resolveAstIntelligenceDualValidationMode('enforce'), 'strict');
  assert.equal(resolveAstIntelligenceDualValidationMode('shadow'), 'shadow');
  assert.equal(resolveAstIntelligenceDualValidationMode('1'), 'shadow');
  assert.equal(resolveAstIntelligenceDualValidationMode('off'), 'off');
  assert.equal(resolveAstIntelligenceDualValidationMode('legacy'), 'off');
});

test('evaluateAstIntelligenceDualValidation devuelve mode=off por defecto sin finding', () => {
  const result = evaluateAstIntelligenceDualValidation({
    stage: 'PRE_COMMIT',
    skillsRules: [],
    facts: [],
    legacyFindings: [],
    mode: 'off',
  });

  assert.equal(result.mode, 'off');
  assert.equal(result.finding, undefined);
  assert.equal(result.summary.mapped_rules, 0);
  assert.equal(result.summary.divergences, 0);
});

test('evaluateAstIntelligenceDualValidation reporta mismatch en shadow sin bloquear', () => {
  const skillsRules: RuleSet = [
    createSkillsRule({
      id: 'skills.backend.no-console-log',
      source:
        'skills-ir:rule=skills.backend.no-console-log;ast_nodes=[heuristics.ts.console-log.ast]',
    }),
  ];
  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ts.console-log.ast',
      severity: 'WARN',
      code: 'HEURISTICS_TS_CONSOLE_LOG_AST',
      message: 'console.log detectado',
      filePath: 'apps/backend/src/service.ts',
      source: 'heuristics:ast',
    },
  ];

  const result = evaluateAstIntelligenceDualValidation({
    stage: 'PRE_PUSH',
    skillsRules,
    facts,
    legacyFindings: [],
    mode: 'shadow',
  });

  assert.equal(result.mode, 'shadow');
  assert.equal(result.summary.mapped_rules, 1);
  assert.equal(result.summary.ast_triggered, 1);
  assert.equal(result.summary.legacy_triggered, 0);
  assert.equal(result.summary.false_positives, 1);
  assert.equal(result.summary.false_negatives, 0);
  assert.equal(result.summary.divergences, 1);
  assert.deepEqual(result.summary.languages, ['typescript']);
  assert.equal(result.finding?.ruleId, 'governance.ast-intelligence.dual-validation.shadow');
  assert.equal(result.finding?.severity, 'INFO');
});

test('evaluateAstIntelligenceDualValidation bloquea en strict cuando hay divergencias', () => {
  const skillsRules: RuleSet = [
    createSkillsRule({
      id: 'skills.backend.no-console-log',
      source:
        'skills-ir:rule=skills.backend.no-console-log;ast_nodes=[heuristics.ts.console-log.ast]',
      platform: 'backend',
    }),
    createSkillsRule({
      id: 'skills.ios.no-force-unwrap',
      source:
        'skills-ir:rule=skills.ios.no-force-unwrap;ast_nodes=[heuristics.ios.force-unwrap.ast]',
      platform: 'ios',
    }),
  ];
  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ts.console-log.ast',
      severity: 'WARN',
      code: 'HEURISTICS_TS_CONSOLE_LOG_AST',
      message: 'console.log detectado',
      filePath: 'apps/backend/src/service.ts',
      source: 'heuristics:ast',
    },
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ios.force-unwrap.ast',
      severity: 'ERROR',
      code: 'HEURISTICS_IOS_FORCE_UNWRAP_AST',
      message: 'force unwrap detectado',
      filePath: 'apps/ios/App/Feature.swift',
      source: 'heuristics:ast',
    },
  ];
  const legacyFindings: ReadonlyArray<Finding> = [
    {
      ruleId: 'skills.ios.no-force-unwrap',
      severity: 'ERROR',
      code: 'SKILLS_IOS_NO_FORCE_UNWRAP',
      message: 'legacy finding',
      filePath: 'apps/ios/App/Feature.swift',
    },
  ];

  const result = evaluateAstIntelligenceDualValidation({
    stage: 'CI',
    skillsRules,
    facts,
    legacyFindings,
    mode: 'strict',
  });

  assert.equal(result.mode, 'strict');
  assert.equal(result.summary.mapped_rules, 2);
  assert.equal(result.summary.ast_triggered, 2);
  assert.equal(result.summary.legacy_triggered, 1);
  assert.equal(result.summary.false_positives, 1);
  assert.equal(result.summary.false_negatives, 0);
  assert.equal(result.summary.divergences, 1);
  assert.deepEqual(result.summary.languages, ['swift', 'typescript']);
  assert.equal(result.finding?.ruleId, 'governance.ast-intelligence.dual-validation.mismatch');
  assert.equal(result.finding?.severity, 'ERROR');
  assert.equal(result.finding?.code, 'AST_INTELLIGENCE_DUAL_VALIDATION_MISMATCH_HIGH');
});

test('evaluateAstIntelligenceDualValidation reporta cobertura multilenguaje incluyendo Kotlin', () => {
  const skillsRules: RuleSet = [
    createSkillsRule({
      id: 'skills.backend.no-console-log',
      source:
        'skills-ir:rule=skills.backend.no-console-log;ast_nodes=[heuristics.ts.console-log.ast]',
      platform: 'backend',
    }),
    createSkillsRule({
      id: 'skills.android.no-runblocking',
      source:
        'skills-ir:rule=skills.android.no-runblocking;ast_nodes=[heuristics.android.run-blocking.ast]',
      platform: 'android',
    }),
  ];

  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ts.console-log.ast',
      severity: 'WARN',
      code: 'HEURISTICS_TS_CONSOLE_LOG_AST',
      message: 'console.log detectado',
      filePath: 'apps/backend/src/service.ts',
      source: 'heuristics:ast',
    },
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.android.run-blocking.ast',
      severity: 'ERROR',
      code: 'HEURISTICS_ANDROID_RUN_BLOCKING_AST',
      message: 'runBlocking detectado',
      filePath: 'apps/android/app/src/main/java/com/example/MainViewModel.kt',
      source: 'heuristics:ast',
    },
  ];

  const legacyFindings: ReadonlyArray<Finding> = [
    {
      ruleId: 'skills.backend.no-console-log',
      severity: 'ERROR',
      code: 'SKILLS_BACKEND_NO_CONSOLE_LOG',
      message: 'legacy backend finding',
      filePath: 'apps/backend/src/service.ts',
    },
    {
      ruleId: 'skills.android.no-runblocking',
      severity: 'ERROR',
      code: 'SKILLS_ANDROID_NO_RUNBLOCKING',
      message: 'legacy android finding',
      filePath: 'apps/android/app/src/main/java/com/example/MainViewModel.kt',
    },
  ];

  const result = evaluateAstIntelligenceDualValidation({
    stage: 'CI',
    skillsRules,
    facts,
    legacyFindings,
    mode: 'shadow',
  });

  assert.equal(result.summary.mapped_rules, 2);
  assert.equal(result.summary.divergences, 0);
  assert.deepEqual(result.summary.languages, ['kotlin', 'typescript']);
  assert.equal(result.finding, undefined);
});
