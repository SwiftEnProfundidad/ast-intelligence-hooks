import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGateBlockedPayload } from '../framework-menu-system-notifications-payloads-blocked';

test('buildGateBlockedPayload construye payload para gate BLOCK', () => {
  const payload = buildGateBlockedPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 7,
    },
    ''
  );

  assert.match(payload.title, /pumuki/i);
  assert.match(payload.title, /bloqueado/i);
  assert.match(payload.subtitle ?? '', /pre_commit|pre-commit/i);
  assert.match(payload.subtitle ?? '', /7/);
  assert.match(payload.message, /causa:/i);
  assert.match(payload.message, /impacto:/i);
  assert.match(payload.message, /comando:/i);
  assert.match(payload.message, /siguiente acción:/i);
  assert.equal(payload.soundName, 'Basso');
});

test('buildGateBlockedPayload incluye proyecto en subtítulo cuando hay prefijo', () => {
  const payload = buildGateBlockedPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      causeCode: 'EVIDENCE_STALE',
    },
    'SAAS:APP_SUPERMERCADOS · '
  );

  assert.match(payload.subtitle ?? '', /SAAS:APP_SUPERMERCADOS/);
  assert.match(payload.subtitle ?? '', /PRE_COMMIT/);
});

test('buildGateBlockedPayload muestra causa y solución coherentes para tracking bloqueado', () => {
  const payload = buildGateBlockedPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_WRITE',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      causeMessage:
        'Evidence AI gate status is BLOCKED. active_entries=RGO-1900-01@L53 tracking_source=docs/RURALGO_SEGUIMIENTO.md',
      remediation:
        'npx --yes --package pumuki@6.3.124 pumuki policy reconcile --strict --json && npx --yes --package pumuki@6.3.124 pumuki sdd validate --stage=PRE_WRITE --json',
    },
    'R_GO · '
  );

  assert.match(payload.subtitle ?? '', /R_GO/);
  assert.match(payload.subtitle ?? '', /Tracking bloqueado/i);
  assert.match(payload.message, /tracking/i);
  assert.match(payload.message, /comando:/i);
  assert.match(payload.message, /siguiente acción:/i);
});
