import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSystemNotificationGate } from '../framework-menu-system-notifications-gate';

test('resolveSystemNotificationGate bloquea config disabled', () => {
  const result = resolveSystemNotificationGate({
    config: { enabled: false, channel: 'macos' },
    nowMs: Date.parse('2026-03-04T12:00:00.000Z'),
    platform: 'darwin',
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
    platform: 'darwin',
  });

  assert.deepEqual(result, { delivered: false, reason: 'muted' });
});

test('resolveSystemNotificationGate bloquea plataforma no soportada', () => {
  const result = resolveSystemNotificationGate({
    config: { enabled: true, channel: 'macos' },
    nowMs: Date.parse('2026-03-04T12:00:00.000Z'),
    platform: 'linux',
  });

  assert.deepEqual(result, { delivered: false, reason: 'unsupported-platform' });
});

test('resolveSystemNotificationGate permite continuar si el canal puede entregar', () => {
  const result = resolveSystemNotificationGate({
    config: { enabled: true, channel: 'macos' },
    nowMs: Date.parse('2026-03-04T12:00:00.000Z'),
    platform: 'darwin',
  });

  assert.equal(result, null);
});
