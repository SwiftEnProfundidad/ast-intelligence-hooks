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
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.command, 'swift');
  });
});

test('gate.blocked duplica el payload a stderr cuando macOS entrega (visibilidad en terminal)', async () => {
  await withTempDir('pumuki-notifications-dispatch-stderr-', async () => {
    const written: string[] = [];
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: string | Uint8Array, ...args: unknown[]) => {
      written.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
      return true;
    }) as typeof process.stderr.write;

    try {
      const event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }> = {
        kind: 'gate.blocked',
        stage: 'PRE_PUSH',
        totalViolations: 2,
        causeCode: 'SOLID_HEURISTIC',
        causeMessage: 'Heuristic violation.',
        remediation: 'Fix and retry.',
      };
      const payload = buildSystemNotificationPayload(event);

      const result = dispatchSystemNotification({
        event,
        payload,
        platform: 'darwin',
        config: { enabled: true, channel: 'macos', blockedDialogEnabled: false },
        env: {} as NodeJS.ProcessEnv,
        nowMs: Date.parse('2026-03-04T12:00:00.000Z'),
        runCommand: () => 0,
        runCommandWithOutput: () => ({ exitCode: 0, stdout: '' }),
      });

      assert.deepEqual(result, { delivered: true, reason: 'delivered' });
      const joined = written.join('');
      assert.ok(joined.includes('[pumuki]'));
      assert.ok(joined.includes(payload.title));
    } finally {
      process.stderr.write = originalWrite;
    }
  });
});

test('PUMUKI_DISABLE_GATE_BLOCKED_STDERR_MIRROR evita el duplicado stderr en gate.blocked', async () => {
  await withTempDir('pumuki-notifications-dispatch-stderr-off-', async () => {
    const written: string[] = [];
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: string | Uint8Array, ...args: unknown[]) => {
      written.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
      return true;
    }) as typeof process.stderr.write;

    try {
      const event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }> = {
        kind: 'gate.blocked',
        stage: 'PRE_COMMIT',
        totalViolations: 1,
        causeCode: 'X',
      };
      const payload = buildSystemNotificationPayload(event);

      dispatchSystemNotification({
        event,
        payload,
        platform: 'darwin',
        config: { enabled: true, channel: 'macos', blockedDialogEnabled: false },
        env: { PUMUKI_DISABLE_GATE_BLOCKED_STDERR_MIRROR: '1' } as NodeJS.ProcessEnv,
        nowMs: Date.parse('2026-03-04T12:00:00.000Z'),
        runCommand: () => 0,
        runCommandWithOutput: () => ({ exitCode: 0, stdout: '' }),
      });

      assert.equal(written.join('').includes('[pumuki]'), false);
    } finally {
      process.stderr.write = originalWrite;
    }
  });
});
