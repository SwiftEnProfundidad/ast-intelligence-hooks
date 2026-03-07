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
  assert.match(payload.message, /^solución:/i);
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
