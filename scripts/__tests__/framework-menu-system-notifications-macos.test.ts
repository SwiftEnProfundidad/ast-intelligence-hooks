import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSystemNotificationsConfigFromSelection,
} from '../framework-menu-system-notifications-config';
import { deliverMacOsNotification } from '../framework-menu-system-notifications-macos';
import { buildSystemNotificationPayload } from '../framework-menu-system-notifications-payloads';
import type { PumukiCriticalNotificationEvent } from '../framework-menu-system-notifications-types';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

const auditSummaryEvent = (
  overrides: Partial<Extract<PumukiCriticalNotificationEvent, { kind: 'audit.summary' }>> = {}
): Extract<PumukiCriticalNotificationEvent, { kind: 'audit.summary' }> => ({
  kind: 'audit.summary',
  totalViolations: 3,
  criticalViolations: 1,
  highViolations: 2,
  ...overrides,
});

test('deliverMacOsNotification mantiene la fachada pública para banner simple', () => {
  const event = auditSummaryEvent();
  const payload = buildSystemNotificationPayload(event);
  const result = deliverMacOsNotification({
    event,
    payload,
    config: buildSystemNotificationsConfigFromSelection(true),
    env: {} as NodeJS.ProcessEnv,
    nowMs: Date.parse('2026-03-04T12:00:00.000Z'),
    runCommand: () => 0,
    applyDialogChoice: () => undefined,
  });

  assert.deepEqual(result, { delivered: true, reason: 'delivered' });
});

test('deliverMacOsNotification mantiene la fachada pública para gate bloqueado', async () => {
  await withTempDir('pumuki-notifications-dialog-smoke-', async (repoRoot) => {
    const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];
    const event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }> = {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 1,
      causeCode: 'EVIDENCE_STALE',
    };
    const payload = buildSystemNotificationPayload(event, { repoRoot });

    const result = deliverMacOsNotification({
      event,
      payload,
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
      applyDialogChoice: () => undefined,
    });

    assert.equal(result.delivered, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.command, 'swift');
  });
});
