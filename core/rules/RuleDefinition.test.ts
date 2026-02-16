import assert from 'node:assert/strict';
import test from 'node:test';
import type { RuleDefinition } from './RuleDefinition';

test('RuleDefinition conserva campos requeridos', () => {
  const rule: RuleDefinition = {
    id: 'rule.backend.console-log',
    description: 'Detecta console.log en backend',
    severity: 'WARN',
    when: {
      kind: 'FileContent',
      contains: ['console.log'],
    },
    then: {
      kind: 'Finding',
      message: 'console.log detectado',
      code: 'HEURISTICS_CONSOLE_LOG_AST',
    },
  };

  assert.equal(rule.id, 'rule.backend.console-log');
  assert.equal(rule.severity, 'WARN');
  assert.equal(rule.when.kind, 'FileContent');
  assert.equal(rule.then.kind, 'Finding');
});

test('RuleDefinition soporta campos opcionales de plataforma, stage, scope y confidence', () => {
  const rule: RuleDefinition = {
    id: 'rule.ios.force-unwrap',
    description: 'Detecta force unwrap en iOS',
    severity: 'ERROR',
    when: {
      kind: 'Heuristic',
      where: { code: 'HEURISTICS_IOS_FORCE_UNWRAP_AST' },
    },
    then: {
      kind: 'Finding',
      message: 'Force unwrap detectado',
    },
    locked: true,
    platform: 'ios',
    stage: 'PRE_PUSH',
    scope: {
      include: ['apps/ios/*'],
      exclude: ['apps/ios/Tests/*'],
    },
    confidence: 'HIGH',
  };

  assert.equal(rule.locked, true);
  assert.equal(rule.platform, 'ios');
  assert.equal(rule.stage, 'PRE_PUSH');
  assert.deepEqual(rule.scope?.include, ['apps/ios/*']);
  assert.equal(rule.confidence, 'HIGH');
});
