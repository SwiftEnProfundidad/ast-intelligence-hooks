import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSystemNotificationPayload,
  emitSystemNotification,
  readSystemNotificationsConfig,
  type PumukiCriticalNotificationEvent,
} from '../framework-menu-system-notifications-lib';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

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

test('buildSystemNotificationPayload mantiene contrato legacy para audit summary', () => {
  const blocked = buildSystemNotificationPayload({
    kind: 'audit.summary',
    totalViolations: 12,
    criticalViolations: 3,
    highViolations: 4,
  });
  assert.equal(blocked.title, 'AST Audit Complete');
  assert.match(blocked.message, /3 CRITICAL, 4 HIGH/i);

  const pass = buildSystemNotificationPayload({
    kind: 'audit.summary',
    totalViolations: 0,
    criticalViolations: 0,
    highViolations: 0,
  });
  assert.equal(pass.title, 'AST Audit Complete');
  assert.match(pass.message, /No violations found/i);
});

test('readSystemNotificationsConfig habilita notificaciones por defecto cuando no hay config', async () => {
  await withTempDir('pumuki-notifications-defaults-', async (repoRoot) => {
    const config = readSystemNotificationsConfig(repoRoot);
    assert.deepEqual(config, {
      enabled: true,
      channel: 'macos',
    });
  });
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
