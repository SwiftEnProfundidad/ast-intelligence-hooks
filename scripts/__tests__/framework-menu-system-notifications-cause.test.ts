import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveBlockedCauseSummary } from '../framework-menu-system-notifications-cause';

test('resolveBlockedCauseSummary usa mapping conocido por causeCode', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 1,
    },
    'EVIDENCE_STALE'
  );

  assert.match(result, /evidencia/i);
  assert.match(result, /desactualizada/i);
});

test('resolveBlockedCauseSummary traduce mensajes legacy conocidos', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 1,
      causeMessage: 'Avoid explicit any in backend code.',
    },
    'GATE_BLOCKED'
  );

  assert.match(result, /"any"/i);
  assert.match(result, /backend/i);
});

test('resolveBlockedCauseSummary usa fallback por stage cuando no hay detalles', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 7,
    },
    'GATE_BLOCKED'
  );

  assert.match(result, /7/);
  assert.match(result, /PRE_COMMIT/);
});
