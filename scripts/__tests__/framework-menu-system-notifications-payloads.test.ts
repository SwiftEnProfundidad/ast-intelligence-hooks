import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSystemNotificationPayload } from '../framework-menu-system-notifications-payloads';

test('buildSystemNotificationPayload mantiene la fachada pública con contexto de proyecto', () => {
  const payload = buildSystemNotificationPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      causeCode: 'EVIDENCE_STALE',
    },
    {
      repoRoot: '/Users/dev/Projects/SAAS:APP_SUPERMERCADOS',
    }
  );

  assert.match(payload.subtitle ?? '', /SAAS:APP_SUPERMERCADOS/);
  assert.match(payload.subtitle ?? '', /PRE_COMMIT/);
  assert.match(payload.message, /causa:/i);
  assert.match(payload.message, /impacto:/i);
  assert.match(payload.message, /comando:/i);
  assert.match(payload.message, /siguiente acción:/i);
});
