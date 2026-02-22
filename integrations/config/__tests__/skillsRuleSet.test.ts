import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { loadSkillsRuleSetForStage } from '../skillsRuleSet';
import type { DetectedPlatforms } from '../../platform/detectPlatforms';

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

const serializeRuleSetForParity = (
  result: ReturnType<typeof loadSkillsRuleSetForStage>
): {
  rules: ReturnType<typeof loadSkillsRuleSetForStage>['rules'];
  mappedHeuristicRuleIds: string[];
  unsupportedAutoRuleIds: string[];
} => {
  return {
    rules: result.rules,
    mappedHeuristicRuleIds: [...result.mappedHeuristicRuleIds].sort(),
    unsupportedAutoRuleIds: [...(result.unsupportedAutoRuleIds ?? [])].sort(),
  };
};

test('loads and transforms active bundles into heuristic-driven rules', async () => {
  await withCoreSkillsDisabled(async () => withTempDir('pumuki-skills-ruleset-', async (tempRoot) => {
    mkdirSync(join(tempRoot, 'apps/ios'), { recursive: true });
    writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(sampleLock, null, 2));
    writeFileSync(join(tempRoot, 'skills.policy.json'), JSON.stringify(samplePolicy, null, 2));

    const preCommit = loadSkillsRuleSetForStage('PRE_COMMIT', tempRoot);
    assert.equal(preCommit.rules.length, 2);
    assert.equal(preCommit.activeBundles.length, 1);
    assert.equal(preCommit.activeBundles[0]?.name, 'ios-guidelines');
    assert.equal(preCommit.requiresHeuristicFacts, true);

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
  }));
});

test('falls back gracefully when lock/policy files are missing', async () => {
  await withCoreSkillsDisabled(async () => withTempDir('pumuki-skills-ruleset-empty-', async (tempRoot) => {
    const result = loadSkillsRuleSetForStage('CI', tempRoot);
    assert.equal(result.rules.length, 0);
    assert.equal(result.activeBundles.length, 0);
    assert.equal(result.requiresHeuristicFacts, false);
    assert.equal(result.mappedHeuristicRuleIds.size, 0);
    assert.deepEqual(result.unsupportedAutoRuleIds, []);
  }));
});

test('returns empty result when defaultBundleEnabled is false and no bundle override exists', async () => {
  await withCoreSkillsDisabled(async () => withTempDir('pumuki-skills-ruleset-disabled-', async (tempRoot) => {
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
    assert.deepEqual(result.unsupportedAutoRuleIds, []);
  }));
});

test('marca reglas AUTO no mapeadas como unsupported y mantiene reglas mapeadas activas', async () => {
  await withCoreSkillsDisabled(async () => withTempDir('pumuki-skills-ruleset-promotion-', async (tempRoot) => {
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
              description: 'Rule without heuristic mapping must be blocked.',
              severity: 'CRITICAL',
              platform: 'ios',
              sourceSkill: 'ios-guidelines',
              sourcePath: 'docs/codex-skills/windsurf-rules-ios.md',
              evaluationMode: 'AUTO',
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
    const preCommitMapped = preCommit.rules.find((rule) => rule.id === 'skills.ios.no-force-try');
    assert.ok(preCommitMapped);
    assert.deepEqual(preCommit.unsupportedAutoRuleIds, ['skills.ios.custom-non-mapped-rule']);
    assert.equal(preCommitMapped.severity, 'ERROR');

    const prePush = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
    assert.equal(prePush.rules.length, 1);
    const prePushMapped = prePush.rules.find((rule) => rule.id === 'skills.ios.no-force-try');
    assert.ok(prePushMapped);
    assert.deepEqual(prePush.unsupportedAutoRuleIds, ['skills.ios.custom-non-mapped-rule']);
    assert.equal(prePushMapped.severity, 'ERROR');
  }));
});

test('scopes backend/frontend heuristic rules to platform file prefixes', async () => {
  await withCoreSkillsDisabled(async () => withTempDir('pumuki-skills-ruleset-platform-scope-', async (tempRoot) => {
    mkdirSync(join(tempRoot, 'apps/backend'), { recursive: true });
    mkdirSync(join(tempRoot, 'apps/frontend'), { recursive: true });
    mkdirSync(join(tempRoot, 'apps/web'), { recursive: true });

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
  }));
});

test('mapea reglas SOLID y God Class a detectores AST heuristics en backend', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-solid-god-class-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/backend'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-02-07T23:15:00.000Z',
        bundles: [
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/windsurf-rules-backend.md',
            hash: 'd'.repeat(64),
            rules: [
              {
                id: 'skills.backend.no-solid-violations',
                description: 'Verificar que NO viole SOLID (SRP, OCP, LSP, ISP, DIP).',
                severity: 'ERROR',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/windsurf-rules-backend.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.no-god-classes',
                description: 'God classes - Servicios con >500 lineas.',
                severity: 'ERROR',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/windsurf-rules-backend.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 2);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);
      const solidRule = result.rules.find((rule) => rule.id === 'skills.backend.no-solid-violations');
      const godClassRule = result.rules.find((rule) => rule.id === 'skills.backend.no-god-classes');
      assert.ok(solidRule);
      assert.ok(godClassRule);
      assert.equal(solidRule.when.kind, 'Any');
      assert.equal(solidRule.when.conditions.length >= 2, true);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.solid.srp.class-command-query-mix.ast'), true);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.god-class-large-class.ast'), true);
    })
  );
});

