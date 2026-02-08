import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import { buildMenuGateParams, formatActiveSkillsBundles } from '../framework-menu';

test('returns guidance when no active skills bundles are available', () => {
  const rendered = formatActiveSkillsBundles([]);

  assert.equal(
    rendered,
    'No active skills bundles found. Run `npm run skills:compile` to generate skills.lock.json.'
  );
});

test('renders active skills bundles deterministically by name/version', () => {
  const rendered = formatActiveSkillsBundles([
    {
      name: 'ios-guidelines',
      version: '1.0.0',
      hash: 'b'.repeat(64),
    },
    {
      name: 'backend-guidelines',
      version: '1.2.0',
      hash: 'a'.repeat(64),
    },
  ]);

  assert.equal(
    rendered,
    [
      'Active skills bundles:',
      '- backend-guidelines@1.2.0 hash=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '- ios-guidelines@1.0.0 hash=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    ].join('\n')
  );
});

test('builds menu gate params using stage policy override from skills.policy.json', async () => {
  await withTempDir('pumuki-menu-policy-', async (tempRoot) => {
    writeFileSync(
      join(tempRoot, 'skills.policy.json'),
      JSON.stringify(
        {
          version: '1.0',
          defaultBundleEnabled: true,
          stages: {
            PRE_COMMIT: { blockOnOrAbove: 'CRITICAL', warnOnOrAbove: 'ERROR' },
            PRE_PUSH: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'ERROR' },
            CI: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
          },
          bundles: {},
        },
        null,
        2
      ),
      'utf8'
    );

    const params = buildMenuGateParams({
      stage: 'PRE_PUSH',
      scope: {
        kind: 'range',
        fromRef: 'origin/main',
        toRef: 'HEAD',
      },
      repoRoot: tempRoot,
    });

    assert.equal(params.policy.stage, 'PRE_PUSH');
    assert.equal(params.policy.blockOnOrAbove, 'ERROR');
    assert.equal(params.policy.warnOnOrAbove, 'ERROR');
    assert.equal(params.policyTrace.bundle, 'gate-policy.skills.policy.PRE_PUSH');
    assert.equal(params.scope.kind, 'range');
    assert.equal(params.scope.fromRef, 'origin/main');
    assert.equal(params.scope.toRef, 'HEAD');
  });
});

test('builds menu gate params with default policy trace when skills policy is missing', async () => {
  await withTempDir('pumuki-menu-policy-default-', async (tempRoot) => {
    const params = buildMenuGateParams({
      stage: 'CI',
      scope: { kind: 'staged' },
      repoRoot: tempRoot,
    });

    assert.equal(params.policy.stage, 'CI');
    assert.equal(params.policy.blockOnOrAbove, 'ERROR');
    assert.equal(params.policy.warnOnOrAbove, 'WARN');
    assert.equal(params.policyTrace.bundle, 'gate-policy.default.CI');
    assert.equal(params.scope.kind, 'staged');
  });
});
