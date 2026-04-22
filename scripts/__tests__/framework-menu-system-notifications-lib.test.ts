import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { emitSystemNotification } from '../framework-menu-system-notifications-lib';
import type { PumukiCriticalNotificationEvent } from '../framework-menu-system-notifications-types';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

const envForDefaultNotificationBehavior = (): NodeJS.ProcessEnv => {
  const next = { ...process.env };
  delete next.PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS;
  return next;
};

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
    env: envForDefaultNotificationBehavior(),
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
      ...envForDefaultNotificationBehavior(),
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
      env: envForDefaultNotificationBehavior(),
      event,
      config: {
        enabled: true,
        channel: 'macos',
        blockedDialogEnabled: false,
      },
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

test('emitSystemNotification desactiva notificaciones desde el diálogo y bloquea emisiones posteriores', async () => {
  await withTempDir('pumuki-system-notifications-disable-e2e-', async (repoRoot) => {
    const baseNowMs = Date.parse('2026-03-04T12:00:00.000Z');
    const event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }> = {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 1,
      causeCode: 'EVIDENCE_STALE',
    };

    const first = emitSystemNotification({
      platform: 'darwin',
      repoRoot,
      env: envForDefaultNotificationBehavior(),
      event,
      now: () => baseNowMs,
      runCommand: () => 0,
      runCommandWithOutput: () => ({
        exitCode: 0,
        stdout: 'button returned:Desactivar\n',
      }),
    });

    const second = emitSystemNotification({
      platform: 'darwin',
      repoRoot,
      env: envForDefaultNotificationBehavior(),
      event,
      now: () => baseNowMs + 5_000,
      runCommand: () => {
        throw new Error('runCommand should not be called when notifications are disabled');
      },
      runCommandWithOutput: () => {
        throw new Error('runCommandWithOutput should not be called when notifications are disabled');
      },
    });

    assert.deepEqual(first, { delivered: true, reason: 'delivered' });
    assert.deepEqual(second, { delivered: false, reason: 'disabled' });
  });
});

test('emitSystemNotification silencia 30 min desde el diálogo y vuelve a permitir notificaciones al expirar', async () => {
  await withTempDir('pumuki-system-notifications-mute-e2e-', async (repoRoot) => {
    const baseNowMs = Date.parse('2026-03-04T12:00:00.000Z');
    const event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }> = {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 1,
      causeCode: 'EVIDENCE_STALE',
    };

    const first = emitSystemNotification({
      platform: 'darwin',
      repoRoot,
      env: envForDefaultNotificationBehavior(),
      event,
      now: () => baseNowMs,
      runCommand: () => 0,
      runCommandWithOutput: () => ({
        exitCode: 0,
        stdout: 'button returned:Silenciar 30 min\n',
      }),
    });

    const muted = emitSystemNotification({
      platform: 'darwin',
      repoRoot,
      env: envForDefaultNotificationBehavior(),
      event,
      now: () => baseNowMs + 5 * 60_000,
      runCommand: () => {
        throw new Error('runCommand should not be called while notifications are muted');
      },
      runCommandWithOutput: () => {
        throw new Error('runCommandWithOutput should not be called while notifications are muted');
      },
    });

    const afterMute = emitSystemNotification({
      platform: 'darwin',
      repoRoot,
      env: envForDefaultNotificationBehavior(),
      event,
      now: () => baseNowMs + 31 * 60_000,
      runCommand: () => 0,
      runCommandWithOutput: () => ({
        exitCode: 0,
        stdout: 'button returned:Mantener activas\n',
      }),
    });

    assert.deepEqual(first, { delivered: true, reason: 'delivered' });
    assert.deepEqual(muted, { delivered: false, reason: 'muted' });
    assert.deepEqual(afterMute, { delivered: true, reason: 'delivered' });
  });
});
