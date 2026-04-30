import assert from 'node:assert/strict';
import test from 'node:test';
import { buildBlockedDialogPayload } from '../framework-menu-system-notifications-macos-dialog-payload';
import type { PumukiCriticalNotificationEvent } from '../framework-menu-system-notifications-types';

const blockedEvent = (
  overrides: Partial<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>> = {}
): Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }> => ({
  kind: 'gate.blocked',
  stage: 'PRE_PUSH',
  totalViolations: 1,
  causeCode: 'EVIDENCE_STALE',
  ...overrides,
});

test('buildBlockedDialogPayload compone título, causa y remediación visibles', () => {
  const payload = buildBlockedDialogPayload({
    event: blockedEvent({
      causeCode: 'BACKEND_AVOID_EXPLICIT_ANY',
      causeMessage: 'Avoid explicit any in backend code.',
      remediation: 'Tipa el valor y elimina any explícito en backend.',
    }),
    repoRoot: '/tmp/demo-repo',
    env: {
      PUMUKI_PROJECT_LABEL: 'demo-repo',
    } as NodeJS.ProcessEnv,
  });

  assert.equal(payload.title, '🔴 Pumuki bloqueado · demo-repo');
  assert.match(payload.cause, /causa:/i);
  assert.match(payload.cause, /uso de ["']any["'] explícito en backend/i);
  assert.match(payload.cause, /impacto:/i);
  assert.match(payload.remediation, /comando:/i);
  assert.match(payload.remediation, /siguiente acción:/i);
  assert.match(payload.remediation, /any explícito en backend/i);
});
