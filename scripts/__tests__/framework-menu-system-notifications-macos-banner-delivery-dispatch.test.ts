import assert from 'node:assert/strict';
import test from 'node:test';
import { dispatchMacOsNotificationBanner } from '../framework-menu-system-notifications-macos-banner-delivery-dispatch';

test('dispatchMacOsNotificationBanner delega en deliverMacOsBanner con el runner resuelto', () => {
  const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];

  const result = dispatchMacOsNotificationBanner({
    payload: { title: 'Pumuki bloqueado', message: 'Causa breve' },
    runner: (command, args) => {
      calls.push({ command, args });
      return 0;
    },
  });

  assert.deepEqual(result, { delivered: true, reason: 'delivered' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.command, 'osascript');
});
