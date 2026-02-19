import assert from 'node:assert/strict';
import test from 'node:test';
import type { Finding } from './Finding';
import type { GatePolicy } from './GatePolicy';
import { evaluateGate } from './evaluateGate';

const defaultPolicy: GatePolicy = {
  stage: 'CI',
  blockOnOrAbove: 'ERROR',
  warnOnOrAbove: 'WARN',
};

test('evaluateGate devuelve PASS cuando no hay findings', () => {
  const result = evaluateGate([], defaultPolicy);

  assert.equal(result.outcome, 'PASS');
  assert.deepEqual(result.blocking, []);
  assert.deepEqual(result.warnings, []);
});

test('evaluateGate devuelve WARN cuando hay warnings sin bloqueantes', () => {
  const findings: Finding[] = [
    {
      ruleId: 'rule.warn',
      severity: 'WARN',
      code: 'RULE_WARN',
      message: 'Warn finding',
    },
    {
      ruleId: 'rule.info',
      severity: 'INFO',
      code: 'RULE_INFO',
      message: 'Info finding',
    },
  ];

  const result = evaluateGate(findings, defaultPolicy);

  assert.equal(result.outcome, 'WARN');
  assert.equal(result.blocking.length, 0);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0]?.ruleId, 'rule.warn');
});

test('evaluateGate devuelve BLOCK cuando existe al menos un finding bloqueante', () => {
  const findings: Finding[] = [
    {
      ruleId: 'rule.error',
      severity: 'ERROR',
      code: 'RULE_ERROR',
      message: 'Error finding',
    },
    {
      ruleId: 'rule.critical',
      severity: 'CRITICAL',
      code: 'RULE_CRITICAL',
      message: 'Critical finding',
    },
    {
      ruleId: 'rule.warn',
      severity: 'WARN',
      code: 'RULE_WARN',
      message: 'Warn finding',
    },
  ];

  const result = evaluateGate(findings, defaultPolicy);

  assert.equal(result.outcome, 'BLOCK');
  assert.equal(result.blocking.length, 2);
  assert.deepEqual(
    result.blocking.map((finding) => finding.ruleId),
    ['rule.error', 'rule.critical']
  );
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0]?.ruleId, 'rule.warn');
});
