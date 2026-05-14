import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSystemNotificationGate } from '../framework-menu-system-notifications-gate';

test('resolveSystemNotificationGate bloquea config disabled', () => {
  const result = resolveSystemNotificationGate({
    config: { enabled: false, channel: 'macos' },
    nowMs: Date.parse('2026-03-04T12:00:00.000Z'),
  });

  assert.deepEqual(result, { delivered: false, reason: 'disabled' });
});

test('resolveSystemNotificationGate bloquea config muteada', () => {
  const result = resolveSystemNotificationGate({
    config: {
      enabled: true,
      channel: 'macos',
      muteUntil: '2099-01-01T00:00:00.000Z',
    },
    nowMs: Date.parse('2026-03-04T12:00:00.000Z'),
  });

  assert.deepEqual(result, { delivered: false, reason: 'muted' });
});

test('resolveSystemNotificationGate respeta aliases legacy de desactivación por entorno', () => {
  for (const env of [
    { PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS: '1' },
    { PUMUKI_SYSTEM_NOTIFICATIONS: '0' },
    { PUMUKI_NOTIFICATIONS: '0' },
  ] as const) {
    const result = resolveSystemNotificationGate({
      config: { enabled: true, channel: 'macos' },
      nowMs: Date.parse('2026-03-04T12:00:00.000Z'),
      env: env as NodeJS.ProcessEnv,
    });

    assert.deepEqual(result, { delivered: false, reason: 'disabled' });
  }
});

test('resolveSystemNotificationGate permite continuar cuando está habilitado (sin filtrar por plataforma)', () => {
  const result = resolveSystemNotificationGate({
    config: { enabled: true, channel: 'macos' },
    nowMs: Date.parse('2026-03-04T12:00:00.000Z'),
  });

  assert.equal(result, null);
});
