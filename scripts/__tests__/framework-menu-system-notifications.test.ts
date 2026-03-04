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
  assert.match(payload.title, /bloqueado/i);
  assert.match(payload.subtitle ?? '', /pre_commit|pre-commit/i);
  assert.match(payload.subtitle ?? '', /7/);
  assert.match(payload.message, /^solución:/i);
  assert.equal(payload.soundName, 'Basso');
});

test('buildSystemNotificationPayload para gate BLOCK incluye causa y remediación accionable', () => {
  const payload = buildSystemNotificationPayload({
    kind: 'gate.blocked',
    stage: 'PRE_PUSH',
    totalViolations: 1,
    causeCode: 'EVIDENCE_STALE',
    causeMessage: 'Evidence is stale.',
    remediation: 'Ejecuta pumuki-pre-write para refrescar evidencia.',
  });

  assert.match(payload.subtitle ?? '', /evidencia/i);
  assert.match(payload.message, /^solución:/i);
  assert.match(payload.message, /pumuki-pre-write/i);
  assert.equal(payload.soundName, 'Basso');
});

test('buildSystemNotificationPayload construye payload para evidencia stale', () => {
  const payload = buildSystemNotificationPayload({
    kind: 'evidence.stale',
    evidencePath: '.ai_evidence.json',
    ageMinutes: 45,
  });

  assert.match(payload.title, /pumuki/i);
  assert.match(payload.title, /evidencia/i);
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
  assert.match(payload.message, /no cumple/i);
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

test('emitSystemNotification en macOS abre diálogo completo opcional para bloqueos', () => {
  const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];
  const result = emitSystemNotification({
    platform: 'darwin',
    event: {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 1,
      causeCode: 'BACKEND_AVOID_EXPLICIT_ANY',
      causeMessage: 'Avoid explicit any in backend code.',
      remediation: 'Tipa el valor y elimina any explícito en backend.',
    },
    env: {
      PUMUKI_MACOS_BLOCKED_DIALOG: '1',
    } as NodeJS.ProcessEnv,
    runCommand: (command, args) => {
      calls.push({ command, args });
      return 0;
    },
  });

  assert.equal(result.delivered, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[0]?.command, 'osascript');
  assert.equal(calls[1]?.command, 'osascript');
  assert.match(calls[0]?.args.join(' ') ?? '', /display notification/i);
  assert.match(calls[1]?.args.join(' ') ?? '', /display dialog/i);
  assert.match(calls[1]?.args.join(' ') ?? '', /solución/i);
});
