import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { resolvePolicyProfileForStage } from '../policyProfiles';

test('resolvePolicyProfileForStage returns default policy profile when no overrides exist', async () => {
  await withTempDir('pumuki-policy-profile-default-', async (repoRoot) => {
    const resolved = resolvePolicyProfileForStage('PRE_PUSH', repoRoot);

    assert.equal(resolved.source, 'default');
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
