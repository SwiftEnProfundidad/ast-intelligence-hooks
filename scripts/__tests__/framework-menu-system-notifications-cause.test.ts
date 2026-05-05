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

test('resolveBlockedCauseSummary explica bloqueos de tracking enriquecidos', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      causeMessage:
        'Evidence AI gate status is BLOCKED. active_entries=RGO-1900-01@L53, line_389 tracking_source=docs/RURALGO_SEGUIMIENTO.md',
    },
    'EVIDENCE_GATE_BLOCKED'
  );

  assert.match(result, /tracking bloqueado/i);
  assert.match(result, /RGO-1900-01/);
  assert.match(result, /docs\/RURALGO_SEGUIMIENTO\.md/);
  assert.doesNotMatch(result, /Evidence AI gate status/i);
});

test('resolveBlockedCauseSummary prioriza TDD/BDD sobre tracking enriquecido', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 2,
      causeCode: 'TDD_BDD_SCENARIO_FILE_MISSING',
      causeMessage:
        'TDD/BDD evidence scenario file is missing. code=TDD_BDD_SCENARIO_FILE_MISSING active_entries=RGO-1900-01@L53 tracking_source=docs/RURALGO_SEGUIMIENTO.md',
    },
    'TDD_BDD_SCENARIO_FILE_MISSING'
  );

  assert.match(result, /escenario/i);
  assert.match(result, /TDD\/BDD/i);
  assert.doesNotMatch(result, /tracking bloqueado/i);
  assert.doesNotMatch(result, /RGO-1900-01/);
});

test('resolveBlockedCauseSummary traduce el bloqueo umbrella de evidencia', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      causeMessage: 'Evidence AI gate status is BLOCKED.',
    },
    'EVIDENCE_GATE_BLOCKED'
  );

  assert.match(result, /evidencia/i);
  assert.match(result, /gobernanza/i);
  assert.doesNotMatch(result, /Evidence AI gate status/i);
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

test('resolveBlockedCauseSummary traduce causas legacy de atomicidad a español', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 1,
      causeMessage: 'Atomicity budget exceeded.',
    },
    'GATE_BLOCKED'
  );

  assert.match(result, /demasiados scopes/i);
  assert.doesNotMatch(result, /atomicity/i);
});

test('resolveBlockedCauseSummary no deja copy en inglés cuando llega un bloqueo no mapeado', () => {
  const result = resolveBlockedCauseSummary(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      causeMessage: 'AST heuristic detected console.log usage.',
    },
    'UNKNOWN_AST_RULE'
  );

  assert.match(result, /bloqueo/i);
  assert.match(result, /PRE_COMMIT/i);
  assert.doesNotMatch(result, /AST heuristic detected console\.log usage\./i);
});
