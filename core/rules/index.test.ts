import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mergeRuleSets,
  type Condition,
  type Consequence,
  type RuleDefinition,
  type RuleSet,
  type Severity,
} from './index';

test('rules barrel expone tipos y mergeRuleSets funcional', () => {
  const severity: Severity = 'WARN';
  const condition: Condition = { kind: 'FileContent', contains: ['console.log'] };
  const consequence: Consequence = {
    kind: 'Finding',
    message: 'console.log detectado',
    code: 'HEURISTICS_CONSOLE_LOG_AST',
  };

  const baselineRule: RuleDefinition = {
    id: 'rule.console.log',
    description: 'Regla base',
    severity,
    when: condition,
    then: consequence,
    locked: true,
  };
  const projectRule: RuleDefinition = {
    ...baselineRule,
    severity: 'ERROR',
  };
  const baseline: RuleSet = [baselineRule];
  const project: RuleSet = [projectRule];

  const merged = mergeRuleSets(baseline, project);

  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.id, 'rule.console.log');
  assert.equal(merged[0]?.severity, 'ERROR');
});
