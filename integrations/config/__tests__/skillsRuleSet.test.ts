import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { loadSkillsRuleSetForStage } from '../skillsRuleSet';

const sampleLock = {
  version: '1.0',
  compilerVersion: '1.0.0',
  generatedAt: '2026-02-07T23:15:00.000Z',
  bundles: [
    {
      name: 'ios-guidelines',
      version: '1.0.0',
      source: 'file:docs/codex-skills/windsurf-rules-ios.md',
      hash: 'a'.repeat(64),
      rules: [
        {
          id: 'skills.ios.no-force-try',
          description: 'Disallow force try in production iOS code.',
          severity: 'WARN',
          platform: 'ios',
          sourceSkill: 'ios-guidelines',
          sourcePath: 'docs/codex-skills/windsurf-rules-ios.md',
          stage: 'PRE_PUSH',
          locked: true,
          confidence: 'HIGH',
        },
        {
          id: 'skills.ios.no-task-detached',
          description:
            'Avoid Task.detached in production iOS code without strict isolation rationale.',
          severity: 'WARN',
          platform: 'ios',
          sourceSkill: 'ios-concurrency-guidelines',
          sourcePath: 'docs/codex-skills/swift-concurrency.md',
          stage: 'PRE_PUSH',
          locked: true,
          confidence: 'MEDIUM',
        },
      ],
    },
    {
      name: 'backend-guidelines',
      version: '1.0.0',
      source: 'file:docs/codex-skills/windsurf-rules-backend.md',
      hash: 'b'.repeat(64),
      rules: [
        {
          id: 'skills.backend.no-empty-catch',
          description: 'Disallow empty catch blocks in backend runtime code.',
          severity: 'CRITICAL',
          platform: 'backend',
          sourceSkill: 'backend-guidelines',
          sourcePath: 'docs/codex-skills/windsurf-rules-backend.md',
          locked: true,
        },
      ],
    },
  ],
} as const;

const samplePolicy = {
  version: '1.0',
  defaultBundleEnabled: true,
  stages: {
    PRE_COMMIT: {
      blockOnOrAbove: 'CRITICAL',
      warnOnOrAbove: 'ERROR',
    },
    PRE_PUSH: {
      blockOnOrAbove: 'ERROR',
      warnOnOrAbove: 'WARN',
    },
    CI: {
      blockOnOrAbove: 'ERROR',
      warnOnOrAbove: 'WARN',
    },
  },
  bundles: {
    'ios-guidelines': {
      enabled: true,
      promoteToErrorRuleIds: ['skills.ios.no-force-try'],
    },
    'backend-guidelines': {
      enabled: false,
    },
  },
} as const;

const collectHeuristicPrefixes = (
  when: NonNullable<ReturnType<typeof loadSkillsRuleSetForStage>['rules'][number]>['when']
): string[] => {
  if (when.kind === 'Heuristic') {
    return [when.where?.filePathPrefix ?? ''].filter((prefix) => prefix.length > 0);
  }

  if (when.kind === 'Any') {
    return when.conditions
      .filter((condition): condition is { kind: 'Heuristic'; where?: { filePathPrefix?: string } } =>
        condition.kind === 'Heuristic'
      )
      .map((condition) => condition.where?.filePathPrefix ?? '')
      .filter((prefix) => prefix.length > 0);
  }

  return [];
};

test('loads and transforms active bundles into heuristic-driven rules', async () => {
  await withTempDir('pumuki-skills-ruleset-', async (tempRoot) => {
    writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(sampleLock, null, 2));
    writeFileSync(join(tempRoot, 'skills.policy.json'), JSON.stringify(samplePolicy, null, 2));

    const preCommit = loadSkillsRuleSetForStage('PRE_COMMIT', tempRoot);
    assert.equal(preCommit.rules.length, 0);
    assert.equal(preCommit.requiresHeuristicFacts, false);

    const prePush = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
    assert.equal(prePush.rules.length, 2);
    assert.equal(prePush.activeBundles.length, 1);
    assert.equal(prePush.activeBundles[0]?.name, 'ios-guidelines');

    const firstRule = prePush.rules[0];
    assert.ok(firstRule);
    assert.equal(firstRule.id, 'skills.ios.no-force-try');
    assert.equal(firstRule.severity, 'ERROR');
    const iosHeuristicPrefixes = collectHeuristicPrefixes(firstRule.when).sort();
    assert.equal(iosHeuristicPrefixes.length > 0, true);
    assert.equal(iosHeuristicPrefixes.includes('apps/ios/'), true);
    assert.equal(prePush.mappedHeuristicRuleIds.has('heuristics.ios.force-try.ast'), true);
    assert.equal(prePush.mappedHeuristicRuleIds.has('heuristics.ios.task-detached.ast'), true);
    assert.equal(prePush.requiresHeuristicFacts, true);
  });
});

test('falls back gracefully when lock/policy files are missing', async () => {
  await withTempDir('pumuki-skills-ruleset-empty-', async (tempRoot) => {
    const result = loadSkillsRuleSetForStage('CI', tempRoot);
    assert.equal(result.rules.length, 0);
    assert.equal(result.activeBundles.length, 0);
    assert.equal(result.requiresHeuristicFacts, false);
    assert.equal(result.mappedHeuristicRuleIds.size, 0);
  });
});

