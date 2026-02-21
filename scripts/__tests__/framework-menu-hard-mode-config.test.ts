import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import { createFrameworkMenuActions } from '../framework-menu-actions';
import type { FrameworkMenuActionContext } from '../framework-menu-action-contract';
import {
  buildHardModeConfigFromSelection,
  persistHardModeConfig,
} from '../framework-menu-runners-validation-hardmode-lib';
import {
  buildSystemNotificationsConfigFromSelection,
  persistSystemNotificationsConfig,
} from '../framework-menu-system-notifications-lib';

const createMenuContext = (): FrameworkMenuActionContext => {
  return {
    prompts: {} as FrameworkMenuActionContext['prompts'],
    runStaged: async () => {},
    runRange: async () => {},
    runRepoAudit: async () => {},
    runRepoAndStagedAudit: async () => {},
    runStagedAndUnstagedAudit: async () => {},
    resolveDefaultRangeFrom: () => 'origin/main',
    printActiveSkillsBundles: () => {},
  };
};

test('framework menu expone accion para configurar hard mode enterprise', () => {
  const actions = createFrameworkMenuActions(createMenuContext());
  const hardModeAction = actions.find((action) => action.id === '18');

  assert.ok(hardModeAction);
  assert.match(hardModeAction.label, /hard mode|enforcement|config/i);
});

test('framework menu expone accion para configurar notificaciones macOS', () => {
  const actions = createFrameworkMenuActions(createMenuContext());
  const notificationsAction = actions.find((action) => action.id === '31');

  assert.ok(notificationsAction);
  assert.match(notificationsAction.label, /notifications|macos|system/i);
});

test('buildHardModeConfigFromSelection soporta critical-high y all-severities', () => {
  assert.deepEqual(buildHardModeConfigFromSelection('critical-high'), {
    enabled: true,
    profile: 'critical-high',
  });
  assert.deepEqual(buildHardModeConfigFromSelection('all-severities'), {
    enabled: true,
    profile: 'all-severities',
  });
});

test('persistHardModeConfig guarda hard mode en .pumuki/hard-mode.json', async () => {
  await withTempDir('pumuki-framework-hard-mode-menu-', async (repoRoot) => {
    const configPath = persistHardModeConfig(repoRoot, 'all-severities');
    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as {
      enabled: unknown;
      profile: unknown;
    };
    assert.equal(configPath, join(repoRoot, '.pumuki', 'hard-mode.json'));
    assert.deepEqual(parsed, {
      enabled: true,
      profile: 'all-severities',
    });
  });
});

test('buildSystemNotificationsConfigFromSelection soporta enabled true/false', () => {
  assert.deepEqual(buildSystemNotificationsConfigFromSelection(true), {
    enabled: true,
    channel: 'macos',
  });
  assert.deepEqual(buildSystemNotificationsConfigFromSelection(false), {
    enabled: false,
    channel: 'macos',
  });
});

test('persistSystemNotificationsConfig guarda config en .pumuki/system-notifications.json', async () => {
  await withTempDir('pumuki-framework-system-notifications-', async (repoRoot) => {
    const configPath = persistSystemNotificationsConfig(repoRoot, false);
    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as {
      enabled: unknown;
      channel: unknown;
    };
    assert.equal(configPath, join(repoRoot, '.pumuki', 'system-notifications.json'));
    assert.deepEqual(parsed, {
      enabled: false,
      channel: 'macos',
    });
  });
});

test('accion 18 persiste perfil hard mode seleccionado desde prompts', async () => {
  await withTempDir('pumuki-framework-hard-mode-action-', async (repoRoot) => {
    const previousCwd = process.cwd();
    process.chdir(repoRoot);
    try {
      const actions = createFrameworkMenuActions({
        prompts: {
          askHardModeProfile: async () => 'all-severities',
        } as FrameworkMenuActionContext['prompts'],
        runStaged: async () => {},
        runRange: async () => {},
        runRepoAudit: async () => {},
        runRepoAndStagedAudit: async () => {},
        runStagedAndUnstagedAudit: async () => {},
        resolveDefaultRangeFrom: () => 'origin/main',
        printActiveSkillsBundles: () => {},
      });
      const hardModeAction = actions.find((action) => action.id === '18');
      assert.ok(hardModeAction);
      await hardModeAction.execute();

      const parsed = JSON.parse(
        readFileSync(join(repoRoot, '.pumuki', 'hard-mode.json'), 'utf8')
      ) as { enabled: unknown; profile: unknown };
      assert.deepEqual(parsed, {
        enabled: true,
        profile: 'all-severities',
      });
    } finally {
      process.chdir(previousCwd);
    }
  });
});

test('accion 31 persiste toggle de notificaciones macOS desde prompts', async () => {
  await withTempDir('pumuki-framework-notifications-action-', async (repoRoot) => {
    const previousCwd = process.cwd();
    process.chdir(repoRoot);
    try {
      const actions = createFrameworkMenuActions({
        prompts: {
          askHardModeProfile: async () => 'critical-high',
          askSystemNotificationsEnabled: async () => false,
        } as FrameworkMenuActionContext['prompts'],
        runStaged: async () => {},
        runRange: async () => {},
        runRepoAudit: async () => {},
        runRepoAndStagedAudit: async () => {},
        runStagedAndUnstagedAudit: async () => {},
        resolveDefaultRangeFrom: () => 'origin/main',
        printActiveSkillsBundles: () => {},
      });
      const notificationsAction = actions.find((action) => action.id === '31');
      assert.ok(notificationsAction);
      await notificationsAction.execute();

      const parsed = JSON.parse(
        readFileSync(join(repoRoot, '.pumuki', 'system-notifications.json'), 'utf8')
      ) as { enabled: unknown; channel: unknown };
      assert.deepEqual(parsed, {
        enabled: false,
        channel: 'macos',
      });
    } finally {
      process.chdir(previousCwd);
    }
  });
});
