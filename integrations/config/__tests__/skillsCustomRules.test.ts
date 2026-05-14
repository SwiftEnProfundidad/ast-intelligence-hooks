import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import {
  canonicalImportedSkillNameFromPath,
  importCustomSkillsRules,
  loadCustomSkillsLock,
  loadCustomSkillsRulesFile,
  resolveSkillImportSources,
} from '../skillsCustomRules';
import { loadSkillsRuleSetForStage } from '../skillsRuleSet';

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

test('loads custom rules file and transforms it into custom-guidelines lock bundle', async () => {
  await withTempDir('pumuki-skills-custom-file-', async (tempRoot) => {
    mkdirSync(join(tempRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      join(tempRoot, '.pumuki/custom-rules.json'),
      JSON.stringify(
        {
          version: '1.0',
          generatedAt: '2026-02-22T19:00:00.000Z',
          source_files: ['AGENTS.md'],
          rules: [
            {
              id: 'skills.custom.backend.guard',
              description: 'Custom backend guard.',
              severity: 'ERROR',
              platform: 'backend',
              evaluationMode: 'DECLARATIVE',
            },
          ],
        },
        null,
        2
      )
    );

    const payload = loadCustomSkillsRulesFile(tempRoot);
    assert.ok(payload);
    assert.equal(payload.rules.length, 1);
    assert.equal(payload.rules[0]?.id, 'skills.custom.backend.guard');

    const lock = loadCustomSkillsLock(tempRoot);
    assert.ok(lock);
    assert.equal(lock.bundles.length, 1);
    assert.equal(lock.bundles[0]?.name, 'custom-guidelines');
    assert.equal(lock.bundles[0]?.rules[0]?.origin, 'custom');
  });
});

test('custom bundle hash cambia cuando cambia ast_node_ids', async () => {
  await withTempDir('pumuki-skills-custom-ast-node-hash-', async (tempRoot) => {
    mkdirSync(join(tempRoot, '.pumuki'), { recursive: true });

    const writeRules = (astNodeIds: string[]) => {
      writeFileSync(
        join(tempRoot, '.pumuki/custom-rules.json'),
        JSON.stringify(
          {
            version: '1.0',
            generatedAt: '2026-03-06T10:00:00.000Z',
            source_files: ['AGENTS.md'],
            rules: [
              {
                id: 'skills.custom.backend.dynamic-ast',
                description: 'Custom backend AST rule.',
                severity: 'ERROR',
                platform: 'backend',
                evaluationMode: 'AUTO',
                ast_node_ids: astNodeIds,
              },
            ],
          },
          null,
          2
        )
      );
    };

    writeRules(['heuristics.ts.explicit-any.ast']);
    const firstHash = loadCustomSkillsLock(tempRoot)?.bundles[0]?.hash;

    writeRules(['heuristics.ts.console-error.ast']);
    const secondHash = loadCustomSkillsLock(tempRoot)?.bundles[0]?.hash;

    assert.ok(firstHash);
    assert.ok(secondHash);
    assert.notEqual(firstHash, secondHash);
  });
});

test('resolveSkillImportSources discovers SKILL.md paths from AGENTS.md', async () => {
  await withTempDir('pumuki-skills-custom-agents-', async (tempRoot) => {
    const localSkillPath = join(tempRoot, 'docs/custom/backend/SKILL.md');
    mkdirSync(join(tempRoot, 'docs/custom/backend'), { recursive: true });
    writeFileSync(localSkillPath, '- ✅ Avoid empty catch blocks.\n');

    writeFileSync(
      join(tempRoot, 'AGENTS.md'),
      [
        '# Skills',
        `- Backend: ${localSkillPath}`,
        '- Local relative: docs/custom/backend/SKILL.md',
      ].join('\n')
    );

    const sources = resolveSkillImportSources({ repoRoot: tempRoot });
    assert.deepEqual(sources, [localSkillPath]);
  });
});

test('resolveSkillImportSources discovers REQUIRED SKILL names via vendor manifest', async () => {
  await withTempDir('pumuki-skills-custom-required-skill-', async (tempRoot) => {
    const backendSkillPath = join(
      tempRoot,
      'vendor/skills/backend-enterprise-rules/SKILL.md'
    );
    const concurrencySkillPath = join(
      tempRoot,
      'vendor/skills/swift-concurrency/SKILL.md'
    );

    mkdirSync(join(tempRoot, 'vendor/skills/backend-enterprise-rules'), {
      recursive: true,
    });
    mkdirSync(join(tempRoot, 'vendor/skills/swift-concurrency'), {
      recursive: true,
    });

    writeFileSync(
      backendSkillPath,
      '- ❌ Avoid empty catch blocks in backend runtime code.\n'
    );
    writeFileSync(
      concurrencySkillPath,
      '- Prefer actor isolation for mutable shared state.\n'
    );
    writeFileSync(
      join(tempRoot, 'vendor/skills/MANIFEST.json'),
      JSON.stringify(
        {
          version: 1,
          skills: [
            {
              name: 'backend-enterprise-rules',
              file: 'vendor/skills/backend-enterprise-rules/SKILL.md',
            },
            {
              name: 'swift-concurrency',
              file: 'vendor/skills/swift-concurrency/SKILL.md',
            },
          ],
        },
        null,
        2
      )
    );
    writeFileSync(
      join(tempRoot, 'AGENTS.md'),
      [
        '# Skills',
        "REQUIRED SKILL: 'backend-enterprise-rules'",
        "REQUIRED SKILL: 'swift-concurrency'",
      ].join('\n')
    );

    const sources = resolveSkillImportSources({ repoRoot: tempRoot }).sort();
    assert.deepEqual(sources, [backendSkillPath, concurrencySkillPath].sort());
  });
});

test('canonicalImportedSkillNameFromPath canoniza nombres enterprise del consumer a bundles runtime', () => {
  assert.equal(
    canonicalImportedSkillNameFromPath(
      '/repo/vendor/skills/ios-enterprise-rules/SKILL.md'
    ),
    'ios-guidelines'
  );
  assert.equal(
    canonicalImportedSkillNameFromPath(
      '/repo/vendor/skills/backend-enterprise-rules/SKILL.md'
    ),
    'backend-guidelines'
  );
  assert.equal(
    canonicalImportedSkillNameFromPath(
      '/repo/vendor/skills/frontend-enterprise-rules/SKILL.md'
    ),
    'frontend-guidelines'
  );
  assert.equal(
    canonicalImportedSkillNameFromPath(
      '/repo/vendor/skills/android-enterprise-rules/SKILL.md'
    ),
    'android-guidelines'
  );
});

test('resolveSkillImportSources discovers enterprise REQUIRED SKILL names via vendor manifest', async () => {
  await withTempDir('pumuki-skills-custom-enterprise-required-skill-', async (tempRoot) => {
    const iosSkillPath = join(
      tempRoot,
      'vendor/skills/ios-enterprise-rules/SKILL.md'
    );
    const backendSkillPath = join(
      tempRoot,
      'vendor/skills/backend-enterprise-rules/SKILL.md'
    );
    const frontendSkillPath = join(
      tempRoot,
      'vendor/skills/frontend-enterprise-rules/SKILL.md'
    );
    const androidSkillPath = join(
      tempRoot,
      'vendor/skills/android-enterprise-rules/SKILL.md'
    );
    const concurrencySkillPath = join(
      tempRoot,
      'vendor/skills/swift-concurrency/SKILL.md'
    );
    const swiftUiSkillPath = join(
      tempRoot,
      'vendor/skills/swiftui-expert-skill/SKILL.md'
    );

    for (const skillPath of [
      iosSkillPath,
      backendSkillPath,
      frontendSkillPath,
      androidSkillPath,
      concurrencySkillPath,
      swiftUiSkillPath,
    ]) {
      mkdirSync(join(skillPath, '..'), { recursive: true });
    }

    writeFileSync(
      iosSkillPath,
      '- Keep ViewModels focused on a single feature boundary.\n'
    );
    writeFileSync(
      backendSkillPath,
      '- Avoid empty catch blocks in backend runtime code.\n'
    );
    writeFileSync(
      frontendSkillPath,
      '- Avoid explicit any in frontend runtime code.\n'
    );
    writeFileSync(
      androidSkillPath,
      '- Keep Compose screens aligned with feature boundaries.\n'
    );
    writeFileSync(
      concurrencySkillPath,
      '- Prefer actor isolation for mutable shared state.\n'
    );
    writeFileSync(
      swiftUiSkillPath,
      '- Use focused presentation state per view boundary.\n'
    );

    writeFileSync(
      join(tempRoot, 'vendor/skills/MANIFEST.json'),
      JSON.stringify(
        {
          version: 1,
          skills: [
            {
              name: 'ios-enterprise-rules',
              file: 'vendor/skills/ios-enterprise-rules/SKILL.md',
            },
            {
              name: 'backend-enterprise-rules',
              file: 'vendor/skills/backend-enterprise-rules/SKILL.md',
            },
            {
              name: 'frontend-enterprise-rules',
              file: 'vendor/skills/frontend-enterprise-rules/SKILL.md',
            },
            {
              name: 'android-enterprise-rules',
              file: 'vendor/skills/android-enterprise-rules/SKILL.md',
            },
            {
              name: 'swift-concurrency',
              file: 'vendor/skills/swift-concurrency/SKILL.md',
            },
            {
              name: 'swiftui-expert-skill',
              file: 'vendor/skills/swiftui-expert-skill/SKILL.md',
            },
          ],
        },
        null,
        2
      )
    );

    writeFileSync(
      join(tempRoot, 'AGENTS.md'),
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

    const sources = resolveSkillImportSources({ repoRoot: tempRoot }).sort();
    assert.deepEqual(
      sources,
      [
        androidSkillPath,
        backendSkillPath,
        concurrencySkillPath,
        frontendSkillPath,
        iosSkillPath,
        swiftUiSkillPath,
      ].sort()
    );
  });
});

test('importCustomSkillsRules writes .pumuki/custom-rules.json preserving AUTO canonicas y DECLARATIVE no canonicas', async () => {
  await withTempDir('pumuki-skills-custom-import-', async (tempRoot) => {
    const backendSkillPath = join(tempRoot, 'skills/backend/SKILL.md');
    const frontendSkillPath = join(tempRoot, 'skills/frontend/SKILL.md');

    mkdirSync(join(tempRoot, 'skills/backend'), { recursive: true });
    mkdirSync(join(tempRoot, 'skills/frontend'), { recursive: true });

    writeFileSync(
      backendSkillPath,
      [
        '- ❌ Avoid empty catch blocks in backend runtime code.',
        '- Must document domain errors at use-case boundary.',
      ].join('\n')
    );
    writeFileSync(
      frontendSkillPath,
      [
        '- ❌ Avoid explicit any in frontend runtime code.',
      ].join('\n')
    );

    const result = importCustomSkillsRules({
      repoRoot: tempRoot,
      sourceFiles: [backendSkillPath, frontendSkillPath],
    });

    assert.equal(result.sourceFiles.length, 2);
    assert.equal(result.importedRules.length >= 3, true);
    assert.equal(result.importedRules.every((rule) => rule.origin === 'custom'), true);

    const autoRuleIds = result.importedRules
      .filter((rule) => rule.evaluationMode === 'AUTO')
      .map((rule) => rule.id)
      .sort();
    const declarativeRuleIds = result.importedRules
      .filter((rule) => rule.evaluationMode === 'DECLARATIVE')
      .map((rule) => rule.id)
      .sort();
    assert.equal(autoRuleIds.includes('skills.backend.no-empty-catch'), true);
    assert.equal(autoRuleIds.includes('skills.frontend.avoid-explicit-any'), true);
    assert.equal(
      declarativeRuleIds.some((ruleId) => ruleId.startsWith('skills.backend.guideline.')),
      true
    );
  });
});

test('custom rules override repo lock rules by id when building effective skills rule set', async () => {
  await withCoreSkillsDisabled(async () => withTempDir('pumuki-skills-custom-precedence-', async (tempRoot) => {
    const repoLock = {
      version: '1.0',
      compilerVersion: '1.0.0',
      generatedAt: '2026-02-22T19:10:00.000Z',
      bundles: [
        {
          name: 'backend-guidelines',
          version: '1.0.0',
          source: 'file:docs/codex-skills/backend-enterprise-rules.md',
          hash: 'a'.repeat(64),
          rules: [
            {
              id: 'skills.backend.no-empty-catch',
              description: 'Base backend no-empty-catch rule.',
              severity: 'WARN',
              platform: 'backend',
              sourceSkill: 'backend-guidelines',
              sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
              evaluationMode: 'AUTO',
              origin: 'core',
              locked: true,
            },
          ],
        },
      ],
    } as const;

    mkdirSync(join(tempRoot, '.pumuki'), { recursive: true });
    writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(repoLock, null, 2));
    writeFileSync(
      join(tempRoot, '.pumuki/custom-rules.json'),
      JSON.stringify(
        {
          version: '1.0',
          generatedAt: '2026-02-22T19:11:00.000Z',
          source_files: ['AGENTS.md'],
          rules: [
            {
              id: 'skills.backend.no-empty-catch',
              description: 'Custom override for backend no-empty-catch.',
              severity: 'CRITICAL',
              platform: 'backend',
              evaluationMode: 'AUTO',
            },
          ],
        },
        null,
        2
      )
    );

    const result = loadSkillsRuleSetForStage('PRE_COMMIT', tempRoot);
    assert.equal(result.rules.length, 1);

    const onlyRule = result.rules[0];
    assert.ok(onlyRule);
    assert.equal(onlyRule.id, 'skills.backend.no-empty-catch');
    assert.equal(onlyRule.severity, 'CRITICAL');
    assert.equal(onlyRule.description, 'Custom override for backend no-empty-catch.');
  }));
});

test('import custom con reglas no canonicas usa DECLARATIVE y evita unsupported_auto_rule_ids', async () => {
  await withCoreSkillsDisabled(async () => withTempDir('pumuki-skills-custom-unsupported-auto-', async (tempRoot) => {
    writeFileSync(
      join(tempRoot, 'skills.lock.json'),
      JSON.stringify(
        {
          version: '1.0',
          compilerVersion: '1.0.0',
          generatedAt: '2026-02-23T10:00:00.000Z',
          bundles: [
            {
              name: 'repo-local-guidelines',
              version: '1.0.0',
              source: 'file:docs/repo-local/SKILL.md',
              hash: 'a'.repeat(64),
              rules: [],
            },
          ],
        },
        null,
        2
      )
    );

    const backendSkillPath = join(tempRoot, 'skills/backend/SKILL.md');
    mkdirSync(join(tempRoot, 'skills/backend'), { recursive: true });
    writeFileSync(
      backendSkillPath,
      '- Must avoid transaction scripts crossing auth, orders and payments bounded contexts.\n'
    );

    const importResult = importCustomSkillsRules({
      repoRoot: tempRoot,
      sourceFiles: [backendSkillPath],
    });

    assert.equal(importResult.importedRules.length, 1);
    const importedRuleId = importResult.importedRules[0]?.id;
    assert.ok(importedRuleId);

    const detectedPlatforms = {
      backend: { detected: true, confidence: 'HIGH' as const },
    };
    const ruleSet = loadSkillsRuleSetForStage('PRE_COMMIT', tempRoot, detectedPlatforms);
    assert.equal(ruleSet.rules.length, 0);
    assert.deepEqual(ruleSet.registryCoverage?.declarativeRuleIds, [importedRuleId]);
    assert.deepEqual(ruleSet.unsupportedAutoRuleIds, []);
  }));
});
