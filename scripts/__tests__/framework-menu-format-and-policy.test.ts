import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import { buildMenuGateParams, formatActiveSkillsBundles } from '../framework-menu';
import { loadAndFormatActiveSkillsBundles } from '../framework-menu-skills-lib';

const withCoreSkillsDisabled = async (run: () => Promise<void>): Promise<void> => {
  const previous = process.env.PUMUKI_DISABLE_CORE_SKILLS;
  process.env.PUMUKI_DISABLE_CORE_SKILLS = '1';
  try {
    await run();
  } finally {
    if (typeof previous === 'string') {
      process.env.PUMUKI_DISABLE_CORE_SKILLS = previous;
    } else {
      delete process.env.PUMUKI_DISABLE_CORE_SKILLS;
    }
  }
};

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

test('loadAndFormatActiveSkillsBundles uses effective lock (repo + custom) for diagnostics output', async () => {
  await withCoreSkillsDisabled(async () => withTempDir('pumuki-menu-skills-effective-', async (tempRoot) => {
    const repoLock = {
      version: '1.0',
      compilerVersion: '1.0.0',
      generatedAt: '2026-02-22T19:20:00.000Z',
      bundles: [
        {
          name: 'repo-local-guidelines',
          version: '1.0.0',
          source: 'file:docs/repo/SKILL.md',
          hash: 'a'.repeat(64),
          rules: [
            {
              id: 'skills.repo.sample',
              description: 'Sample repo rule.',
              severity: 'WARN',
              platform: 'generic',
              sourceSkill: 'repo-local-guidelines',
              sourcePath: 'docs/repo/SKILL.md',
            },
          ],
        },
      ],
    } as const;
    writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(repoLock, null, 2), 'utf8');

    mkdirSync(join(tempRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      join(tempRoot, '.pumuki/custom-rules.json'),
      JSON.stringify(
        {
          version: '1.0',
          generatedAt: '2026-02-22T19:21:00.000Z',
          source_files: ['AGENTS.md'],
          rules: [
            {
              id: 'skills.custom.sample',
              description: 'Sample custom rule.',
              severity: 'ERROR',
              platform: 'backend',
              evaluationMode: 'DECLARATIVE',
            },
          ],
        },
        null,
        2
      ),
      'utf8'
    );

    const rendered = loadAndFormatActiveSkillsBundles(tempRoot);
    assert.equal(rendered.startsWith('Active skills bundles:\n'), true);
    assert.match(
      rendered,
      /- custom-guidelines@1\.0\.0 hash=[a-f0-9]{64}/
    );
    assert.match(
      rendered,
      /- repo-local-guidelines@1\.0\.0 hash=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/
    );
  }));
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
