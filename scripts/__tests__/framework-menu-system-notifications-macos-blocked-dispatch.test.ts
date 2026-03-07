import assert from 'node:assert/strict';
import test from 'node:test';
import { maybeDispatchBlockedMacOsDialog } from '../framework-menu-system-notifications-macos-blocked-dispatch';
import type { PumukiCriticalNotificationEvent } from '../framework-menu-system-notifications-types';

test('maybeDispatchBlockedMacOsDialog no hace nada si el evento no es gate.blocked', () => {
  let called = false;

  const event: Extract<PumukiCriticalNotificationEvent, { kind: 'audit.summary' }> = {
    kind: 'audit.summary',
    totalViolations: 1,
    criticalViolations: 0,
    highViolations: 1,
  };

  maybeDispatchBlockedMacOsDialog({
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

test('maybeDispatchBlockedMacOsDialog no hace nada si falta repoRoot', () => {
  let called = false;

  const event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }> = {
    kind: 'gate.blocked',
    stage: 'PRE_PUSH',
    totalViolations: 1,
    causeCode: 'EVIDENCE_STALE',
  };

  maybeDispatchBlockedMacOsDialog({
    event,
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
