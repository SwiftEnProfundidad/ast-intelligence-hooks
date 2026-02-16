import assert from 'node:assert/strict';
import test from 'node:test';
import type { RuleSet } from './RuleSet';

test('RuleSet permite coleccion tipada de RuleDefinition', () => {
  const ruleSet: RuleSet = [
    {
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
    },
    {
      id: 'rule.security.jwt-ignore-exp',
      description: 'Detecta verify con ignoreExpiration',
      severity: 'ERROR',
      when: {
        kind: 'Heuristic',
        where: { code: 'HEURISTICS_JWT_VERIFY_IGNORE_EXPIRATION_AST' },
      },
      then: {
        kind: 'Finding',
        message: 'JWT verify con ignoreExpiration detectado',
      },
      stage: 'CI',
      confidence: 'HIGH',
    },
  ];

  assert.equal(ruleSet.length, 2);
  assert.equal(ruleSet[0]?.id, 'rule.backend.console-log');
  assert.equal(ruleSet[1]?.stage, 'CI');
});

test('RuleSet admite conjunto vacio', () => {
  const emptyRuleSet: RuleSet = [];

  assert.deepEqual(emptyRuleSet, []);
  assert.equal(emptyRuleSet.length, 0);
});
