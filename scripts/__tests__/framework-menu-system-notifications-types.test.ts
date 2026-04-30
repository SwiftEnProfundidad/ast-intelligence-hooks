import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BLOCKED_DIALOG_DISABLE,
  BLOCKED_DIALOG_KEEP,
  BLOCKED_DIALOG_MUTE_30,
  BLOCKED_DIALOG_TIMEOUT_SECONDS,
  SWIFT_BLOCKED_DIALOG_SCRIPT_RELATIVE_PATH,
} from '../framework-menu-system-notifications-types';
import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationCommandRunner,
  SystemNotificationCommandRunnerWithOutput,
  SystemNotificationPayload,
  SystemNotificationsConfig,
} from '../framework-menu-system-notifications-types';

test('framework-menu-system-notifications-types mantiene constantes públicas estables', () => {
  assert.equal(BLOCKED_DIALOG_KEEP, 'Mantener activas');
  assert.equal(BLOCKED_DIALOG_MUTE_30, 'Silenciar 30 min');
  assert.equal(BLOCKED_DIALOG_DISABLE, 'Desactivar');
  assert.equal(BLOCKED_DIALOG_TIMEOUT_SECONDS, 15);
  assert.equal(
    SWIFT_BLOCKED_DIALOG_SCRIPT_RELATIVE_PATH,
    '.pumuki/runtime/pumuki-blocked-dialog.swift',
  );
});

test('framework-menu-system-notifications-types mantiene contratos tipados visibles', () => {
  const event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }> = {
    kind: 'gate.blocked',
    stage: 'PRE_PUSH',
    totalViolations: 1,
    causeCode: 'EVIDENCE_STALE',
  };
  const payload: SystemNotificationPayload = {
    title: 'Pumuki bloqueado',
    message:
      'Causa: La evidencia está desactualizada.\nImpacto: El gate no deja avanzar.\nComando: pumuki sdd validate --stage=PRE_PUSH --json\nSiguiente acción: Regenera la evidencia.',
    subtitle: 'Repo · PRE_PUSH',
  };
  const config: SystemNotificationsConfig = {
    enabled: true,
    channel: 'macos',
    blockedDialogEnabled: true,
  };
  const runCommand: SystemNotificationCommandRunner = () => 0;
  const runCommandWithOutput: SystemNotificationCommandRunnerWithOutput = () => ({
    exitCode: 0,
    stdout: 'button returned:Mantener activas\n',
  });

  assert.equal(event.stage, 'PRE_PUSH');
  assert.equal(payload.title, 'Pumuki bloqueado');
  assert.equal(config.channel, 'macos');
  assert.equal(runCommand('echo', []), 0);
  assert.equal(runCommandWithOutput('echo', []).exitCode, 0);
});
