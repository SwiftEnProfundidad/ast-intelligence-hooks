import assert from 'node:assert/strict';
import test from 'node:test';
import { dispatchSystemNotification } from '../framework-menu-system-notifications-dispatch';
import { buildSystemNotificationPayload } from '../framework-menu-system-notifications-payloads';
import type { PumukiCriticalNotificationEvent } from '../framework-menu-system-notifications-types';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

test('dispatchSystemNotification entrega al canal macOS manteniendo el contrato visible', async () => {
  await withTempDir('pumuki-notifications-dispatch-', async (repoRoot) => {
    const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];
    const event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }> = {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 1,
      causeCode: 'EVIDENCE_STALE',
    };
    const payload = buildSystemNotificationPayload(event, { repoRoot });

    const result = dispatchSystemNotification({
      event,
      payload,
      platform: 'darwin',
      repoRoot,
      config: { enabled: true, channel: 'macos', blockedDialogEnabled: true },
      env: {} as NodeJS.ProcessEnv,
      nowMs: Date.parse('2026-03-04T12:00:00.000Z'),
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
    assert.equal(calls[0]?.command, 'osascript');
    assert.equal(calls[1]?.command, 'swift');
  });
});
