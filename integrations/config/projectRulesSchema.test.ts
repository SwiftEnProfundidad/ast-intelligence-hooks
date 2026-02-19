import assert from 'node:assert/strict';
import test from 'node:test';
import { projectRulesConfigSchema } from './projectRulesSchema';

test('projectRulesConfigSchema acepta reglas válidas con condiciones recursivas', () => {
  const validConfig = {
    allowOverrideLocked: true,
    rules: [
      {
        id: 'ios.no-force-try',
        description: 'Bloquea force try en producción.',
        severity: 'ERROR',
        when: {
          kind: 'All',
          conditions: [
            {
              kind: 'FileChange',
              where: { pathPrefix: 'apps/ios/', changeType: 'modified' },
            },
            {
              kind: 'Not',
              condition: {
                kind: 'Heuristic',
                where: { ruleId: 'heuristics.ios.force-try.ast' },
              },
            },
          ],
        },
        then: { kind: 'Finding', message: 'No usar force try en iOS.' },
        locked: true,
        platform: 'ios',
        stage: 'PRE_PUSH',
        scope: {
          include: ['apps/ios/**/*.swift'],
          exclude: ['**/*.generated.swift'],
        },
        confidence: 'HIGH',
      },
    ],
  } as const;

  const parsed = projectRulesConfigSchema.safeParse(validConfig);
  assert.equal(parsed.success, true);
});

test('projectRulesConfigSchema rechaza severidades fuera del contrato', () => {
  const invalidConfig = {
    rules: [
      {
        id: 'rule.invalid.severity',
        description: 'Invalid severity test.',
        severity: 'CRITICAL',
        when: { kind: 'Dependency', where: { from: 'a', to: 'b' } },
        then: { kind: 'Finding', message: 'x' },
      },
    ],
  };

  const parsed = projectRulesConfigSchema.safeParse(invalidConfig);
  assert.equal(parsed.success, false);
});

test('projectRulesConfigSchema rechaza FileContent.contains no tipado como array', () => {
  const invalidConfig = {
    rules: [
      {
        id: 'rule.invalid.contains',
        description: 'Invalid contains test.',
        severity: 'WARN',
        when: { kind: 'FileContent', contains: 'console.log' },
        then: { kind: 'Finding', message: 'x' },
      },
    ],
  };

  const parsed = projectRulesConfigSchema.safeParse(invalidConfig);
  assert.equal(parsed.success, false);
});

test('projectRulesConfigSchema rechaza stage fuera del enum permitido', () => {
  const invalidConfig = {
    rules: [
      {
        id: 'rule.invalid.stage',
        description: 'Invalid stage test.',
        severity: 'WARN',
        when: { kind: 'FileChange', where: { pathPrefix: 'apps/' } },
        then: { kind: 'Finding', message: 'x' },
        stage: 'POST_MERGE',
      },
    ],
  };

  const parsed = projectRulesConfigSchema.safeParse(invalidConfig);
  assert.equal(parsed.success, false);
});

test('projectRulesConfigSchema rechaza platform fuera del enum permitido', () => {
  const invalidConfig = {
    rules: [
      {
        id: 'rule.invalid.platform',
        description: 'Invalid platform test.',
        severity: 'WARN',
        when: { kind: 'Dependency', where: { from: 'a', to: 'b' } },
        then: { kind: 'Finding', message: 'x' },
        platform: 'desktop',
      },
    ],
  };

  const parsed = projectRulesConfigSchema.safeParse(invalidConfig);
  assert.equal(parsed.success, false);
});

test('projectRulesConfigSchema acepta condición Any con anidación Not válida', () => {
  const validConfig = {
    rules: [
      {
        id: 'rule.valid.any.not',
        description: 'Valid Any + Not nesting.',
        severity: 'INFO',
        when: {
          kind: 'Any',
          conditions: [
            {
              kind: 'Heuristic',
              where: { code: 'TS_CONSOLE_LOG' },
            },
            {
              kind: 'Not',
              condition: {
                kind: 'Dependency',
                where: { from: 'apps/backend', to: 'apps/web' },
              },
            },
          ],
        },
        then: { kind: 'Finding', message: 'x' },
        platform: 'generic',
        stage: 'CI',
      },
    ],
  };

  const parsed = projectRulesConfigSchema.safeParse(validConfig);
  assert.equal(parsed.success, true);
});