test('returns empty result when defaultBundleEnabled is false and no bundle override exists', async () => {
  await withTempDir('pumuki-skills-ruleset-disabled-', async (tempRoot) => {
    writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(sampleLock, null, 2));
    writeFileSync(
      join(tempRoot, 'skills.policy.json'),
      JSON.stringify(
        {
          version: '1.0',
          defaultBundleEnabled: false,
          stages: samplePolicy.stages,
          bundles: {},
        },
        null,
        2
      )
    );

    const result = loadSkillsRuleSetForStage('CI', tempRoot);
    assert.equal(result.rules.length, 0);
    assert.equal(result.activeBundles.length, 0);
    assert.equal(result.mappedHeuristicRuleIds.size, 0);
    assert.equal(result.requiresHeuristicFacts, false);
  });
});

test('ignores unmapped rules and promotes only from PRE_PUSH/CI', async () => {
  await withTempDir('pumuki-skills-ruleset-promotion-', async (tempRoot) => {
    const lock = {
      version: '1.0',
      compilerVersion: '1.0.0',
      generatedAt: '2026-02-07T23:15:00.000Z',
      bundles: [
        {
          name: 'ios-guidelines',
          version: '1.0.0',
          source: 'file:docs/codex-skills/windsurf-rules-ios.md',
          hash: 'a'.repeat(64),
          rules: [
            {
              id: 'skills.ios.no-force-try',
              description: 'Disallow force try in production iOS code.',
              severity: 'WARN',
              platform: 'ios',
              sourceSkill: 'ios-guidelines',
              sourcePath: 'docs/codex-skills/windsurf-rules-ios.md',
              locked: true,
              confidence: 'HIGH',
            },
            {
              id: 'skills.ios.custom-non-mapped-rule',
              description: 'Rule without heuristic mapping must be ignored.',
              severity: 'CRITICAL',
              platform: 'ios',
              sourceSkill: 'ios-guidelines',
              sourcePath: 'docs/codex-skills/windsurf-rules-ios.md',
              locked: true,
              confidence: 'HIGH',
            },
          ],
        },
      ],
    } as const;

    const policy = {
      version: '1.0',
      defaultBundleEnabled: true,
      stages: samplePolicy.stages,
      bundles: {
        'ios-guidelines': {
          enabled: true,
          promoteToErrorRuleIds: ['skills.ios.no-force-try'],
        },
      },
    } as const;

    writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));
    writeFileSync(join(tempRoot, 'skills.policy.json'), JSON.stringify(policy, null, 2));

    const preCommit = loadSkillsRuleSetForStage('PRE_COMMIT', tempRoot);
    assert.equal(preCommit.rules.length, 1);
    assert.equal(preCommit.rules[0]?.id, 'skills.ios.no-force-try');
    assert.equal(preCommit.rules[0]?.severity, 'WARN');

    const prePush = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
    assert.equal(prePush.rules.length, 1);
    assert.equal(prePush.rules[0]?.id, 'skills.ios.no-force-try');
    assert.equal(prePush.rules[0]?.severity, 'ERROR');
    assert.equal(
      prePush.rules.some((rule) => rule.id === 'skills.ios.custom-non-mapped-rule'),
      false
    );
  });
});

test('scopes backend/frontend heuristic rules to platform file prefixes', async () => {
  await withTempDir('pumuki-skills-ruleset-platform-scope-', async (tempRoot) => {
    const lock = {
      version: '1.0',
      compilerVersion: '1.0.0',
      generatedAt: '2026-02-07T23:15:00.000Z',
      bundles: [
        {
          name: 'backend-guidelines',
          version: '1.0.0',
          source: 'file:docs/codex-skills/windsurf-rules-backend.md',
          hash: 'a'.repeat(64),
          rules: [
            {
              id: 'skills.backend.avoid-explicit-any',
              description: 'Avoid explicit any in backend runtime code.',
              severity: 'WARN',
              platform: 'backend',
              sourceSkill: 'backend-guidelines',
              sourcePath: 'docs/codex-skills/windsurf-rules-backend.md',
              locked: true,
            },
          ],
        },
        {
          name: 'frontend-guidelines',
          version: '1.0.0',
          source: 'file:docs/codex-skills/windsurf-rules-frontend.md',
          hash: 'b'.repeat(64),
          rules: [
            {
              id: 'skills.frontend.avoid-explicit-any',
              description: 'Avoid explicit any in frontend runtime code.',
              severity: 'WARN',
              platform: 'frontend',
              sourceSkill: 'frontend-guidelines',
              sourcePath: 'docs/codex-skills/windsurf-rules-frontend.md',
              locked: true,
            },
          ],
        },
      ],
    } as const;

    writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

    const preCommit = loadSkillsRuleSetForStage('PRE_COMMIT', tempRoot);
    const backendRule = preCommit.rules.find((rule) => rule.id === 'skills.backend.avoid-explicit-any');
    const frontendRule = preCommit.rules.find((rule) => rule.id === 'skills.frontend.avoid-explicit-any');

    assert.ok(backendRule);
    assert.ok(frontendRule);
    assert.deepEqual(collectHeuristicPrefixes(backendRule.when), ['apps/backend/']);

    const frontendPrefixes = collectHeuristicPrefixes(frontendRule.when).sort();
    assert.deepEqual(frontendPrefixes, ['apps/frontend/', 'apps/web/']);
  });
});
