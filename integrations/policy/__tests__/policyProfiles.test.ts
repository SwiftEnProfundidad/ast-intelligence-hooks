import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import {
  readPersistedHardModeConfig,
  resolveCorePolicyForStage,
  resolveDefaultAdvisoryPolicyProfileForStage,
  resolveExplicitPolicyPackSelection,
  resolveExplicitPolicyProfileForStage,
  resolveHardModeRuntimeState,
  resolvePolicyProfileForStage,
} from '../policyProfiles';

test('resolveCorePolicyForStage returns the base core policy without policy-pack activation', () => {
  assert.deepEqual(resolveCorePolicyForStage('PRE_PUSH'), {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  });
});

test('resolveDefaultAdvisoryPolicyProfileForStage returns the advisory fallback pack explicitly', () => {
  const resolved = resolveDefaultAdvisoryPolicyProfileForStage('PRE_PUSH');

  assert.equal(resolved.source, 'default');
  assert.equal(resolved.layer, 'policy-pack');
  assert.equal(resolved.activation, 'default-advisory');
  assert.equal(resolved.activationSource, null);
  assert.equal(resolved.bundle, 'gate-policy.default.PRE_PUSH');
  assert.deepEqual(resolved.policy, {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  });
});

test('resolveExplicitPolicyProfileForStage returns null when no explicit pack is active', async () => {
  await withTempDir('pumuki-policy-profile-explicit-none-', async (repoRoot) => {
    const resolved = resolveExplicitPolicyProfileForStage('PRE_PUSH', repoRoot);
    assert.equal(resolved, null);
  });
});

test('readPersistedHardModeConfig reads deterministic hard mode config from repo', async () => {
  await withTempDir('pumuki-policy-pack-hard-mode-file-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      join(repoRoot, '.pumuki', 'hard-mode.json'),
      JSON.stringify({ enabled: true, profile: 'critical-high' }, null, 2),
      'utf8'
    );

    const persisted = readPersistedHardModeConfig(repoRoot);
    assert.deepEqual(persisted, {
      enabled: true,
      profileName: 'critical-high',
      configPath: '.pumuki/hard-mode.json',
    });
  });
});

test('resolveHardModeRuntimeState lets env override persisted hard mode config', async () => {
  await withTempDir('pumuki-policy-pack-hard-mode-runtime-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      join(repoRoot, '.pumuki', 'hard-mode.json'),
      JSON.stringify({ enabled: true, profile: 'all-severities' }, null, 2),
      'utf8'
    );

    const previousHardMode = process.env.PUMUKI_HARD_MODE;
    const previousProfile = process.env.PUMUKI_HARD_MODE_PROFILE;
    process.env.PUMUKI_HARD_MODE = '1';
    process.env.PUMUKI_HARD_MODE_PROFILE = 'critical-high';
    try {
      const runtimeState = resolveHardModeRuntimeState(repoRoot);
      assert.deepEqual(runtimeState, {
        enabled: true,
        profileName: 'critical-high',
        activationSource: 'env',
        configPath: '.pumuki/hard-mode.json',
      });
    } finally {
      if (typeof previousHardMode === 'undefined') {
        delete process.env.PUMUKI_HARD_MODE;
      } else {
        process.env.PUMUKI_HARD_MODE = previousHardMode;
      }
      if (typeof previousProfile === 'undefined') {
        delete process.env.PUMUKI_HARD_MODE_PROFILE;
      } else {
        process.env.PUMUKI_HARD_MODE_PROFILE = previousProfile;
      }
    }
  });
});

test('resolveExplicitPolicyPackSelection returns skills policy when no hard mode is active', async () => {
  await withTempDir('pumuki-policy-pack-skills-selection-', async (repoRoot) => {
    writeFileSync(
      join(repoRoot, 'skills.policy.json'),
      JSON.stringify(
        {
          version: '1.0',
          defaultBundleEnabled: true,
          stages: {
            PRE_COMMIT: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
            PRE_PUSH: { blockOnOrAbove: 'CRITICAL', warnOnOrAbove: 'ERROR' },
            CI: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
          },
          bundles: {},
        },
        null,
        2
      ),
      'utf8'
    );

    const selection = resolveExplicitPolicyPackSelection(repoRoot);
    assert.equal(selection?.source, 'skills.policy');
    assert.equal(selection?.activation, 'explicit');
    assert.equal(selection?.activationSource, 'file:skills.policy.json');
    assert.match(selection?.sourcePolicyHash ?? '', /^[a-f0-9]{64}$/i);
  });
});

