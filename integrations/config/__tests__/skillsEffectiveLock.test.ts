import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { __resetCoreSkillsLockCacheForTests } from '../coreSkillsLock';
import { loadEffectiveSkillsLock } from '../skillsEffectiveLock';

const withCoreSkillsEnv = async (
  value: string | undefined,
  run: () => Promise<void>
): Promise<void> => {
  const previous = process.env.PUMUKI_DISABLE_CORE_SKILLS;
  if (typeof value === 'string') {
    process.env.PUMUKI_DISABLE_CORE_SKILLS = value;
  } else {
    delete process.env.PUMUKI_DISABLE_CORE_SKILLS;
  }

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

const createRepoLockFixture = (repoRoot: string): void => {
  const lock = {
    version: '1.0',
    compilerVersion: '1.0.0',
    generatedAt: '2026-02-22T18:30:00.000Z',
    bundles: [
      {
        name: 'repo-local-guidelines',
        version: '1.0.0',
        source: 'file:docs/repo-local/SKILL.md',
        hash: 'a'.repeat(64),
        rules: [
          {
            id: 'skills.repo.local.rule',
            description: 'Repo local deterministic rule fixture.',
            severity: 'WARN',
            platform: 'generic',
            sourceSkill: 'repo-local-guidelines',
            sourcePath: 'docs/repo-local/SKILL.md',
            evaluationMode: 'DECLARATIVE',
            origin: 'core',
          },
        ],
      },
    ],
  } as const;

  writeFileSync(join(repoRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));
};

const createCustomRulesFixture = (repoRoot: string): void => {
  mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
  const customRules = {
    version: '1.0',
    generatedAt: '2026-02-22T18:35:00.000Z',
    source_files: ['AGENTS.md'],
    rules: [
      {
        id: 'skills.custom.repo.rule',
        description: 'Custom rule fixture for effective lock merge.',
        severity: 'ERROR',
        platform: 'backend',
        evaluationMode: 'DECLARATIVE',
      },
    ],
  } as const;
  writeFileSync(join(repoRoot, '.pumuki/custom-rules.json'), JSON.stringify(customRules, null, 2));
};

test('falls back to core lock when repo does not provide local lock files', async () => {
  await withCoreSkillsEnv(undefined, async () => withTempDir('pumuki-skills-effective-core-', async (tempRoot) => {
    __resetCoreSkillsLockCacheForTests();
    const lock = loadEffectiveSkillsLock(tempRoot);
    assert.ok(lock);
    assert.equal(lock.bundles.length > 0, true);
  }));
});

test('returns undefined when core is disabled and repo has no local sources', async () => {
  await withCoreSkillsEnv('1', async () => withTempDir('pumuki-skills-effective-empty-', async (tempRoot) => {
    const lock = loadEffectiveSkillsLock(tempRoot);
    assert.equal(lock, undefined);
  }));
});

test('loads repo lock when core is disabled', async () => {
  await withCoreSkillsEnv('1', async () => withTempDir('pumuki-skills-effective-local-', async (tempRoot) => {
    createRepoLockFixture(tempRoot);
    const lock = loadEffectiveSkillsLock(tempRoot);
    assert.ok(lock);
    assert.equal(lock.bundles.length, 1);
    assert.equal(lock.bundles[0]?.name, 'repo-local-guidelines');
  }));
});

test('merges repo lock and custom rules when both are present', async () => {
  await withCoreSkillsEnv('1', async () => withTempDir('pumuki-skills-effective-custom-', async (tempRoot) => {
    createRepoLockFixture(tempRoot);
    createCustomRulesFixture(tempRoot);
    const lock = loadEffectiveSkillsLock(tempRoot);
    assert.ok(lock);

    const bundleNames = lock.bundles.map((bundle) => bundle.name).sort();
    assert.deepEqual(bundleNames, ['custom-guidelines', 'repo-local-guidelines']);
  }));
});
