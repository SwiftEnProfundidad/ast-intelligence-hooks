import assert from 'node:assert/strict';
import test from 'node:test';
import { finalizeMacOsNotificationDelivery } from '../framework-menu-system-notifications-macos-result';

test('finalizeMacOsNotificationDelivery propaga fallo del banner', () => {
  assert.deepEqual(
    finalizeMacOsNotificationDelivery({ delivered: false, reason: 'command-failed' }),
    { delivered: false, reason: 'command-failed' }
  );
});

test('finalizeMacOsNotificationDelivery devuelve delivered cuando el banner fue bien', () => {
  assert.deepEqual(
    finalizeMacOsNotificationDelivery({ delivered: true, reason: 'delivered' }),
    { delivered: true, reason: 'delivered' }
  );
});