test('resolveExplicitPolicyPackSelection prioritizes hard mode over skills policy', async () => {
  await withTempDir('pumuki-policy-pack-hard-mode-priority-', async (repoRoot) => {
    writeFileSync(
      join(repoRoot, 'skills.policy.json'),
      JSON.stringify(
        {
          version: '1.0',
          defaultBundleEnabled: true,
          stages: {
            PRE_COMMIT: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
            PRE_PUSH: { blockOnOrAbove: 'CRITICAL', warnOnOrAbove: 'ERROR' },
            CI: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
          },
          bundles: {},
        },
        null,
        2
      ),
      'utf8'
    );
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      join(repoRoot, '.pumuki', 'hard-mode.json'),
      JSON.stringify({ enabled: true, profile: 'critical-high' }, null, 2),
      'utf8'
    );

    const selection = resolveExplicitPolicyPackSelection(repoRoot);
    assert.deepEqual(selection, {
      source: 'hard-mode',
      activation: 'explicit',
      activationSource: 'file:.pumuki/hard-mode.json',
      profileName: 'critical-high',
    });
  });
});

test('resolvePolicyProfileForStage returns default policy profile when no overrides exist', async () => {
  await withTempDir('pumuki-policy-profile-default-', async (repoRoot) => {
    const resolved = resolvePolicyProfileForStage('PRE_PUSH', repoRoot);

    assert.equal(resolved.source, 'default');
    assert.equal(resolved.layer, 'policy-pack');
    assert.equal(resolved.activation, 'default-advisory');
    assert.equal(resolved.activationSource, null);
    assert.equal(resolved.bundle, 'gate-policy.default.PRE_PUSH');
    assert.deepEqual(resolved.policy, {
      stage: 'PRE_PUSH',
      blockOnOrAbove: 'ERROR',
      warnOnOrAbove: 'WARN',
    });
    assert.equal(resolved.sourcePolicyHash, undefined);
  });
});

test('resolvePolicyProfileForStage returns skills policy profile when skills.policy.json exists', async () => {
  await withTempDir('pumuki-policy-profile-skills-', async (repoRoot) => {
    writeFileSync(
      join(repoRoot, 'skills.policy.json'),
      JSON.stringify(
        {
          version: '1.0',
          defaultBundleEnabled: true,
          stages: {
            PRE_COMMIT: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
            PRE_PUSH: { blockOnOrAbove: 'CRITICAL', warnOnOrAbove: 'ERROR' },
            CI: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
          },
          bundles: {},
        },
        null,
        2
      ),
      'utf8'
    );

      const resolved = resolvePolicyProfileForStage('PRE_PUSH', repoRoot);

      assert.equal(resolved.source, 'skills.policy');
      assert.equal(resolved.layer, 'policy-pack');
      assert.equal(resolved.activation, 'explicit');
      assert.equal(resolved.activationSource, 'file:skills.policy.json');
      assert.equal(resolved.bundle, 'gate-policy.skills.policy.PRE_PUSH');
    assert.deepEqual(resolved.policy, {
      stage: 'PRE_PUSH',
      blockOnOrAbove: 'CRITICAL',
      warnOnOrAbove: 'ERROR',
    });
    assert.match(resolved.sourcePolicyHash ?? '', /^[a-f0-9]{64}$/i);
  });
});

test('resolvePolicyProfileForStage returns hard mode profile from environment', async () => {
  await withTempDir('pumuki-policy-profile-hard-mode-env-', async (repoRoot) => {
    const previousHardMode = process.env.PUMUKI_HARD_MODE;
    const previousProfile = process.env.PUMUKI_HARD_MODE_PROFILE;
    process.env.PUMUKI_HARD_MODE = '1';
    process.env.PUMUKI_HARD_MODE_PROFILE = 'critical-high';

    try {
      const resolved = resolvePolicyProfileForStage('PRE_COMMIT', repoRoot);

      assert.equal(resolved.source, 'hard-mode');
      assert.equal(resolved.layer, 'policy-pack');
      assert.equal(resolved.activation, 'explicit');
      assert.equal(resolved.activationSource, 'env');
      assert.equal(
        resolved.bundle,
        'gate-policy.hard-mode.critical-high.PRE_COMMIT'
      );
      assert.deepEqual(resolved.policy, {
        stage: 'PRE_COMMIT',
        blockOnOrAbove: 'ERROR',
        warnOnOrAbove: 'WARN',
      });
      assert.equal(resolved.sourcePolicyHash, 'critical-high');
    } finally {
      if (typeof previousHardMode === 'undefined') {
        delete process.env.PUMUKI_HARD_MODE;
      } else {
        process.env.PUMUKI_HARD_MODE = previousHardMode;
      }
      if (typeof previousProfile === 'undefined') {
        delete process.env.PUMUKI_HARD_MODE_PROFILE;
      } else {
        process.env.PUMUKI_HARD_MODE_PROFILE = previousProfile;
      }
    }
  });
});

