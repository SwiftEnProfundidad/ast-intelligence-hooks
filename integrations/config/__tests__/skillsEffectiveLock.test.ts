import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { __resetCoreSkillsLockCacheForTests } from '../coreSkillsLock';
import {
  loadEffectiveSkillsLock,
  loadRequiredSkillsLock,
} from '../skillsEffectiveLock';

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

const createVendoredBackendSkillFixture = (repoRoot: string): void => {
  mkdirSync(join(repoRoot, 'docs/codex-skills'), { recursive: true });
  writeFileSync(
    join(repoRoot, 'docs/codex-skills/windsurf-rules-backend.md'),
    ['- ❌ Avoid empty catch blocks in backend runtime code.'].join('\n')
  );
  writeFileSync(
    join(repoRoot, 'AGENTS.md'),
    ['# Skills', '- `windsurf-rules-backend`: `docs/codex-skills/windsurf-rules-backend.md`'].join('\n')
  );
};

const createRequiredSkillsManifestFixture = (repoRoot: string): void => {
  const skills = [
    {
      name: 'windsurf-rules-ios',
      file: 'vendor/skills/windsurf-rules-ios/SKILL.md',
      content: '- Keep ViewModels focused on a single feature boundary.\n',
    },
    {
      name: 'swift-concurrency',
      file: 'vendor/skills/swift-concurrency/SKILL.md',
      content: '- Prefer actor isolation for mutable shared state.\n',
    },
    {
      name: 'swiftui-expert-skill',
      file: 'vendor/skills/swiftui-expert-skill/SKILL.md',
      content: '- Use focused presentation state per view boundary.\n',
    },
    {
      name: 'windsurf-rules-android',
      file: 'vendor/skills/windsurf-rules-android/SKILL.md',
      content: '- Keep Compose screens aligned with feature boundaries.\n',
    },
    {
      name: 'windsurf-rules-backend',
      file: 'vendor/skills/windsurf-rules-backend/SKILL.md',
      content: '- ❌ Avoid empty catch blocks in backend runtime code.\n',
    },
    {
      name: 'windsurf-rules-frontend',
      file: 'vendor/skills/windsurf-rules-frontend/SKILL.md',
      content: '- ❌ Avoid explicit any in frontend runtime code.\n',
    },
  ];

  for (const skill of skills) {
    mkdirSync(join(repoRoot, skill.file.replace(/\/SKILL\.md$/i, '')), {
      recursive: true,
    });
    writeFileSync(join(repoRoot, skill.file), skill.content);
  }

  writeFileSync(
    join(repoRoot, 'vendor/skills/MANIFEST.json'),
    JSON.stringify(
      {
        version: 1,
        skills: skills.map(({ name, file }) => ({ name, file })),
      },
      null,
      2
    )
  );

  writeFileSync(
    join(repoRoot, 'AGENTS.md'),
    [
      '# Required skills',
      "REQUIRED SKILL: 'windsurf-rules-ios'",
      "REQUIRED SKILL: 'swift-concurrency'",
      "REQUIRED SKILL: 'swiftui-expert-skill'",
      "REQUIRED SKILL: 'windsurf-rules-android'",
      "REQUIRED SKILL: 'windsurf-rules-backend'",
      "REQUIRED SKILL: 'windsurf-rules-frontend'",
    ].join('\n')
  );
};

