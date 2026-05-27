import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyDialogChoice,
  readSystemNotificationsConfig,
} from '../framework-menu-system-notifications-config';
import { maybeHandleBlockedMacOsDialog } from '../framework-menu-system-notifications-macos-dialog';
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

test('build blocked dialog prioriza causas skills antes que tracking', async () => {
  await withTempDir('pumuki-notifications-dialog-skills-first-', async (repoRoot) => {
    const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];

    maybeHandleBlockedMacOsDialog({
      event: blockedEvent({
        totalViolations: 2,
        causeCode: 'TRACKING_CANONICAL_IN_PROGRESS_INVALID',
        causeMessage: 'Tracking bloqueado: line_970 en PUMUKI-RESET-MASTER-PLAN.md.',
        remediation: 'Corrige el MD de tracking.',
        blockingCauses: [
          {
            code: 'TRACKING_CANONICAL_IN_PROGRESS_INVALID',
            message: 'Tracking bloqueado: line_970 en PUMUKI-RESET-MASTER-PLAN.md.',
            file: 'PUMUKI-RESET-MASTER-PLAN.md',
            remediation: 'Corrige el MD de tracking.',
          },
          {
            code: 'SKILLS_BACKEND_NO_CONSOLE_LOG',
            ruleId: 'skills.backend.no-console-log',
            message: 'Disallow console.log in backend production code. lines=7',
            file: 'apps/backend/src/service.ts',
            remediation: 'Reemplaza console.log por logger estructurado.',
          },
        ],
      }),
      repoRoot,
      config: { enabled: true, channel: 'macos', blockedDialogEnabled: true },
      env: { PUMUKI_MACOS_BLOCKED_DIALOG_MODE: 'applescript' } as NodeJS.ProcessEnv,
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

    const script = String(calls[0]?.args[1] ?? '');
    assert.match(script, /1\. Regla: skills\.backend\.no-console-log/);
    assert.match(script, /2\. Regla: TRACKING_CANONICAL_IN_PROGRESS_INVALID/);
  });
});
