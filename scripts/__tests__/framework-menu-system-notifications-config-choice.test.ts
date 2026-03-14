import assert from 'node:assert/strict';
import test from 'node:test';
import { applyDialogChoice } from '../framework-menu-system-notifications-config-choice';
import { readSystemNotificationsConfig } from '../framework-menu-system-notifications-config-state';
import { BLOCKED_DIALOG_DISABLE, BLOCKED_DIALOG_KEEP, BLOCKED_DIALOG_MUTE_30 } from '../framework-menu-system-notifications-types';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

test('applyDialogChoice no persiste nada cuando se elige mantener activas', async () => {
  await withTempDir('pumuki-notifications-dialog-keep-', async (repoRoot) => {
    applyDialogChoice({
      repoRoot,
      config: {
        enabled: true,
        channel: 'macos',
        blockedDialogEnabled: true,
      },
      button: BLOCKED_DIALOG_KEEP,
      nowMs: Date.parse('2026-03-04T12:00:00.000Z'),
    });

    const config = readSystemNotificationsConfig(repoRoot);
    assert.equal(config.enabled, true);
    assert.equal(config.muteUntil, undefined);
  });
});

test('applyDialogChoice permite silenciar 30 min', async () => {
  await withTempDir('pumuki-notifications-dialog-mute30-', async (repoRoot) => {
    const nowMs = Date.parse('2026-03-04T12:00:00.000Z');
    applyDialogChoice({
      repoRoot,
      config: {
        enabled: true,
        channel: 'macos',
        blockedDialogEnabled: true,
      },
      button: BLOCKED_DIALOG_MUTE_30,
      nowMs,
    });

    const config = readSystemNotificationsConfig(repoRoot);
    assert.equal(config.enabled, true);
    assert.ok(config.muteUntil);
    assert.equal(Date.parse(config.muteUntil ?? ''), nowMs + 30 * 60_000);
  });
});

test('applyDialogChoice permite desactivar notificaciones', async () => {
  await withTempDir('pumuki-notifications-dialog-disable-', async (repoRoot) => {
    applyDialogChoice({
      repoRoot,
      config: {
        enabled: true,
        channel: 'macos',
        blockedDialogEnabled: true,
      },
      button: BLOCKED_DIALOG_DISABLE,
      nowMs: Date.parse('2026-03-04T12:00:00.000Z'),
    });

    const config = readSystemNotificationsConfig(repoRoot);
    assert.equal(config.enabled, false);
    assert.equal(config.muteUntil, undefined);
  });
});
