import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import {
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

test('importCustomSkillsRules writes .pumuki/custom-rules.json and forces AUTO evaluation mode for extracted rules', async () => {
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
    assert.equal(autoRuleIds.includes('skills.backend.no-empty-catch'), true);
    assert.equal(autoRuleIds.includes('skills.frontend.avoid-explicit-any'), true);
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
          source: 'file:docs/codex-skills/windsurf-rules-backend.md',
          hash: 'a'.repeat(64),
          rules: [
            {
              id: 'skills.backend.no-empty-catch',
              description: 'Base backend no-empty-catch rule.',
              severity: 'WARN',
              platform: 'backend',
              sourceSkill: 'backend-guidelines',
              sourcePath: 'docs/codex-skills/windsurf-rules-backend.md',
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

test('import custom con reglas no canonicas deja trazabilidad unsupported_auto_rule_ids en gate', async () => {
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
    assert.deepEqual(ruleSet.unsupportedAutoRuleIds, [importedRuleId]);
  }));
});
