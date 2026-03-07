import assert from 'node:assert/strict';
import test from 'node:test';
import { deliverMacOsBanner } from '../framework-menu-system-notifications-macos-banner';
import type { SystemNotificationPayload } from '../framework-menu-system-notifications-types';

const payload: SystemNotificationPayload = {
  title: 'Pumuki bloqueado',
  message: 'Causa breve',
  subtitle: 'PRE_PUSH',
  soundName: 'Glass',
};

test('deliverMacOsBanner devuelve command-failed si falla osascript inicial', () => {
  const result = deliverMacOsBanner({
    payload,
    runCommand: () => 1,
  });

  assert.deepEqual(result, { delivered: false, reason: 'command-failed' });
});

test('deliverMacOsBanner devuelve delivered si el banner se envía bien', () => {
  const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];
  const result = deliverMacOsBanner({
    payload,
    runCommand: (command, args) => {
      calls.push({ command, args });
      return 0;
    },
  });

  assert.deepEqual(result, { delivered: true, reason: 'delivered' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.command, 'osascript');
});
