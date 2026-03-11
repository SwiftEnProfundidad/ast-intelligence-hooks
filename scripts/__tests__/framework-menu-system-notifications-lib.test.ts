import assert from 'node:assert/strict';
import test from 'node:test';
import { emitSystemNotification } from '../framework-menu-system-notifications-lib';
import { buildSystemNotificationsConfigFromSelection } from '../framework-menu-system-notifications-config';
import type { PumukiCriticalNotificationEvent } from '../framework-menu-system-notifications-types';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

test('emitSystemNotification mantiene la fachada pública y devuelve unsupported-platform en linux', () => {
  const result = emitSystemNotification({
    platform: 'linux',
    event: {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 2,
    },
    runCommand: () => 0,
  });

  assert.equal(result.delivered, false);
  assert.equal(result.reason, 'unsupported-platform');
});

test('emitSystemNotification mantiene la fachada pública y entrega por macOS cuando pasa el gate', async () => {
  await withTempDir('pumuki-system-notifications-lib-', async (repoRoot) => {
    const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];
    const event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }> = {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 1,
      causeCode: 'EVIDENCE_STALE',
    };
    const result = emitSystemNotification({
      platform: 'darwin',
      repoRoot,
      event,
      config: buildSystemNotificationsConfigFromSelection(true),
      now: () => Date.parse('2026-03-04T12:00:00.000Z'),
      runCommand: (command, args) => {
        calls.push({ command, args });
        return 0;
      },
      runCommandWithOutput: (command, args) => {
        calls.push({ command, args });
        return {
          exitCode: 0,
          stdout: 'button returned:Mantener activas\n',
        };
      },
    });

    assert.deepEqual(result, { delivered: true, reason: 'delivered' });
    assert.equal(calls.length, 2);
    assert.equal(calls[0]?.command, 'osascript');
    assert.equal(calls[1]?.command, 'swift');
  });
});
