import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluateGate,
  evaluateRules,
  type Finding,
  type GateOutcome,
  type GatePolicy,
  type GateStage,
} from './index';

test('gate barrel expone tipos y funciones principales', () => {
  const stage: GateStage = 'CI';
  const policy: GatePolicy = {
    stage,
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
  const findings: Finding[] = [
    {
      ruleId: 'rule.warn',
      severity: 'WARN',
      code: 'RULE_WARN',
      message: 'Warn finding',
    },
  ];

  const gateResult = evaluateGate(findings, policy);
  const outcome: GateOutcome = gateResult.outcome;

  assert.equal(outcome, 'WARN');
  assert.equal(gateResult.warnings.length, 1);
});

test('gate barrel expone evaluateRules con salida vacia cuando no hay reglas', () => {
  const findings = evaluateRules([], []);

  assert.deepEqual(findings, []);
});
