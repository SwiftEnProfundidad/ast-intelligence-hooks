import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

test('buildSystemNotificationPayload incluye proyecto en subtítulo cuando hay repoRoot', () => {
  const payload = buildSystemNotificationPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      causeCode: 'EVIDENCE_STALE',
    },
    {
      repoRoot: '/Users/dev/Projects/SAAS:APP_SUPERMERCADOS',
    }
  );

  assert.match(payload.subtitle ?? '', /SAAS:APP_SUPERMERCADOS/);
  assert.match(payload.subtitle ?? '', /PRE_COMMIT/);
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
      blockedDialogEnabled: true,
    });
  });
});

test('readSystemNotificationsConfig conserva muteUntil cuando existe', async () => {
  await withTempDir('pumuki-notifications-mute-until-', async (repoRoot) => {
    const muteUntil = '2026-03-05T10:00:00.000Z';
    const configPath = join(repoRoot, '.pumuki', 'system-notifications.json');
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      configPath,
      `${JSON.stringify({ enabled: true, channel: 'macos', muteUntil }, null, 2)}\n`,
      'utf8'
    );

    const config = readSystemNotificationsConfig(repoRoot);
    assert.equal(config.enabled, true);
    assert.equal(config.channel, 'macos');
    assert.equal(config.muteUntil, muteUntil);
    assert.equal(config.blockedDialogEnabled, true);
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

test('emitSystemNotification devuelve muted y no ejecuta comando cuando el silencio está activo', () => {
  const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];
  const result = emitSystemNotification({
    platform: 'darwin',
    event: {
      kind: 'gate.blocked',
      stage: 'PRE_PUSH',
      totalViolations: 1,
    },
    config: {
      enabled: true,
      channel: 'macos',
      muteUntil: '2099-01-01T00:00:00.000Z',
    },
    now: () => Date.parse('2026-03-04T12:00:00.000Z'),
    runCommand: (command, args) => {
      calls.push({ command, args });
      return 0;
    },
  });

  assert.equal(result.delivered, false);
  assert.equal(result.reason, 'muted');
  assert.equal(calls.length, 0);
});

test('emitSystemNotification en macOS permite silenciar 30 min desde diálogo', async () => {
  await withTempDir('pumuki-notifications-dialog-mute30-', async (repoRoot) => {
    const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];
    const nowMs = Date.parse('2026-03-04T12:00:00.000Z');
    const result = emitSystemNotification({
      platform: 'darwin',
      repoRoot,
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
      now: () => nowMs,
      runCommand: (command, args) => {
        calls.push({ command, args });
        return 0;
      },
      runCommandWithOutput: (command, args) => {
        calls.push({ command, args });
        return {
          exitCode: 0,
          stdout: 'button returned:Silenciar 30 min\n',
        };
      },
    });

    assert.equal(result.delivered, true);
    assert.equal(calls.length, 2);
    const config = readSystemNotificationsConfig(repoRoot);
    assert.equal(config.enabled, true);
    assert.ok(config.muteUntil);
    assert.equal(
      Date.parse(config.muteUntil ?? ''),
      nowMs + 30 * 60_000
    );
  });
});

test('emitSystemNotification en macOS abre diálogo por defecto sin flag explícito', async () => {
  await withTempDir('pumuki-notifications-dialog-default-', async (repoRoot) => {
    const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];
    const result = emitSystemNotification({
      platform: 'darwin',
      repoRoot,
      event: {
        kind: 'gate.blocked',
        stage: 'PRE_PUSH',
        totalViolations: 1,
        causeCode: 'EVIDENCE_STALE',
      },
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

    assert.equal(result.delivered, true);
    assert.equal(calls.length, 2);
    assert.equal(calls[1]?.command, 'swift');
  });
});

test('emitSystemNotification usa AppleScript si se fuerza modo applescript', async () => {
  await withTempDir('pumuki-notifications-dialog-applescript-mode-', async (repoRoot) => {
    const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];
    const result = emitSystemNotification({
      platform: 'darwin',
      repoRoot,
      event: {
        kind: 'gate.blocked',
        stage: 'PRE_PUSH',
        totalViolations: 1,
        causeCode: 'EVIDENCE_STALE',
      },
      env: {
        PUMUKI_MACOS_BLOCKED_DIALOG_MODE: 'applescript',
      } as NodeJS.ProcessEnv,
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

    assert.equal(result.delivered, true);
    assert.equal(calls.length, 2);
    assert.equal(calls[1]?.command, 'osascript');
  });
});

test('emitSystemNotification hace fallback a AppleScript si falla helper Swift', async () => {
  await withTempDir('pumuki-notifications-dialog-swift-fallback-', async (repoRoot) => {
    const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];
    const result = emitSystemNotification({
      platform: 'darwin',
      repoRoot,
      event: {
        kind: 'gate.blocked',
        stage: 'PRE_PUSH',
        totalViolations: 1,
        causeCode: 'EVIDENCE_STALE',
      },
      runCommand: (command, args) => {
        calls.push({ command, args });
        return 0;
      },
      runCommandWithOutput: (command, args) => {
        calls.push({ command, args });
        if (command === 'swift') {
          return {
            exitCode: 1,
            stdout: '',
          };
        }
        return {
          exitCode: 0,
          stdout: 'button returned:Mantener activas\n',
        };
      },
    });

    assert.equal(result.delivered, true);
    assert.equal(calls.length, 3);
    assert.equal(calls[1]?.command, 'swift');
    assert.equal(calls[2]?.command, 'osascript');
  });
});

test('emitSystemNotification en macOS permite desactivar desde diálogo', async () => {
  await withTempDir('pumuki-notifications-dialog-disable-', async (repoRoot) => {
    const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];
    const result = emitSystemNotification({
      platform: 'darwin',
      repoRoot,
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
      runCommandWithOutput: (command, args) => {
        calls.push({ command, args });
        return {
          exitCode: 0,
          stdout: 'button returned:Desactivar\n',
        };
      },
    });

    assert.equal(result.delivered, true);
    assert.equal(calls.length, 2);
    const config = readSystemNotificationsConfig(repoRoot);
    assert.equal(config.enabled, false);
    assert.equal(config.muteUntil, undefined);
  });
});
