import assert from 'node:assert/strict';
import test from 'node:test';
import { emitSystemNotification } from '../framework-menu-system-notifications-lib';

test('emitSystemNotification aplica fallback no-macOS y no ejecuta osascript', () => {
  const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];
  const result = emitSystemNotification({
    platform: 'linux',
    event: {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 2,
    },
    runCommand: (command, args) => {
      calls.push({ command, args });
      return 0;
    },
  });

  assert.equal(result.delivered, false);
  assert.equal(result.reason, 'unsupported-platform');
  assert.equal(calls.length, 0);
});

test('emitSystemNotification devuelve muted y no ejecuta comando cuando el silencio está activo', () => {
  const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];
  const result = emitSystemNotification({
    platform: 'darwin',
    event: {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 1,
    },
    config: {
      enabled: true,
      channel: 'macos',
      muteUntil: '2099-01-01T00:00:00.000Z',
    },
    now: () => Date.parse('2026-03-04T12:00:00.000Z'),
    runCommand: (command, args) => {
      calls.push({ command, args });
      return 0;
    },
  });

  assert.equal(result.delivered, false);
  assert.equal(result.reason, 'muted');
  assert.equal(calls.length, 0);
});