test('falls back to unscoped heuristic conditions when platform folders are not present', async () => {
  await withCoreSkillsDisabled(async () => withTempDir('pumuki-skills-ruleset-framework-fallback-', async (tempRoot) => {
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

    writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

    const preCommit = loadSkillsRuleSetForStage('PRE_COMMIT', tempRoot);
    const backendRule = preCommit.rules.find((rule) => rule.id === 'skills.backend.no-empty-catch');
    assert.ok(backendRule);
    assert.equal(backendRule.when.kind, 'Heuristic');
    assert.equal(backendRule.when.where?.filePathPrefix, undefined);
  }));
});

test('filters platform-specific rules using detectedPlatforms from gate evaluation', async () => {
  await withCoreSkillsDisabled(async () => withTempDir('pumuki-skills-ruleset-detected-platforms-', async (tempRoot) => {
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

    writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

    const detectedPlatforms: DetectedPlatforms = {
      ios: { detected: true, confidence: 'HIGH' },
      backend: { detected: false, confidence: 'LOW' },
    };

    const result = loadSkillsRuleSetForStage('PRE_COMMIT', tempRoot, detectedPlatforms);
    const ruleIds = result.rules.map((rule) => rule.id).sort();

    assert.deepEqual(ruleIds, ['skills.ios.no-force-try']);
  }));
});

test('keeps only generic/text rules when no platform is detected', async () => {
  await withCoreSkillsDisabled(async () => withTempDir('pumuki-skills-ruleset-no-platform-', async (tempRoot) => {
    const lock = {
      version: '1.0',
      compilerVersion: '1.0.0',
      generatedAt: '2026-02-07T23:15:00.000Z',
      bundles: [
        {
          name: 'mixed-guidelines',
          version: '1.0.0',
          source: 'file:docs/codex-skills/mixed.md',
          hash: 'c'.repeat(64),
          rules: [
            {
              id: 'skills.backend.no-empty-catch',
              description: 'Disallow empty catch blocks in backend runtime code.',
              severity: 'CRITICAL',
              platform: 'backend',
              sourceSkill: 'mixed-guidelines',
              sourcePath: 'docs/codex-skills/mixed.md',
              locked: true,
            },
            {
              id: 'skills.generic.architecture-note',
              description: 'Generic declarative project note.',
              severity: 'INFO',
              platform: 'generic',
              sourceSkill: 'mixed-guidelines',
              sourcePath: 'docs/codex-skills/mixed.md',
              evaluationMode: 'DECLARATIVE',
              locked: true,
            },
          ],
        },
      ],
    } as const;

    writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

    const detectedPlatforms: DetectedPlatforms = {
      ios: { detected: false, confidence: 'LOW' },
      android: { detected: false, confidence: 'LOW' },
      backend: { detected: false, confidence: 'LOW' },
      frontend: { detected: false, confidence: 'LOW' },
    };

    const result = loadSkillsRuleSetForStage('PRE_COMMIT', tempRoot, detectedPlatforms);
    const ruleIds = result.rules.map((rule) => rule.id).sort();
    assert.deepEqual(ruleIds, ['skills.generic.architecture-note']);
  }));
});

test('scopes backend and ios heuristic rules using observed file paths when default folders are absent', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-observed-paths-', async (tempRoot) => {
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

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const detectedPlatforms: DetectedPlatforms = {
        ios: { detected: true, confidence: 'HIGH' },
        backend: { detected: true, confidence: 'HIGH' },
      };
      const observedPaths = [
        'mobile/ios/MainView.swift',
        'server/src/orders.service.ts',
      ];

      const result = (
        loadSkillsRuleSetForStage as unknown as (
          stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI',
          repoRoot?: string,
          detectedPlatforms?: DetectedPlatforms,
          observedFilePaths?: ReadonlyArray<string>
        ) => ReturnType<typeof loadSkillsRuleSetForStage>
      )('PRE_COMMIT', tempRoot, detectedPlatforms, observedPaths);

      const iosRule = result.rules.find((rule) => rule.id === 'skills.ios.no-force-try');
      const backendRule = result.rules.find((rule) => rule.id === 'skills.backend.no-empty-catch');
      assert.ok(iosRule);
      assert.ok(backendRule);
      assert.deepEqual(collectHeuristicPrefixes(iosRule.when), ['mobile/ios/']);
      assert.deepEqual(collectHeuristicPrefixes(backendRule.when), ['server/']);
    })
  );
});

test('keeps stage semantics aligned across PRE_COMMIT, PRE_PUSH and CI for scoped skill rules', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-stage-parity-', async (tempRoot) => {
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
                stage: 'PRE_PUSH',
                locked: true,
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
                stage: 'PRE_PUSH',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const detectedPlatforms: DetectedPlatforms = {
        ios: { detected: true, confidence: 'HIGH' },
        backend: { detected: true, confidence: 'HIGH' },
      };
      const observedPaths = [
        'mobile/ios/MainView.swift',
        'server/src/orders.service.ts',
      ];

      const preCommit = loadSkillsRuleSetForStage(
        'PRE_COMMIT',
        tempRoot,
        detectedPlatforms,
        observedPaths
      );
      const prePush = loadSkillsRuleSetForStage(
        'PRE_PUSH',
        tempRoot,
        detectedPlatforms,
        observedPaths
      );
      const ci = loadSkillsRuleSetForStage('CI', tempRoot, detectedPlatforms, observedPaths);

      assert.deepEqual(
        serializeRuleSetForParity(preCommit),
        serializeRuleSetForParity(prePush)
      );
      assert.deepEqual(serializeRuleSetForParity(prePush), serializeRuleSetForParity(ci));
    })
  );
});