const createEnterpriseRequiredSkillsManifestFixture = (repoRoot: string): void => {
  const skills = [
    {
      name: 'ios-enterprise-rules',
      file: 'vendor/skills/ios-enterprise-rules/SKILL.md',
      content: '- Keep ViewModels focused on a single feature boundary.\n',
    },
    {
      name: 'swift-concurrency',
      file: 'vendor/skills/swift-concurrency/SKILL.md',
      content: '- Prefer actor isolation for mutable shared state.\n',
    },
    {
      name: 'swiftui-expert-skill',
      file: 'vendor/skills/swiftui-expert-skill/SKILL.md',
      content: '- Use focused presentation state per view boundary.\n',
    },
    {
      name: 'android-enterprise-rules',
      file: 'vendor/skills/android-enterprise-rules/SKILL.md',
      content: '- Keep Compose screens aligned with feature boundaries.\n',
    },
    {
      name: 'backend-enterprise-rules',
      file: 'vendor/skills/backend-enterprise-rules/SKILL.md',
      content: '- ❌ Avoid empty catch blocks in backend runtime code.\n',
    },
    {
      name: 'frontend-enterprise-rules',
      file: 'vendor/skills/frontend-enterprise-rules/SKILL.md',
      content: '- ❌ Avoid explicit any in frontend runtime code.\n',
    },
  ];

  for (const skill of skills) {
    mkdirSync(join(repoRoot, skill.file.replace(/\/SKILL\.md$/i, '')), {
      recursive: true,
    });
    writeFileSync(join(repoRoot, skill.file), skill.content);
  }

  writeFileSync(
    join(repoRoot, 'vendor/skills/MANIFEST.json'),
    JSON.stringify(
      {
        version: 1,
        skills: skills.map(({ name, file }) => ({ name, file })),
      },
      null,
      2
    )
  );

  writeFileSync(
    join(repoRoot, 'AGENTS.md'),
    [
      '# Required skills',
      "REQUIRED SKILL: 'ios-enterprise-rules'",
      "REQUIRED SKILL: 'swift-concurrency'",
      "REQUIRED SKILL: 'swiftui-expert-skill'",
      "REQUIRED SKILL: 'android-enterprise-rules'",
      "REQUIRED SKILL: 'backend-enterprise-rules'",
      "REQUIRED SKILL: 'frontend-enterprise-rules'",
    ].join('\n')
  );
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

test('loads imported vendored skills into effective lock when AGENTS references repo skills', async () => {
  await withCoreSkillsEnv('1', async () => withTempDir('pumuki-skills-effective-imported-', async (tempRoot) => {
    createVendoredBackendSkillFixture(tempRoot);

    const lock = loadEffectiveSkillsLock(tempRoot);
    assert.ok(lock);

    const backendBundle = lock.bundles.find((bundle) => bundle.name === 'backend-guidelines');
    assert.ok(backendBundle);
    assert.equal(
      backendBundle.rules.some((rule) => rule.id === 'skills.backend.no-empty-catch'),
      true
    );
  }));
});

test('loads imported vendored skills into required lock when AGENTS references repo skills', async () => {
  await withCoreSkillsEnv('1', async () => withTempDir('pumuki-skills-required-imported-', async (tempRoot) => {
    createVendoredBackendSkillFixture(tempRoot);

    const lock = loadRequiredSkillsLock(tempRoot);
    assert.ok(lock);

    const backendBundle = lock.bundles.find((bundle) => bundle.name === 'backend-guidelines');
    assert.ok(backendBundle);
    assert.equal(
      backendBundle.rules.some((rule) => rule.id === 'skills.backend.no-empty-catch'),
      true
    );
  }));
});

test('loads required vendored skills from AGENTS required names and vendor manifest', async () => {
  await withCoreSkillsEnv('1', async () =>
    withTempDir('pumuki-skills-required-manifest-', async (tempRoot) => {
      createRequiredSkillsManifestFixture(tempRoot);

      const lock = loadRequiredSkillsLock(tempRoot);
      assert.ok(lock);

      const bundleNames = lock.bundles.map((bundle) => bundle.name).sort();
      assert.deepEqual(bundleNames, [
        'android-guidelines',
        'backend-guidelines',
        'frontend-guidelines',
        'ios-concurrency-guidelines',
        'ios-guidelines',
        'ios-swiftui-expert-guidelines',
      ]);
    })
  );
});

test('loads effective vendored skills from AGENTS required names and vendor manifest', async () => {
  await withCoreSkillsEnv('1', async () =>
    withTempDir('pumuki-skills-effective-manifest-', async (tempRoot) => {
      createRequiredSkillsManifestFixture(tempRoot);

      const lock = loadEffectiveSkillsLock(tempRoot);
      assert.ok(lock);

      const bundleNames = lock.bundles.map((bundle) => bundle.name).sort();
      assert.deepEqual(bundleNames, [
        'android-guidelines',
        'backend-guidelines',
        'frontend-guidelines',
        'ios-concurrency-guidelines',
        'ios-guidelines',
        'ios-swiftui-expert-guidelines',
      ]);
    })
  );
});

test('loads required vendored enterprise skills into canonical bundles when AGENTS uses consumer naming', async () => {
  await withCoreSkillsEnv('1', async () =>
    withTempDir('pumuki-skills-required-enterprise-manifest-', async (tempRoot) => {
      createEnterpriseRequiredSkillsManifestFixture(tempRoot);

      const lock = loadRequiredSkillsLock(tempRoot);
      assert.ok(lock);

      const bundleNames = lock.bundles.map((bundle) => bundle.name).sort();
      assert.deepEqual(bundleNames, [
        'android-guidelines',
        'backend-guidelines',
        'frontend-guidelines',
        'ios-concurrency-guidelines',
        'ios-guidelines',
        'ios-swiftui-expert-guidelines',
      ]);
    })
  );
});

test('loads effective vendored enterprise skills into canonical bundles when AGENTS uses consumer naming', async () => {
  await withCoreSkillsEnv('1', async () =>
    withTempDir('pumuki-skills-effective-enterprise-manifest-', async (tempRoot) => {
      createEnterpriseRequiredSkillsManifestFixture(tempRoot);

      const lock = loadEffectiveSkillsLock(tempRoot);
      assert.ok(lock);

      const bundleNames = lock.bundles.map((bundle) => bundle.name).sort();
      assert.deepEqual(bundleNames, [
        'android-guidelines',
        'backend-guidelines',
        'frontend-guidelines',
        'ios-concurrency-guidelines',
        'ios-guidelines',
        'ios-swiftui-expert-guidelines',
      ]);
    })
  );
});
