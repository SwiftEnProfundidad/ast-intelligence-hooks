import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import {
  applyDialogChoice,
  buildSystemNotificationsConfigFromSelection,
  isMutedAt,
  persistSystemNotificationsConfig,
  readSystemNotificationsConfig,
} from '../framework-menu-system-notifications-config';
import { BLOCKED_DIALOG_DISABLE, BLOCKED_DIALOG_MUTE_30 } from '../framework-menu-system-notifications-types';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

test('buildSystemNotificationsConfigFromSelection construye config macOS habilitada', () => {
  assert.deepEqual(buildSystemNotificationsConfigFromSelection(true), {
    enabled: true,
    channel: 'macos',
    blockedDialogEnabled: true,
  });
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

test('persistSystemNotificationsConfig persiste desactivación accionable', async () => {
  await withTempDir('pumuki-notifications-persist-disable-', async (repoRoot) => {
    persistSystemNotificationsConfig(repoRoot, false);
    const config = readSystemNotificationsConfig(repoRoot);
    assert.equal(config.enabled, false);
    assert.equal(config.channel, 'macos');
    assert.equal(config.blockedDialogEnabled, true);
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

test('isMutedAt distingue muteUntil válido y expirado', () => {
  assert.equal(
    isMutedAt(
      {
        enabled: true,
        channel: 'macos',
        muteUntil: '2099-01-01T00:00:00.000Z',
      },
      Date.parse('2026-03-04T12:00:00.000Z')
    ),
    true
  );
  assert.equal(
    isMutedAt(
      {
        enabled: true,
        channel: 'macos',
        muteUntil: '2020-01-01T00:00:00.000Z',
      },
      Date.parse('2026-03-04T12:00:00.000Z')
    ),
    false
  );
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
