import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveEffectiveSystemNotificationsConfig } from '../framework-menu-system-notifications-effective-config';
import { persistSystemNotificationsConfig } from '../framework-menu-system-notifications-config';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

test('resolveEffectiveSystemNotificationsConfig prioriza config explícita', async () => {
  await withTempDir('pumuki-notifications-effective-config-', async (repoRoot) => {
    persistSystemNotificationsConfig(repoRoot, {
      enabled: false,
      channel: 'macos',
    });

    const config = resolveEffectiveSystemNotificationsConfig({
      repoRoot,
      config: { enabled: true, channel: 'macos' },
    });

    assert.deepEqual(config, { enabled: true, channel: 'macos' });
  });
});

test('resolveEffectiveSystemNotificationsConfig lee config persistida si hay repoRoot', async () => {
  await withTempDir('pumuki-notifications-effective-config-', async (repoRoot) => {
    persistSystemNotificationsConfig(repoRoot, {
      enabled: false,
      channel: 'macos',
    });

    const config = resolveEffectiveSystemNotificationsConfig({ repoRoot });

    assert.deepEqual(config, { enabled: false, channel: 'macos', blockedDialogEnabled: false });
  });
});
