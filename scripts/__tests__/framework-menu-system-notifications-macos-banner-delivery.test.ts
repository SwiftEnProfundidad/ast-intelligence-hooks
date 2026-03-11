import assert from 'node:assert/strict';
import test from 'node:test';
import { deliverMacOsNotificationBanner } from '../framework-menu-system-notifications-macos-banner-delivery';
import type { SystemNotificationPayload } from '../framework-menu-system-notifications-types';

const payload: SystemNotificationPayload = {
  title: 'Pumuki bloqueado',
  message: 'Causa breve',
};

test('deliverMacOsNotificationBanner devuelve delivered si el banner se envía bien', () => {
  const result = deliverMacOsNotificationBanner({
    payload,
    runCommand: () => 0,
  });

  assert.deepEqual(result, { delivered: true, reason: 'delivered' });
});
