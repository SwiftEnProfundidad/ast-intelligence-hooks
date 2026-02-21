import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSystemNotificationPayload,
  emitSystemNotification,
  type PumukiCriticalNotificationEvent,
} from '../framework-menu-system-notifications-lib';

test('buildSystemNotificationPayload construye payload para gate BLOCK', () => {
  const payload = buildSystemNotificationPayload({
    kind: 'gate.blocked',
    stage: 'PRE_COMMIT',
    totalViolations: 7,
  });

  assert.match(payload.title, /pumuki/i);
  assert.match(payload.title, /block/i);
  assert.match(payload.message, /pre_commit|pre-commit/i);
  assert.match(payload.message, /7/);
});

test('buildSystemNotificationPayload construye payload para evidencia stale', () => {
  const payload = buildSystemNotificationPayload({
    kind: 'evidence.stale',
    evidencePath: '.ai_evidence.json',
    ageMinutes: 45,
  });

  assert.match(payload.title, /pumuki/i);
  assert.match(payload.title, /evidence|stale/i);
  assert.match(payload.message, /\.ai_evidence\.json/i);
  assert.match(payload.message, /45/);
});

test('buildSystemNotificationPayload construye payload para violación git-flow', () => {
  const payload = buildSystemNotificationPayload({
    kind: 'gitflow.violation',
    currentBranch: 'main',
    reason: 'commits-direct-to-main',
  });

  assert.match(payload.title, /pumuki/i);
  assert.match(payload.title, /git[- ]?flow/i);
  assert.match(payload.message, /\bmain\b/i);
  assert.match(payload.message, /commits-direct-to-main/i);
});

test('emitSystemNotification aplica fallback no-macOS y no ejecuta osascript', () => {
  const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];
  const result = emitSystemNotification({
    platform: 'linux',
    event: {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 2,
    } satisfies PumukiCriticalNotificationEvent,
    runCommand: (command, args) => {
      calls.push({ command, args });
      return 0;
    },
  });

  assert.equal(result.delivered, false);
  assert.equal(result.reason, 'unsupported-platform');
  assert.equal(calls.length, 0);
});
