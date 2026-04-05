import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { emitSystemNotification } from '../framework-menu-system-notifications-lib';
import { buildSystemNotificationsConfigFromSelection } from '../framework-menu-system-notifications-config';
import type { PumukiCriticalNotificationEvent } from '../framework-menu-system-notifications-types';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

test('emitSystemNotification usa stderr fallback en linux por defecto', (t) => {
  const chunks: string[] = [];
  const stderrWrite = mock.method(process.stderr, 'write', (chunk: string | Uint8Array) => {
    chunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
    return true;
  });
  t.after(() => {
    stderrWrite.mock.restore();
  });

  const result = emitSystemNotification({
    platform: 'linux',
    event: {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 2,
    },
    runCommand: () => 0,
  });

  assert.deepEqual(result, { delivered: true, reason: 'stderr-fallback' });
  assert.ok(chunks.join('').includes('[pumuki]'));
});

test('emitSystemNotification devuelve unsupported-platform en linux si stderr fallback está desactivado', () => {
  const result = emitSystemNotification({
    platform: 'linux',
    env: {
      ...process.env,
      PUMUKI_DISABLE_STDERR_NOTIFICATIONS: '1',
    },
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

test('emitSystemNotification respeta PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS', () => {
  const result = emitSystemNotification({
    platform: 'darwin',
    event: {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 1,
    },
    env: {
      ...process.env,
      PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS: '1',
    },
    runCommand: () => {
      throw new Error('runCommand should not be called when notifications are disabled');
    },
  });

  assert.equal(result.delivered, false);
  assert.equal(result.reason, 'disabled');
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
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.command, 'osascript');
  });
});
