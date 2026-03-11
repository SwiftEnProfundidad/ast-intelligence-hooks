import assert from 'node:assert/strict';
import test from 'node:test';
import { emitMacOsBlockedDialogStage } from '../framework-menu-system-notifications-macos-blocked-stage';
import type { PumukiCriticalNotificationEvent } from '../framework-menu-system-notifications-types';

test('emitMacOsBlockedDialogStage no hace nada para evento no bloqueante', () => {
  let called = false;

  const event: Extract<PumukiCriticalNotificationEvent, { kind: 'audit.summary' }> = {
    kind: 'audit.summary',
    totalViolations: 1,
    criticalViolations: 0,
    highViolations: 1,
  };

  emitMacOsBlockedDialogStage({
    event,
    repoRoot: '/tmp/repo',
    config: { enabled: true, channel: 'macos', blockedDialogEnabled: true },
    env: {} as NodeJS.ProcessEnv,
    nowMs: 1,
    runCommandWithOutput: () => {
      called = true;
      return { exitCode: 0, stdout: '' };
    },
    applyDialogChoice: () => {
      called = true;
    },
  });

  assert.equal(called, false);
});