test('resolvePolicyProfileForStage reads hard mode profile from persisted config', async () => {
  await withTempDir('pumuki-policy-profile-hard-mode-config-', async (repoRoot) => {
    const previousHardMode = process.env.PUMUKI_HARD_MODE;
    const previousProfile = process.env.PUMUKI_HARD_MODE_PROFILE;
    delete process.env.PUMUKI_HARD_MODE;
    delete process.env.PUMUKI_HARD_MODE_PROFILE;

    try {
      mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
      writeFileSync(
        join(repoRoot, '.pumuki', 'hard-mode.json'),
        JSON.stringify(
          {
            enabled: true,
            profile: 'all-severities',
          },
          null,
          2
        ),
        'utf8'
      );

      const resolved = resolvePolicyProfileForStage('CI', repoRoot);

      assert.equal(resolved.source, 'hard-mode');
      assert.equal(resolved.layer, 'policy-pack');
      assert.equal(resolved.activation, 'explicit');
      assert.equal(resolved.activationSource, 'file:.pumuki/hard-mode.json');
      assert.equal(
        resolved.bundle,
        'gate-policy.hard-mode.all-severities.CI'
      );
      assert.deepEqual(resolved.policy, {
        stage: 'CI',
        blockOnOrAbove: 'INFO',
        warnOnOrAbove: 'INFO',
      });
      assert.equal(resolved.sourcePolicyHash, 'all-severities');
    } finally {
      if (typeof previousHardMode === 'undefined') {
        delete process.env.PUMUKI_HARD_MODE;
      } else {
        process.env.PUMUKI_HARD_MODE = previousHardMode;
      }
      if (typeof previousProfile === 'undefined') {
        delete process.env.PUMUKI_HARD_MODE_PROFILE;
      } else {
        process.env.PUMUKI_HARD_MODE_PROFILE = previousProfile;
      }
    }
  });
});

test('resolvePolicyProfileForStage lets environment profile override persisted hard mode profile', async () => {
  await withTempDir('pumuki-policy-profile-hard-mode-precedence-', async (repoRoot) => {
    const previousHardMode = process.env.PUMUKI_HARD_MODE;
    const previousProfile = process.env.PUMUKI_HARD_MODE_PROFILE;
    process.env.PUMUKI_HARD_MODE = '1';
    process.env.PUMUKI_HARD_MODE_PROFILE = 'critical-high';

    try {
      mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
      writeFileSync(
        join(repoRoot, '.pumuki', 'hard-mode.json'),
        JSON.stringify(
          {
            enabled: true,
            profile: 'all-severities',
          },
          null,
          2
        ),
        'utf8'
      );

      const resolved = resolvePolicyProfileForStage('PRE_PUSH', repoRoot);

      assert.equal(resolved.source, 'hard-mode');
      assert.equal(resolved.layer, 'policy-pack');
      assert.equal(resolved.activation, 'explicit');
      assert.equal(resolved.activationSource, 'env');
      assert.equal(
        resolved.bundle,
        'gate-policy.hard-mode.critical-high.PRE_PUSH'
      );
      assert.deepEqual(resolved.policy, {
        stage: 'PRE_PUSH',
        blockOnOrAbove: 'ERROR',
        warnOnOrAbove: 'WARN',
      });
      assert.equal(resolved.sourcePolicyHash, 'critical-high');
    } finally {
      if (typeof previousHardMode === 'undefined') {
        delete process.env.PUMUKI_HARD_MODE;
      } else {
        process.env.PUMUKI_HARD_MODE = previousHardMode;
      }
      if (typeof previousProfile === 'undefined') {
        delete process.env.PUMUKI_HARD_MODE_PROFILE;
      } else {
        process.env.PUMUKI_HARD_MODE_PROFILE = previousProfile;
      }
    }
  });
});
