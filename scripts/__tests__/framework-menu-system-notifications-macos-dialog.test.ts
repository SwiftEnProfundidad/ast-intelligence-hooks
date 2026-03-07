import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyDialogChoice,
  readSystemNotificationsConfig,
} from '../framework-menu-system-notifications-config';
import {
  maybeHandleBlockedMacOsDialog,
  resolveBlockedDialogEnabled,
} from '../framework-menu-system-notifications-macos-dialog';
import type { PumukiCriticalNotificationEvent } from '../framework-menu-system-notifications-types';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

const blockedEvent = (
  overrides: Partial<Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>> = {}
): Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }> => ({
  kind: 'gate.blocked',
  stage: 'PRE_PUSH',
  totalViolations: 1,
  causeCode: 'EVIDENCE_STALE',
  ...overrides,
});

test('resolveBlockedDialogEnabled respeta override explícito del entorno', () => {
  assert.equal(
    resolveBlockedDialogEnabled({
      env: { PUMUKI_MACOS_BLOCKED_DIALOG: '0' } as NodeJS.ProcessEnv,
      config: { enabled: true, channel: 'macos', blockedDialogEnabled: true },
    }),
    false
  );
  assert.equal(
    resolveBlockedDialogEnabled({
      env: { PUMUKI_MACOS_BLOCKED_DIALOG: 'true' } as NodeJS.ProcessEnv,
      config: { enabled: true, channel: 'macos', blockedDialogEnabled: false },
    }),
    true
  );
});

test('maybeHandleBlockedMacOsDialog en macOS abre diálogo swift por defecto', async () => {
  await withTempDir('pumuki-notifications-dialog-default-', async (repoRoot) => {
    const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];

    maybeHandleBlockedMacOsDialog({
      event: blockedEvent(),
      repoRoot,
      config: { enabled: true, channel: 'macos', blockedDialogEnabled: true },
      env: {} as NodeJS.ProcessEnv,
      nowMs: Date.parse('2026-03-04T12:00:00.000Z'),
      runCommandWithOutput: (command, args) => {
        calls.push({ command, args });
        return {
          exitCode: 0,
          stdout: 'button returned:Mantener activas\n',
        };
      },
      applyDialogChoice,
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.command, 'swift');
  });
});

test('maybeHandleBlockedMacOsDialog usa AppleScript si se fuerza modo applescript', async () => {
  await withTempDir('pumuki-notifications-dialog-applescript-mode-', async (repoRoot) => {
    const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];

    maybeHandleBlockedMacOsDialog({
      event: blockedEvent(),
      repoRoot,
      config: { enabled: true, channel: 'macos', blockedDialogEnabled: true },
      env: {
        PUMUKI_MACOS_BLOCKED_DIALOG_MODE: 'applescript',
      } as NodeJS.ProcessEnv,
      nowMs: Date.parse('2026-03-04T12:00:00.000Z'),
      runCommandWithOutput: (command, args) => {
        calls.push({ command, args });
        return {
          exitCode: 0,
          stdout: 'button returned:Mantener activas\n',
        };
      },
      applyDialogChoice,
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.command, 'osascript');
  });
});

test('maybeHandleBlockedMacOsDialog hace fallback a AppleScript si falla helper Swift', async () => {
  await withTempDir('pumuki-notifications-dialog-swift-fallback-', async (repoRoot) => {
    const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];

    maybeHandleBlockedMacOsDialog({
      event: blockedEvent(),
      repoRoot,
      config: { enabled: true, channel: 'macos', blockedDialogEnabled: true },
      env: {} as NodeJS.ProcessEnv,
      nowMs: Date.parse('2026-03-04T12:00:00.000Z'),
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
      applyDialogChoice,
    });

    assert.equal(calls.length, 2);
    assert.equal(calls[0]?.command, 'swift');
    assert.equal(calls[1]?.command, 'osascript');
  });
});

test('maybeHandleBlockedMacOsDialog permite desactivar desde diálogo', async () => {
  await withTempDir('pumuki-notifications-dialog-disable-', async (repoRoot) => {
    const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];

    maybeHandleBlockedMacOsDialog({
      event: blockedEvent({
        causeCode: 'BACKEND_AVOID_EXPLICIT_ANY',
        causeMessage: 'Avoid explicit any in backend code.',
        remediation: 'Tipa el valor y elimina any explícito en backend.',
      }),
      repoRoot,
      config: { enabled: true, channel: 'macos', blockedDialogEnabled: true },
      env: {
        PUMUKI_MACOS_BLOCKED_DIALOG: '1',
      } as NodeJS.ProcessEnv,
      nowMs: Date.parse('2026-03-04T12:00:00.000Z'),
      runCommandWithOutput: (command, args) => {
        calls.push({ command, args });
        return {
          exitCode: 0,
          stdout: 'button returned:Desactivar\n',
        };
      },
      applyDialogChoice,
    });

    assert.equal(calls.length, 1);
    const config = readSystemNotificationsConfig(repoRoot);
    assert.equal(config.enabled, false);
    assert.equal(config.muteUntil, undefined);
  });
});
