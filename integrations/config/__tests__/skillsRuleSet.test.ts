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
      source: 'file:docs/codex-skills/ios-enterprise-rules.md',
      hash: 'a'.repeat(64),
      rules: [
        {
          id: 'skills.ios.no-force-try',
          description: 'Disallow force try in production iOS code.',
          severity: 'WARN',
          platform: 'ios',
          sourceSkill: 'ios-guidelines',
          sourcePath: 'docs/codex-skills/ios-enterprise-rules.md',
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
      source: 'file:docs/codex-skills/backend-enterprise-rules.md',
      hash: 'b'.repeat(64),
      rules: [
        {
          id: 'skills.backend.no-empty-catch',
          description: 'Disallow empty catch blocks in backend runtime code.',
          severity: 'CRITICAL',
          platform: 'backend',
          sourceSkill: 'backend-guidelines',
          sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
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
    PRE_WRITE: {
      blockOnOrAbove: 'ERROR',
      warnOnOrAbove: 'WARN',
    },
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
    assert.equal(preCommit.rules.length, 0);
    assert.equal(preCommit.activeBundles.length, 1);
    assert.equal(preCommit.activeBundles[0]?.name, 'ios-guidelines');
    assert.equal(preCommit.requiresHeuristicFacts, false);
    assert.equal(preCommit.registryCoverage?.registryTotals.total, 2);
    assert.equal(preCommit.registryCoverage?.registryTotals.auto, 2);
    assert.deepEqual(preCommit.registryCoverage?.stageApplicableAutoRuleIds, []);

    const prePush = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
    assert.equal(prePush.rules.length, 2);
    assert.equal(prePush.activeBundles.length, 1);
    assert.equal(prePush.activeBundles[0]?.name, 'ios-guidelines');

    const firstRule = prePush.rules[0];
    assert.ok(firstRule);
    assert.equal(firstRule.id, 'skills.ios.no-force-try');
    assert.equal(firstRule.severity, 'ERROR');
    assert.equal(firstRule.then.kind, 'Finding');
    assert.equal(
      firstRule.then.source?.includes('skills-ir:rule=skills.ios.no-force-try'),
      true
    );
    assert.equal(
      firstRule.then.source?.includes('source_skill=ios-guidelines'),
      true
    );
    assert.equal(
      firstRule.then.source?.includes('ast_nodes=[heuristics.ios.force-try.ast]'),
      true
    );
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
          source: 'file:docs/codex-skills/ios-enterprise-rules.md',
          hash: 'a'.repeat(64),
          rules: [
            {
              id: 'skills.ios.no-force-try',
              description: 'Disallow force try in production iOS code.',
              severity: 'WARN',
              platform: 'ios',
              sourceSkill: 'ios-guidelines',
              sourcePath: 'docs/codex-skills/ios-enterprise-rules.md',
              locked: true,
              confidence: 'HIGH',
            },
            {
              id: 'skills.ios.custom-non-mapped-rule',
              description: 'Rule without heuristic mapping must be blocked.',
              severity: 'CRITICAL',
              platform: 'ios',
              sourceSkill: 'ios-guidelines',
              sourcePath: 'docs/codex-skills/ios-enterprise-rules.md',
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

test('compila reglas AUTO con astNodeIds dinámicos aunque no existan en registry estático', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-dynamic-ast-ir-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/backend'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-02-07T23:15:00.000Z',
        bundles: [
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/backend-enterprise-rules.md',
            hash: 'a'.repeat(64),
            rules: [
              {
                id: 'skills.backend.guideline.dynamic-explicit-any',
                description: 'Avoid dynamic explicit any usages in backend runtime code.',
                severity: 'ERROR',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                astNodeIds: ['heuristics.ts.explicit-any.ast'],
                locked: true,
                confidence: 'HIGH',
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_COMMIT', tempRoot);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);
      assert.equal(result.rules.length, 1);

      const dynamicRule = result.rules[0];
      assert.ok(dynamicRule);
      assert.equal(dynamicRule.id, 'skills.backend.guideline.dynamic-explicit-any');
      assert.equal(dynamicRule.when.kind, 'Heuristic');
      if (dynamicRule.when.kind !== 'Heuristic') {
        assert.fail('Expected heuristic condition for dynamic AST node mapping.');
      }
      assert.equal(dynamicRule.when.where?.ruleId, 'heuristics.ts.explicit-any.ast');
      assert.equal(
        dynamicRule.then.source?.includes('ast_nodes=[heuristics.ts.explicit-any.ast]'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.ts.explicit-any.ast'),
        true
      );
    })
  );
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
          source: 'file:docs/codex-skills/backend-enterprise-rules.md',
          hash: 'a'.repeat(64),
          rules: [
            {
              id: 'skills.backend.avoid-explicit-any',
              description: 'Avoid explicit any in backend runtime code.',
              severity: 'WARN',
              platform: 'backend',
              sourceSkill: 'backend-guidelines',
              sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
              locked: true,
            },
          ],
        },
        {
          name: 'frontend-guidelines',
          version: '1.0.0',
          source: 'file:docs/codex-skills/frontend-enterprise-rules.md',
          hash: 'b'.repeat(64),
          rules: [
            {
              id: 'skills.frontend.avoid-explicit-any',
              description: 'Avoid explicit any in frontend runtime code.',
              severity: 'WARN',
              platform: 'frontend',
              sourceSkill: 'frontend-guidelines',
              sourcePath: 'docs/codex-skills/frontend-enterprise-rules.md',
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

test('mapea reglas Android Hilt a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-hilt-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.hiltandroidapp-application-class',
                description: '@HiltAndroidApp - Application class',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.module-installin-provide-dependencies',
                description: '@Module + @InstallIn - Provide dependencies',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.binds-para-implementaciones-de-interfaces-ma-s-eficiente',
                description: '@Binds - Para implementaciones de interfaces (más eficiente)',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.provides-para-interfaces-o-third-party',
                description: '@Provides - Para interfaces o third-party',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.workmanager-androidx-work-work-runtime-ktx',
                description: 'WorkManager - androidx.work:work-runtime-ktx',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.localization-strings-xml-por-idioma-values-es-values-en',
                description: 'strings.xml - Por idioma (values-es, values-en)',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.string-formatting-1-s-2-d-para-argumentos',
                description: 'String formatting - %1$s, %2$d para argumentos',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.plurals-values-plurals-xml',
                description: 'Plurals - values/plurals.xml',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.version-catalogs-libs-versions-toml-para-dependencias',
                description: 'Version catalogs - libs.versions.toml para dependencias',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.viewmodelscope-scope-de-viewmodel-cancelado-automa-ticamente',
                description: 'viewModelScope - Scope de ViewModel, cancelado automáticamente',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.viewmodelscoped-para-dependencias-de-viewmodel',
                description: '@ViewModelScoped - Para dependencias de ViewModel',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 11);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const hiltAndroidAppRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.hiltandroidapp-application-class'
      );
      const moduleInstallInRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.module-installin-provide-dependencies'
      );
      const bindsRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.binds-para-implementaciones-de-interfaces-ma-s-eficiente'
      );
      const providesRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.provides-para-interfaces-o-third-party'
      );
      const workManagerDependencyRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.workmanager-androidx-work-work-runtime-ktx'
      );
      const stringsXmlRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.localization-strings-xml-por-idioma-values-es-values-en'
      );
      const stringFormattingRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.string-formatting-1-s-2-d-para-argumentos'
      );
      const pluralsXmlRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.plurals-values-plurals-xml'
      );
      const versionCatalogRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.version-catalogs-libs-versions-toml-para-dependencias'
      );
      const viewModelScopeRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.viewmodelscope-scope-de-viewmodel-cancelado-automa-ticamente'
      );
      const viewModelScopedRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.viewmodelscoped-para-dependencias-de-viewmodel'
      );

      assert.ok(hiltAndroidAppRule);
      assert.ok(moduleInstallInRule);
      assert.ok(bindsRule);
      assert.ok(providesRule);
      assert.ok(workManagerDependencyRule);
      assert.ok(stringsXmlRule);
      assert.ok(stringFormattingRule);
      assert.ok(pluralsXmlRule);
      assert.ok(versionCatalogRule);
      assert.ok(viewModelScopeRule);
      assert.ok(viewModelScopedRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.hiltandroidapp-application-class.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.module-installin-provide-dependencies.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.binds-para-implementaciones-de-interfaces-ma-s-eficiente.ast'
        ),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.provides-para-interfaces-o-third-party.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.workmanager-androidx-work-work-runtime-ktx.ast'
        ),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.localization-strings-xml-por-idioma-values-es-values-en.ast'
        ),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.string-formatting-1-s-2-d-para-argumentos.ast'),
        true
      );
      assert.equal(
        stringFormattingRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.string-formatting-1-s-2-d-para-argumentos.ast]'
        ),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.plurals-values-plurals-xml.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.version-catalogs-libs-versions-toml-para-dependencias.ast'
        ),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.viewmodelscope-scope-de-viewmodel-cancelado-automa-ticamente.ast'
        ),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.viewmodelscoped-para-dependencias-de-viewmodel.ast'),
        true
      );
      assert.equal(
        hiltAndroidAppRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.hiltandroidapp-application-class.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android BuildConfig a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-buildconfig-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.buildconfig-constantes-en-tiempo-de-compilacio-n',
                description: 'BuildConfig - Constantes en tiempo de compilación',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);
      assert.equal(result.rules.length, 1);

      const buildConfigRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.buildconfig-constantes-en-tiempo-de-compilacio-n'
      );

      assert.ok(buildConfigRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.buildconfig-constantes-en-tiempo-de-compilacio-n.ast'),
        true
      );
      assert.equal(
        buildConfigRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.buildconfig-constantes-en-tiempo-de-compilacio-n.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android WorkManager a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-workmanager-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.workmanager-androidx-work-work-runtime-ktx',
                description: 'WorkManager - androidx.work:work-runtime-ktx',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.workmanager-background-tasks',
                description: 'WorkManager - Background tasks',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
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

      const dependencyRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.workmanager-androidx-work-work-runtime-ktx'
      );
      const backgroundRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.workmanager-background-tasks'
      );

      assert.ok(dependencyRule);
      assert.ok(backgroundRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.workmanager-androidx-work-work-runtime-ktx.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.workmanager-background-tasks.ast'),
        true
      );
      assert.equal(
        dependencyRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.workmanager-androidx-work-work-runtime-ktx.ast]'
        ),
        true
      );
      assert.equal(
        backgroundRule?.then.source?.includes('ast_nodes=[heuristics.android.workmanager-background-tasks.ast]'),
        true
      );
    })
  );
});

test('mapea reglas Android androidTest a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-instrumented-tests-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/androidTest/kotlin/com/acme'), {
        recursive: true,
      });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.androidtest-instrumented-tests-device-emulator',
                description: 'androidTest - Instrumented tests (Device/Emulator)',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const androidTestRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.androidtest-instrumented-tests-device-emulator'
      );

      assert.ok(androidTestRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.androidtest-instrumented-tests-device-emulator.ast'
        ),
        true
      );
      assert.equal(
        androidTestRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.androidtest-instrumented-tests-device-emulator.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android AAA, BDD y JVM test a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-test-structures-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/androidTest/kotlin/com/acme'), {
        recursive: true,
      });
      mkdirSync(join(tempRoot, 'apps/android/src/test/kotlin/com/acme'), {
        recursive: true,
      });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.aaa-pattern-arrange-act-assert',
                description: 'AAA pattern - Arrange, Act, Assert',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.given-when-then-bdd-style',
                description: 'Given-When-Then - BDD style',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.test-unit-tests-jvm',
                description: 'test/ - Unit tests (JVM)',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 3);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const aaaRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.aaa-pattern-arrange-act-assert'
      );
      const bddRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.given-when-then-bdd-style'
      );
      const jvmUnitTestRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.test-unit-tests-jvm'
      );

      assert.ok(aaaRule);
      assert.ok(bddRule);
      assert.ok(jvmUnitTestRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.aaa-pattern-arrange-act-assert.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.given-when-then-bdd-style.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.test-unit-tests-jvm.ast'),
        true
      );
      assert.equal(
        aaaRule?.then.source?.includes('ast_nodes=[heuristics.android.aaa-pattern-arrange-act-assert.ast]'),
        true
      );
      assert.equal(
        bddRule?.then.source?.includes('ast_nodes=[heuristics.android.given-when-then-bdd-style.ast]'),
        true
      );
      assert.equal(
        jvmUnitTestRule?.then.source?.includes('ast_nodes=[heuristics.android.test-unit-tests-jvm.ast]'),
        true
      );
    })
  );
});

test('mapea reglas Android Compose a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-compose-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.composable-functions-composable-para-ui',
                description: 'Composable functions - @Composable para UI',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.arguments-pasar-datos-entre-pantallas',
                description: 'Arguments - Pasar datos entre pantallas',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.adaptive-layouts-responsive-design-windowsizeclass',
                description: 'Adaptive layouts - Responsive design (WindowSizeClass)',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle',
                description: 'Analizar estructura existente - Módulos, interfaces, dependencias, Gradle',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.theme-color-scheme-typography-shapes',
                description: 'Theme - Color scheme, typography, shapes',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.dark-theme-soportar-desde-di-a-1-issystemindarktheme',
                description: 'Dark theme - Soportar desde día 1 (isSystemInDarkTheme())',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.timber-logging-library',
                description: 'Timber - Logging library',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.touch-targets-mi-nimo-48dp',
                description: 'Touch targets - mínimo 48dp',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.accessibility-semantics-contentdescription',
                description: 'Accessibility - semantics, contentDescription',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.contentdescription-para-ima-genes-y-botones',
                description: 'contentDescription - Para imágenes y botones',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.talkback-screen-reader-de-android',
                description: 'TalkBack - Screen reader de Android',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.text-scaling-soportar-font-scaling-del-sistema',
                description: 'Text scaling - Soportar font scaling del sistema',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.god-activities-single-activity-composables',
                description: 'God Activities - Single Activity + Composables',
                severity: 'ERROR',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.single-activity-mu-ltiples-composables-fragments-no-activities',
                description: 'Single Activity - Múltiples Composables/Fragments, no Activities',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 14);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const composableRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.composable-functions-composable-para-ui'
      );
      const argumentsRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.arguments-pasar-datos-entre-pantallas'
      );
      const adaptiveLayoutsRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.adaptive-layouts-responsive-design-windowsizeclass'
      );
      const existingStructureRule = result.rules.find(
        (rule) =>
          rule.id ===
          'skills.android.guideline.android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle'
      );
      const themeRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.theme-color-scheme-typography-shapes'
      );
      const darkThemeRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.dark-theme-soportar-desde-di-a-1-issystemindarktheme'
      );
      const timberRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.timber-logging-library'
      );
      const touchTargetRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.touch-targets-mi-nimo-48dp'
      );
      const accessibilityRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.accessibility-semantics-contentdescription'
      );
      const contentDescriptionRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.contentdescription-para-ima-genes-y-botones'
      );
      const talkbackRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.talkback-screen-reader-de-android'
      );
      const textScalingRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.text-scaling-soportar-font-scaling-del-sistema'
      );
      const godActivityRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.god-activities-single-activity-composables'
      );
      const singleActivityRule = result.rules.find(
        (rule) =>
          rule.id ===
          'skills.android.guideline.android.single-activity-mu-ltiples-composables-fragments-no-activities'
      );

      assert.ok(composableRule);
      assert.ok(argumentsRule);
      assert.ok(adaptiveLayoutsRule);
      assert.ok(existingStructureRule);
      assert.ok(themeRule);
      assert.ok(darkThemeRule);
      assert.ok(timberRule);
      assert.ok(touchTargetRule);
      assert.ok(accessibilityRule);
      assert.ok(contentDescriptionRule);
      assert.ok(talkbackRule);
      assert.ok(textScalingRule);
      assert.ok(godActivityRule);
      assert.ok(singleActivityRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.composable-functions-composable-para-ui.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.arguments-pasar-datos-entre-pantallas.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.adaptive-layouts-responsive-design-windowsizeclass.ast'
        ),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle.ast'
        ),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.theme-color-scheme-typography-shapes.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.dark-theme-soportar-desde-di-a-1-issystemindarktheme.ast'),
        true
      );
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.android.timber-logging-library.ast'), true);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.touch-targets-mi-nimo-48dp.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.accessibility-semantics-contentdescription.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.contentdescription-para-ima-genes-y-botones.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.talkback-screen-reader-de-android.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.god-activities-single-activity-composables.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.single-activity-multiples-composables-fragments-no-activities.ast'
        ),
        true
      );
      assert.equal(
        composableRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.composable-functions-composable-para-ui.ast]'
        ),
        true
      );
      assert.equal(
        argumentsRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.arguments-pasar-datos-entre-pantallas.ast]'
        ),
        true
      );
      assert.equal(
        adaptiveLayoutsRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.adaptive-layouts-responsive-design-windowsizeclass.ast]'
        ),
        true
      );
      assert.equal(
        existingStructureRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle.ast]'
        ),
        true
      );
      assert.equal(
        themeRule?.then.source?.includes('ast_nodes=[heuristics.android.theme-color-scheme-typography-shapes.ast]'),
        true
      );
      assert.equal(
        darkThemeRule?.then.source?.includes('ast_nodes=[heuristics.android.dark-theme-soportar-desde-di-a-1-issystemindarktheme.ast]'),
        true
      );
      assert.equal(
        timberRule?.then.source?.includes('ast_nodes=[heuristics.android.timber-logging-library.ast]'),
        true
      );
      assert.equal(
        touchTargetRule?.then.source?.includes('ast_nodes=[heuristics.android.touch-targets-mi-nimo-48dp.ast]'),
        true
      );
      assert.equal(
        accessibilityRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.accessibility-semantics-contentdescription.ast]'
        ),
        true
      );
      assert.equal(
        contentDescriptionRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.contentdescription-para-ima-genes-y-botones.ast]'
        ),
        true
      );
      assert.equal(
        talkbackRule?.then.source?.includes('ast_nodes=[heuristics.android.talkback-screen-reader-de-android.ast]'),
        true
      );
    })
  );
});

test('mapea reglas Android Coroutines async-await sin callbacks a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-coroutines-callbacks-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.coroutines-async-await-no-callbacks',
                description: 'Coroutines - async/await, NO callbacks',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const coroutineRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.coroutines-async-await-no-callbacks'
      );

      assert.ok(coroutineRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.coroutines-async-await-no-callbacks.ast'),
        true
      );
      assert.equal(
        coroutineRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.coroutines-async-await-no-callbacks.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android async-await paralelismo a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-async-await-parallelism-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.async-await-paralelismo',
                description: 'async/await - Paralelismo',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const asyncAwaitParallelismRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.async-await-paralelismo'
      );

      assert.ok(asyncAwaitParallelismRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.async-await-paralelismo.ast'),
        true
      );
      assert.equal(
        asyncAwaitParallelismRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.async-await-paralelismo.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android suspend functions para operaciones async a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-suspend-functions-async-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.suspend-functions-para-operaciones-async',
                description: 'suspend functions - Para operaciones async',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const suspendFunctionsAsyncRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.suspend-functions-para-operaciones-async'
      );

      assert.ok(suspendFunctionsAsyncRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.suspend-functions-para-operaciones-async.ast'),
        true
      );
      assert.equal(
        suspendFunctionsAsyncRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.suspend-functions-para-operaciones-async.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android supervisorScope a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-supervisorscope-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.supervisorscope-errores-no-cancelan-otros-jobs',
                description: 'supervisorScope - Errores no cancelan otros jobs',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const supervisorScopeRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.supervisorscope-errores-no-cancelan-otros-jobs'
      );

      assert.ok(supervisorScopeRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.supervisorscope-errores-no-cancelan-otros-jobs.ast'
        ),
        true
      );
      assert.equal(
        supervisorScopeRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.supervisorscope-errores-no-cancelan-otros-jobs.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android StateFlow a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-stateflow-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.stateflow-estado-mutable-observable',
                description: 'StateFlow - Estado mutable observable',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const stateFlowRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.stateflow-estado-mutable-observable'
      );

      assert.ok(stateFlowRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.stateflow-estado-mutable-observable.ast'),
        true
      );
      assert.equal(
        stateFlowRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.stateflow-estado-mutable-observable.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android SharedFlow a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-sharedflow-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.sharedflow-hot-stream-puede-no-tener-valor-para-eventos',
                description: 'SharedFlow - Hot stream, puede no tener valor, para eventos',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const sharedFlowRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.sharedflow-hot-stream-puede-no-tener-valor-para-eventos'
      );

      assert.ok(sharedFlowRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.sharedflow-hot-stream-puede-no-tener-valor-para-eventos.ast'
        ),
        true
      );
      assert.equal(
        sharedFlowRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.sharedflow-hot-stream-puede-no-tener-valor-para-eventos.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android Flow builders a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-flow-builders-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.flow-builders-flow-emit-flowof-asflow',
                description: 'Flow builders - flow { emit() }, flowOf(), asFlow()',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const flowBuildersRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.flow-builders-flow-emit-flowof-asflow'
      );

      assert.ok(flowBuildersRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.flow-builders-flow-emit-flowof-asflow.ast'),
        true
      );
      assert.equal(
        flowBuildersRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.flow-builders-flow-emit-flowof-asflow.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android collect a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-collect-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.collect-terminal-operator-para-consumir-flow',
                description: 'collect - Terminal operator para consumir Flow',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const collectRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.collect-terminal-operator-para-consumir-flow'
      );

      assert.ok(collectRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.collect-terminal-operator-para-consumir-flow.ast'),
        true
      );
      assert.equal(
        collectRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.collect-terminal-operator-para-consumir-flow.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android collectAsState a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-collectasstate-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.collect-as-state-consumir-flow-en-compose',
                description: 'collectAsState - Consumir Flow en Compose',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const collectAsStateRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.collect-as-state-consumir-flow-en-compose'
      );

      assert.ok(collectAsStateRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.collect-as-state-consumir-flow-en-compose.ast'),
        true
      );
      assert.equal(
        collectAsStateRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.collect-as-state-consumir-flow-en-compose.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android remember a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-remember-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.remember-evitar-recrear-objetos',
                description: 'remember - Evitar recrear objetos',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const rememberRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.remember-evitar-recrear-objetos'
      );

      assert.ok(rememberRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.remember-evitar-recrear-objetos.ast'),
        true
      );
      assert.equal(
        rememberRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.remember-evitar-recrear-objetos.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android derivedStateOf a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-derivedstateof-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input',
                description: 'derivedStateOf - Cálculos caros solo cuando cambia input',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.derivedstateof-ca-lculos-derivados-de-state',
                description: 'derivedStateOf - Cálculos derivados de state',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
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

      const derivedStateOfRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input'
      );

      assert.ok(derivedStateOfRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input.ast'
        ),
        true
      );
      assert.equal(
        derivedStateOfRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input.ast]'
        ),
        true
      );
      const derivedStateOfDerivedRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.derivedstateof-ca-lculos-derivados-de-state'
      );

      assert.ok(derivedStateOfDerivedRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.derivedstateof-ca-lculos-derivados-de-state.ast'),
        true
      );
      assert.equal(
        derivedStateOfDerivedRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.derivedstateof-ca-lculos-derivados-de-state.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android LaunchedEffect a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-launchedeffect-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T10:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.launchedeffect-side-effects-con-lifecycle',
                description: 'LaunchedEffect - Side effects con lifecycle',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const launchedEffectRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.launchedeffect-side-effects-con-lifecycle'
      );

      assert.ok(launchedEffectRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.launchedeffect-side-effects-con-lifecycle.ast'),
        true
      );
      assert.equal(
        launchedEffectRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.launchedeffect-side-effects-con-lifecycle.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android LaunchedEffect keys a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-launchedeffect-keys-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T10:55:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.launchedeffect-keys-controlar-cuando-se-relanza-effect',
                description: 'LaunchedEffect keys - Controlar cuándo se relanza effect',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const launchedEffectKeysRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.launchedeffect-keys-controlar-cuando-se-relanza-effect'
      );

      assert.ok(launchedEffectKeysRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.launchedeffect-keys-controlar-cuando-se-relanza-effect.ast'
        ),
        true
      );
      assert.equal(
        launchedEffectKeysRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.launchedeffect-keys-controlar-cuando-se-relanza-effect.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android DisposableEffect a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-disposableeffect-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T10:55:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n',
                description: 'DisposableEffect - Cleanup cuando Composable sale de composición',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const disposableEffectRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n'
      );

      assert.ok(disposableEffectRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n.ast'
        ),
        true
      );
      assert.equal(
        disposableEffectRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android Preview a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-preview-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T10:55:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.preview-preview-para-ver-ui-sin-correr-app',
                description: 'Preview - @Preview para ver UI sin correr app',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const previewRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.preview-preview-para-ver-ui-sin-correr-app'
      );

      assert.ok(previewRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.preview-preview-para-ver-ui-sin-correr-app.ast'),
        true
      );
      assert.equal(
        previewRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.preview-preview-para-ver-ui-sin-correr-app.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android remember state retention a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-remember-state-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T10:55:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.remember-para-mantener-estado-entre-recomposiciones',
                description: 'remember - Para mantener estado entre recomposiciones',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const rememberStateRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.remember-para-mantener-estado-entre-recomposiciones'
      );

      assert.ok(rememberStateRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.remember-para-mantener-estado-entre-recomposiciones.ast'
        ),
        true
      );
      assert.equal(
        rememberStateRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.remember-para-mantener-estado-entre-recomposiciones.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android Recomposition a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-recomposition-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T10:55:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.recomposition-composables-deben-ser-idempotentes',
                description: 'Recomposition - Composables deben ser idempotentes',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const recompositionRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.recomposition-composables-deben-ser-idempotentes'
      );

      assert.ok(recompositionRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.recomposition-composables-deben-ser-idempotentes.ast'
        ),
        true
      );
      assert.equal(
        recompositionRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.recomposition-composables-deben-ser-idempotentes.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android UiState a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-uistate-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.uistate-sealed-class-loading-success-error-states',
                description: 'UiState sealed class - Loading, Success, Error states',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const uiStateRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.uistate-sealed-class-loading-success-error-states'
      );

      assert.ok(uiStateRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.uistate-sealed-class-loading-success-error-states.ast'
        ),
        true
      );
      assert.equal(
        uiStateRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.uistate-sealed-class-loading-success-error-states.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android Use Cases a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-use-cases-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.use-cases-lo-gica-de-negocio-encapsulada',
                description: 'Use Cases - Lógica de negocio encapsulada',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const useCasesRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.use-cases-lo-gica-de-negocio-encapsulada'
      );

      assert.ok(useCasesRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.use-cases-lo-gica-de-negocio-encapsulada.ast'
        ),
        true
      );
      assert.equal(
        useCasesRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.use-cases-lo-gica-de-negocio-encapsulada.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android Repository pattern a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-repository-pattern-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.repository-pattern-abstraer-acceso-a-datos',
                description: 'Repository pattern - Abstraer acceso a datos',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const repositoryRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.repository-pattern-abstraer-acceso-a-datos'
      );

      assert.ok(repositoryRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.repository-pattern-abstraer-acceso-a-datos.ast'
        ),
        true
      );
      assert.equal(
        repositoryRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.repository-pattern-abstraer-acceso-a-datos.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android state hoisting a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-state-hoisting-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.state-hoisting-elevar-estado-al-nivel-apropiado',
                description: 'State hoisting - Elevar estado al nivel apropiado',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const stateHoistingRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.state-hoisting-elevar-estado-al-nivel-apropiado'
      );

      assert.ok(stateHoistingRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.state-hoisting-elevar-estado-al-nivel-apropiado.ast'
        ),
        true
      );
      assert.equal(
        stateHoistingRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.state-hoisting-elevar-estado-al-nivel-apropiado.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android single source of truth a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-sot-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.single-source-of-truth-viewmodel-es-la-fuente',
                description: 'Single source of truth - ViewModel es la fuente',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const singleSourceRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.single-source-of-truth-viewmodel-es-la-fuente'
      );

      assert.ok(singleSourceRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.stateflow-estado-mutable-observable.ast'),
        false
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has(
          'heuristics.android.single-source-of-truth-viewmodel-es-la-fuente.ast'
        ),
        true
      );
      assert.equal(
        singleSourceRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.single-source-of-truth-viewmodel-es-la-fuente.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android app startup a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-app-startup-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.app-startup-androidx-startup-para-lazy-init',
                description: 'App startup - androidx.startup para lazy init',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const appStartupRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.app-startup-androidx-startup-para-lazy-init'
      );

      assert.ok(appStartupRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.app-startup-androidx-startup-para-lazy-init.ast'),
        true
      );
      assert.equal(
        appStartupRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.app-startup-androidx-startup-para-lazy-init.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android analytics a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-analytics-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T10:58:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.analytics-firebase-analytics-o-custom',
                description: 'Analytics - Firebase Analytics o custom',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.android-profiler-cpu-memory-network-profiling',
                description: 'Android Profiler - CPU, Memory, Network profiling',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
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

      const analyticsRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.analytics-firebase-analytics-o-custom'
      );

      assert.ok(analyticsRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.analytics-firebase-analytics-o-custom.ast'),
        true
      );
      assert.equal(
        analyticsRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.analytics-firebase-analytics-o-custom.ast]'
        ),
        true
      );

      const profilerRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.android-profiler-cpu-memory-network-profiling'
      );

      assert.ok(profilerRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.android-profiler-cpu-memory-network-profiling.ast'),
        true
      );
      assert.equal(
        profilerRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.android-profiler-cpu-memory-network-profiling.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android baseline profiles a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-baseline-profiles-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/androidTest/kotlin/com/acme'), {
        recursive: true,
      });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.baseline-profiles-optimizacio-n-de-startup',
                description: 'Baseline Profiles - Optimización de startup',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const baselineProfilesRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.baseline-profiles-optimizacio-n-de-startup'
      );

      assert.ok(baselineProfilesRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.baseline-profiles-optimizacio-n-de-startup.ast'),
        true
      );
      assert.equal(
        baselineProfilesRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.baseline-profiles-optimizacio-n-de-startup.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android skip recomposition a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-skip-recomposition-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme/ui'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T10:55:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.skip-recomposition-para-metros-inmutables-o-estables',
                description: 'Skip recomposition - Parámetros inmutables o estables',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const skipRecompositionRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.skip-recomposition-para-metros-inmutables-o-estables'
      );

      assert.ok(skipRecompositionRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.skip-recomposition-para-metros-inmutables-o-estables.ast'),
        true
      );
      assert.equal(
        skipRecompositionRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.skip-recomposition-para-metros-inmutables-o-estables.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android stability a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-stability-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme/ui'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T10:57:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.stability-composables-estables-recomponen-menos',
                description: 'Stability - Composables estables recomponen menos',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const stabilityRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.stability-composables-estables-recomponen-menos'
      );

      assert.ok(stabilityRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.stability-composables-estables-recomponen-menos.ast'),
        true
      );
      assert.equal(
        stabilityRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.stability-composables-estables-recomponen-menos.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android ViewModel a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-viewmodel-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.viewmodel-androidx-lifecycle-viewmodel',
                description: 'ViewModel - AndroidX Lifecycle ViewModel',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.android.guideline.android.viewmodel-sobrevive-configuration-changes',
                description: 'ViewModel - Sobrevive cambios de configuración',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
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

      const viewModelRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.viewmodel-androidx-lifecycle-viewmodel'
      );
      const survivesConfigRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.android.guideline.android.viewmodel-sobrevive-configuration-changes'
      );

      assert.ok(viewModelRule);
      assert.ok(survivesConfigRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.viewmodel-androidx-lifecycle-viewmodel.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.viewmodel-sobrevive-configuration-changes.ast'),
        true
      );
      assert.equal(
        viewModelRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.viewmodel-androidx-lifecycle-viewmodel.ast]'
        ),
        true
      );
      assert.equal(
        survivesConfigRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.viewmodel-sobrevive-configuration-changes.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android suspend functions en API service a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-suspend-functions-api-service-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.suspend-functions-en-api-service',
                description: 'suspend functions - En API service',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const suspendFunctionsRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.suspend-functions-en-api-service'
      );

      assert.ok(suspendFunctionsRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.suspend-functions-en-api-service.ast'),
        true
      );
      assert.equal(
        suspendFunctionsRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.suspend-functions-en-api-service.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android DAO suspend functions a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-dao-suspend-functions-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.dao-data-access-objects-con-suspend-functions',
                description: '@Dao - Data Access Objects con suspend functions',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const daoRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.dao-data-access-objects-con-suspend-functions'
      );

      assert.ok(daoRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.dao-data-access-objects-con-suspend-functions.ast'),
        true
      );
      assert.equal(
        daoRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.dao-data-access-objects-con-suspend-functions.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas Android Transaction a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-android-transaction-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/android/src/main/kotlin/com/acme'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'android-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/android-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.android.guideline.android.transaction-para-operaciones-multi-query',
                description: '@Transaction - Para operaciones multi-query',
                severity: 'WARN',
                platform: 'android',
                sourceSkill: 'android-guidelines',
                sourcePath: 'docs/codex-skills/android-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const transactionRule = result.rules.find(
        (rule) => rule.id === 'skills.android.guideline.android.transaction-para-operaciones-multi-query'
      );

      assert.ok(transactionRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.android.transaction-para-operaciones-multi-query.ast'),
        true
      );
      assert.equal(
        transactionRule?.then.source?.includes(
          'ast_nodes=[heuristics.android.transaction-para-operaciones-multi-query.ast]'
        ),
        true
      );
    })
  );
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
            source: 'file:docs/codex-skills/backend-enterprise-rules.md',
            hash: 'd'.repeat(64),
            rules: [
              {
                id: 'skills.backend.no-solid-violations',
                description: 'Verificar que NO viole SOLID (SRP, OCP, LSP, ISP, DIP).',
                severity: 'ERROR',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.no-god-classes',
                description:
                  'God classes - Servicios que mezclan responsabilidades de dominio, aplicacion, infraestructura, branching de tipos o contratos en una misma clase.',
                severity: 'ERROR',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.no-singleton',
                description:
                  'No Singleton, en su lugar Inyección de Dependencias - NestJS DI container',
                severity: 'ERROR',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.magic-numbers-usar-constantes-con-nombres-descriptivos',
                description: 'Magic numbers - Usar constantes con nombres descriptivos',
                severity: 'ERROR',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.hardcoded-values-config-en-variables-de-entorno',
                description: 'Hardcoded values - Config en variables de entorno',
                severity: 'ERROR',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.no-defaults-en-produccio-n-fallar-si-falta-config-cri-tica',
                description: 'No defaults en producción - Fallar si falta config crítica',
                severity: 'ERROR',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.guideline.backend.loggear-errores-con-contexto-completo',
                description: 'Loggear errores - Con contexto completo',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.guideline.backend.correlation-ids-para-tracing-distribuido',
                description: 'Correlation IDs - Para tracing distribuido',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.guideline.backend.cors-configurado-solo-ori-genes-permitidos',
                description: 'CORS configurado - Solo orígenes permitidos',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.guideline.backend.cors-configurar-ori-genes-permitidos',
                description: 'CORS - Configurar orígenes permitidos',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.guideline.backend.pipes-para-validacio-n-global-validationpipe-en-main-ts',
                description: 'Pipes para validación global - ValidationPipe en main.ts',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.guideline.backend.validationpipe-global-en-main-ts-con-whitelist-true',
                description: 'ValidationPipe global - En main.ts con whitelist: true',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.guideline.backend.versionado-api-v1-api-v2',
                description: 'Versionado - /api/v1/, /api/v2/',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.guideline.backend.validation-de-config-joi-o-class-validator-para-env',
                description: 'Validation de config - Joi o class-validator para .env',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.guideline.backend.transacciones-para-operaciones-cri-ticas',
                description: 'Transacciones - Para operaciones críticas',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.guideline.backend.transacciones-para-operaciones-multi-tabla',
                description: 'Transacciones - Para operaciones multi-tabla',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.guideline.backend.me-tricas-prometheus-prom-client-para-me-tricas',
                description: 'Métricas Prometheus - prom-client para métricas',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.callback-hell-usar-async-await',
                description: 'Callback hell - usar async/await en lugar de callbacks anidados',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 18);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);
      const solidRule = result.rules.find((rule) => rule.id === 'skills.backend.no-solid-violations');
      const godClassRule = result.rules.find((rule) => rule.id === 'skills.backend.no-god-classes');
      const singletonRule = result.rules.find((rule) => rule.id === 'skills.backend.no-singleton');
      const magicNumbersRule = result.rules.find(
        (rule) => rule.id === 'skills.backend.magic-numbers-usar-constantes-con-nombres-descriptivos'
      );
      const hardcodedValuesRule = result.rules.find(
        (rule) => rule.id === 'skills.backend.hardcoded-values-config-en-variables-de-entorno'
      );
      const noDefaultsRule = result.rules.find(
        (rule) => rule.id === 'skills.backend.no-defaults-en-produccio-n-fallar-si-falta-config-cri-tica'
      );
      const errorLoggingRule = result.rules.find(
        (rule) => rule.id === 'skills.backend.guideline.backend.loggear-errores-con-contexto-completo'
      );
      const correlationIdsRule = result.rules.find(
        (rule) => rule.id === 'skills.backend.guideline.backend.correlation-ids-para-tracing-distribuido'
      );
      const corsConfiguredRule = result.rules.find(
        (rule) => rule.id === 'skills.backend.guideline.backend.cors-configurado-solo-ori-genes-permitidos'
      );
      const corsAllowedOriginsRule = result.rules.find(
        (rule) => rule.id === 'skills.backend.guideline.backend.cors-configurar-ori-genes-permitidos'
      );
      const validationPipeGlobalRule = result.rules.find(
        (rule) => rule.id === 'skills.backend.guideline.backend.pipes-para-validacio-n-global-validationpipe-en-main-ts'
      );
      const validationPipeWhitelistRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.backend.guideline.backend.validationpipe-global-en-main-ts-con-whitelist-true'
      );
      const versionadoRule = result.rules.find(
        (rule) => rule.id === 'skills.backend.guideline.backend.versionado-api-v1-api-v2'
      );
      const validationConfigRule = result.rules.find(
        (rule) => rule.id === 'skills.backend.guideline.backend.validation-de-config-joi-o-class-validator-para-env'
      );
      const criticalTransactionsRule = result.rules.find(
        (rule) => rule.id === 'skills.backend.guideline.backend.transacciones-para-operaciones-cri-ticas'
      );
      const multiTableTransactionsRule = result.rules.find(
        (rule) => rule.id === 'skills.backend.guideline.backend.transacciones-para-operaciones-multi-tabla'
      );
      const metricsRule = result.rules.find(
        (rule) => rule.id === 'skills.backend.guideline.backend.me-tricas-prometheus-prom-client-para-me-tricas'
      );
      const callbackHellRule = result.rules.find(
        (rule) => rule.id === 'skills.backend.callback-hell-usar-async-await'
      );
      assert.ok(solidRule);
      assert.ok(godClassRule);
      assert.ok(singletonRule);
      assert.ok(magicNumbersRule);
      assert.ok(hardcodedValuesRule);
      assert.ok(noDefaultsRule);
      assert.ok(errorLoggingRule);
      assert.ok(correlationIdsRule);
      assert.ok(corsConfiguredRule);
      assert.ok(corsAllowedOriginsRule);
      assert.ok(validationPipeGlobalRule);
      assert.ok(validationPipeWhitelistRule);
      assert.ok(versionadoRule);
      assert.ok(validationConfigRule);
      assert.ok(criticalTransactionsRule);
      assert.ok(multiTableTransactionsRule);
      assert.ok(metricsRule);
      assert.ok(callbackHellRule);
      assert.equal(solidRule.when.kind, 'Any');
      assert.equal(solidRule.when.conditions.length >= 2, true);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.solid.srp.class-command-query-mix.ast'), true);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.god-class-large-class.ast'), true);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.singleton-pattern.ast'), true);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.magic-numbers.ast'), true);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.hardcoded-values.ast'), true);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.env-default-fallback.ast'), true);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.error-logging-full-context.ast'), true);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.correlation-ids.ast'), true);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.cors-configured.ast'), true);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.validationpipe-global.ast'), true);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.versionado-api-v1-api-v2.ast'), true);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.validation-config.ast'), true);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.ts.transacciones-para-operaciones-cri-ticas.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.ts.transacciones-para-operaciones-multi-tabla.ast'),
        true
      );
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.prometheus-prom-client.ast'), true);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.callback-hell.ast'), true);
    })
  );
});

test('mapea reglas backend DTO validation a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-backend-dto-validation-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/backend/src/application'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/backend-enterprise-rules.md',
            hash: 'e'.repeat(64),
            rules: [
              {
                id: 'skills.backend.guideline.backend.class-validator-decorators-isstring-isemail-min-max',
                description: 'class-validator decorators - @IsString(), @IsEmail(), @Min(), @Max()',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
              {
                id: 'skills.backend.guideline.backend.class-transformer-transform-exclude-expose',
                description: 'class-transformer - @Transform(), @Exclude(), @Expose()',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
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

      const classValidatorRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.backend.guideline.backend.class-validator-decorators-isstring-isemail-min-max'
      );
      const classTransformerRule = result.rules.find(
        (rule) =>
          rule.id === 'skills.backend.guideline.backend.class-transformer-transform-exclude-expose'
      );

      assert.ok(classValidatorRule);
      assert.ok(classTransformerRule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.ts.class-validator-decorators.ast'),
        true
      );
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.ts.class-transformer-decorators.ast'),
        true
      );
      assert.equal(
        classValidatorRule?.then.source?.includes(
          'ast_nodes=[heuristics.ts.class-validator-decorators.ast]'
        ),
        true
      );
      assert.equal(
        classTransformerRule?.then.source?.includes(
          'ast_nodes=[heuristics.ts.class-transformer-decorators.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas backend DTO boundaries a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-backend-dto-boundaries-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/backend/src/application'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:50:00.000Z',
        bundles: [
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/backend-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.backend.guideline.backend.dtos-en-boundaries-validacio-n-en-entrada-salida',
                description: 'DTOs en boundaries - Validación en entrada/salida',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const rule = result.rules.find(
        (current) =>
          current.id === 'skills.backend.guideline.backend.dtos-en-boundaries-validacio-n-en-entrada-salida'
      );

      assert.ok(rule);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.dtos-en-boundaries-validacio-n-en-entrada-salida.ast'), true);
      assert.equal(
        rule?.then.source?.includes(
          'ast_nodes=[heuristics.ts.dtos-en-boundaries-validacio-n-en-entrada-salida.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas backend DTOs separados a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-backend-dto-separated-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/backend/src/application'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:55:00.000Z',
        bundles: [
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/backend-enterprise-rules.md',
            hash: '9'.repeat(64),
            rules: [
              {
                id: 'skills.backend.guideline.backend.dtos-separados-createorderdto-updateorderdto-orderresponsedto',
                description: 'DTOs separados - CreateOrderDto, UpdateOrderDto, OrderResponseDto',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const rule = result.rules.find(
        (current) =>
          current.id === 'skills.backend.guideline.backend.dtos-separados-createorderdto-updateorderdto-orderresponsedto'
      );

      assert.ok(rule);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.dtos-separados-createorderdto-updateorderdto-orderresponsedto.ast'), true);
      assert.equal(
        rule?.then.source?.includes(
          'ast_nodes=[heuristics.ts.dtos-separados-createorderdto-updateorderdto-orderresponsedto.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas backend nested validation a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-backend-nested-validation-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/backend/src/presentation'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T10:05:00.000Z',
        bundles: [
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/backend-enterprise-rules.md',
            hash: '4'.repeat(64),
            rules: [
              {
                id: 'skills.backend.guideline.backend.nested-validation-validatenested-type',
                description: 'Nested validation - @ValidateNested(), @Type()',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const rule = result.rules.find(
        (current) =>
          current.id === 'skills.backend.guideline.backend.nested-validation-validatenested-type'
      );

      assert.ok(rule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.ts.nested-validation-validatenested-type.ast'),
        true
      );
      assert.equal(
        rule?.then.source?.includes(
          'ast_nodes=[heuristics.ts.nested-validation-validatenested-type.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas backend input validation a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-backend-input-validation-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/backend/src/presentation'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T10:05:00.000Z',
        bundles: [
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/backend-enterprise-rules.md',
            hash: '3'.repeat(64),
            rules: [
              {
                id: 'skills.backend.guideline.backend.input-validation-siempre-validar-con-dtos',
                description: 'Input validation - SIEMPRE validar con DTOs',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);

      const rule = result.rules.find(
        (current) =>
          current.id === 'skills.backend.guideline.backend.input-validation-siempre-validar-con-dtos'
      );

      assert.ok(rule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.ts.input-validation-siempre-validar-con-dtos.ast'),
        true
      );
      assert.equal(
        rule?.then.source?.includes(
          'ast_nodes=[heuristics.ts.input-validation-siempre-validar-con-dtos.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas backend y frontend de clean architecture a detector AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-clean-architecture-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/backend/src/application'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/backend-enterprise-rules.md',
            hash: 'd'.repeat(64),
            rules: [
              {
                id: 'skills.backend.enforce-clean-architecture',
                description: 'Enforce clean architecture dependency direction in backend code.',
                severity: 'ERROR',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);
      const rule = result.rules.find((entry) => entry.id === 'skills.backend.enforce-clean-architecture');
      assert.ok(rule);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.clean-architecture.ast'), true);
    })
  );
});

test('mapea reglas backend de mocks en produccion a detector AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-backend-mocks-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/backend/src/application'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/backend-enterprise-rules.md',
            hash: 'e'.repeat(64),
            rules: [
              {
                id: 'skills.backend.mocks-en-produccio-n-solo-datos-reales',
                description:
                  'Mocks en producción - Solo datos reales y servicios reales en runtime backend.',
                severity: 'ERROR',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);
      const rule = result.rules.find(
        (entry) => entry.id === 'skills.backend.mocks-en-produccio-n-solo-datos-reales'
      );
      assert.ok(rule);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.production-mock.ast'), true);
    })
  );
});

test('mapea reglas backend de exception filters a detector AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-backend-exception-filters-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/backend/src/presentation'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:45:00.000Z',
        bundles: [
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/backend-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.backend.exception-filters-catch-para-manejo-global',
                description:
                  'Exception filters - Catch para manejo global de excepciones backend.',
                severity: 'ERROR',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);
      const rule = result.rules.find(
        (entry) => entry.id === 'skills.backend.exception-filters-catch-para-manejo-global'
      );
      assert.ok(rule);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.exception-filter.ast'), true);
    })
  );
});

test('mapea reglas backend de guards a detector AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-backend-guards-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/backend/src/presentation'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:55:00.000Z',
        bundles: [
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/backend-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.backend.guards-para-autenticacio-n-autorizacio-n-useguards-jwtauthguard',
                description:
                  'Guards - UseGuards(JwtAuthGuard) para autenticación/autorización backend.',
                severity: 'ERROR',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);
      const rule = result.rules.find(
        (entry) =>
          entry.id === 'skills.backend.guards-para-autenticacio-n-autorizacio-n-useguards-jwtauthguard'
      );
      assert.ok(rule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.ts.guards-useguards-jwtauthguard.ast'),
        true
      );
    })
  );
});

test('mapea reglas backend de interceptors a detector AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-backend-interceptors-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/backend/src/presentation'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T10:10:00.000Z',
        bundles: [
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/backend-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.backend.interceptors-para-logging-transformacio-n-no-en-cada-endpoint',
                description:
                  'Interceptors para logging/transformación - No en cada endpoint.',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);
      const rule = result.rules.find(
        (entry) =>
          entry.id === 'skills.backend.interceptors-para-logging-transformacio-n-no-en-cada-endpoint'
      );
      assert.ok(rule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.ts.interceptors-useinterceptors-logging-transform.ast'),
        true
      );
    })
  );
});

test('mapea reglas backend de datos sensibles en logs a detector AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-backend-sensitive-logs-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/backend/src/presentation'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T10:25:00.000Z',
        bundles: [
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/backend-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.backend.no-loggear-datos-sensibles-passwords-tokens-pii',
                description: 'No loggear datos sensibles - Passwords, tokens, PII.',
                severity: 'ERROR',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);
      const rule = result.rules.find(
        (entry) => entry.id === 'skills.backend.no-loggear-datos-sensibles-passwords-tokens-pii'
      );
      assert.ok(rule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.ts.no-sensitive-log.ast'),
        true
      );
    })
  );
});

test('mapea reglas backend de retorno de DTOs a detector AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-backend-return-dtos-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/backend/src/application/orders'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T10:35:00.000Z',
        bundles: [
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/backend-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.backend.guideline.backend.retornar-dtos-no-exponer-entidades-directamente',
                description: 'Retornar DTOs - No exponer entidades directamente.',
                severity: 'WARN',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);
      const rule = result.rules.find(
        (entry) =>
          entry.id === 'skills.backend.guideline.backend.retornar-dtos-no-exponer-entidades-directamente'
      );
      assert.ok(rule);
      assert.equal(
        result.mappedHeuristicRuleIds.has('heuristics.ts.return-dtos-no-exponer-entidades-directamente.ast'),
        true
      );
      assert.equal(
        rule?.then.source?.includes(
          'ast_nodes=[heuristics.ts.return-dtos-no-exponer-entidades-directamente.ast]'
        ),
        true
      );
    })
  );
});

test('mapea reglas backend de password hashing a detector AST heuristics', () => {
  const result = loadSkillsRuleSetForStage('PRE_PUSH');
  const rule = result.rules.find(
    (entry) => entry.id === 'skills.backend.password-hashing-bcrypt-con-salt-rounds-10'
  );

  assert.ok(rule);
  assert.equal(
    result.mappedHeuristicRuleIds.has('heuristics.ts.password-hashing-bcrypt-salt-rounds-10.ast'),
    true
  );
});

test('mapea reglas backend de transacciones a detectores AST heuristics', () => {
  const result = loadSkillsRuleSetForStage('PRE_PUSH');
  const criticalTransactionsRule = result.rules.find(
    (entry) => entry.id === 'skills.backend.guideline.backend.transacciones-para-operaciones-cri-ticas'
  );
  const multiTableTransactionsRule = result.rules.find(
    (entry) => entry.id === 'skills.backend.guideline.backend.transacciones-para-operaciones-multi-tabla'
  );

  assert.ok(criticalTransactionsRule);
  assert.ok(multiTableTransactionsRule);
  assert.equal(
    result.mappedHeuristicRuleIds.has('heuristics.ts.transacciones-para-operaciones-cri-ticas.ast'),
    true
  );
  assert.equal(
    result.mappedHeuristicRuleIds.has('heuristics.ts.transacciones-para-operaciones-multi-tabla.ast'),
    true
  );
});

test('mapea reglas backend de rate limiting a detector AST heuristics', () => {
  const result = loadSkillsRuleSetForStage('PRE_PUSH');
  const bruteForceRule = result.rules.find(
    (entry) =>
      entry.id ===
      'skills.backend.guideline.backend.rate-limiting-nestjs-throttler-para-prevenir-brute-force'
  );
  const abuseRule = result.rules.find(
    (entry) =>
      entry.id === 'skills.backend.guideline.backend.rate-limiting-throttler-para-prevenir-abuse'
  );

  assert.ok(bruteForceRule);
  assert.ok(abuseRule);
  assert.equal(
    result.mappedHeuristicRuleIds.has('heuristics.ts.rate-limiting-throttler.ast'),
    true
  );
});

test('mapea reglas backend de winston a detector AST heuristics', () => {
  const result = loadSkillsRuleSetForStage('PRE_PUSH');
  const rule = result.rules.find(
    (entry) => entry.id === 'skills.backend.guideline.backend.winston-logger-estructurado-json-logs'
  );

  assert.ok(rule);
  assert.equal(
    result.mappedHeuristicRuleIds.has('heuristics.ts.winston-structured-json-logger.ast'),
    true
  );
});

test('mapea reglas SOLID y God Class a detectores AST heuristics en frontend', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-frontend-god-class-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/frontend'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-02-07T23:15:00.000Z',
        bundles: [
          {
            name: 'frontend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/frontend-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.frontend.no-god-classes',
                description:
                  'God classes - Componentes que mezclan responsabilidades de dominio, aplicacion, infraestructura, branching de tipos o contratos en una misma clase.',
                severity: 'ERROR',
                platform: 'frontend',
                sourceSkill: 'frontend-guidelines',
                sourcePath: 'docs/codex-skills/frontend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);
      const godClassRule = result.rules.find((rule) => rule.id === 'skills.frontend.no-god-classes');
      assert.ok(godClassRule);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.god-class-large-class.ast'), true);
    })
  );
});

test('mapea reglas frontend de class components a detectores AST heuristics', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-frontend-class-components-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/frontend/src/components'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-02-07T23:15:00.000Z',
        bundles: [
          {
            name: 'frontend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/frontend-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.frontend.no-class-components',
                description: 'Disallow React class components in frontend code; use functional components.',
                severity: 'ERROR',
                platform: 'frontend',
                sourceSkill: 'frontend-guidelines',
                sourcePath: 'docs/codex-skills/frontend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage('PRE_PUSH', tempRoot);
      assert.equal(result.rules.length, 1);
      assert.deepEqual(result.unsupportedAutoRuleIds, []);
      const classComponentRule = result.rules.find(
        (rule) => rule.id === 'skills.frontend.no-class-components'
      );
      assert.ok(classComponentRule);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.react-class-component.ast'), true);
      assert.equal(
        classComponentRule?.then.source?.includes('ast_nodes=[heuristics.ts.react-class-component.ast]'),
        true
      );
    })
  );
});

test('enriquce mensaje de no-solid-violations con criterios accionables y métricas observadas', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-solid-actionable-message-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/web/src/presentation'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-03-05T10:00:00.000Z',
        bundles: [
          {
            name: 'frontend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/frontend-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.frontend.no-solid-violations',
                description: 'Verificar que NO viole SOLID (SRP, OCP, LSP, ISP, DIP).',
                severity: 'ERROR',
                platform: 'frontend',
                sourceSkill: 'frontend-guidelines',
                sourcePath: 'docs/codex-skills/frontend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage(
        'PRE_COMMIT',
        tempRoot,
        undefined,
        ['apps/web/src/presentation/App.tsx']
      );
      const rule = result.rules.find((item) => item.id === 'skills.frontend.no-solid-violations');
      assert.ok(rule);
      if (rule.then.kind !== 'Finding') {
        assert.fail('Expected finding consequence for skills.frontend.no-solid-violations');
      }
      assert.match(rule.then.message, /Criteria: ast_nodes=\[/);
      assert.match(rule.then.message, /observed_paths=1/);
      assert.match(rule.then.message, /sample_paths=\[apps\/web\/src\/presentation\/App\.tsx\]/);
    })
  );
});

test('resuelve no-singleton frontend como AUTO con heuristica singleton', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-frontend-singleton-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/web/src/presentation'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:00:00.000Z',
        bundles: [
          {
            name: 'frontend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/frontend-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.frontend.no-singleton',
                description:
                  'No Singleton, en su lugar Inyección de Dependencias - Usar providers, context o DI containers',
                severity: 'ERROR',
                platform: 'frontend',
                sourceSkill: 'frontend-guidelines',
                sourcePath: 'docs/codex-skills/frontend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage(
        'PRE_PUSH',
        tempRoot,
        undefined,
        ['apps/web/src/presentation/App.tsx']
      );
      const rule = result.rules.find((item) => item.id === 'skills.frontend.no-singleton');
      assert.ok(rule);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.singleton-pattern.ast'), true);
    })
  );
});

test('resuelve callback hell frontend como AUTO con heuristica callback hell', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-frontend-callback-hell-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/web/src/presentation'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-04-29T09:30:00.000Z',
        bundles: [
          {
            name: 'frontend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/frontend-enterprise-rules.md',
            hash: 'f'.repeat(64),
            rules: [
              {
                id: 'skills.frontend.callback-hell-usar-async-await',
                description: 'Callback hell - usar async/await en lugar de callbacks anidados',
                severity: 'WARN',
                platform: 'frontend',
                sourceSkill: 'frontend-guidelines',
                sourcePath: 'docs/codex-skills/frontend-enterprise-rules.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const result = loadSkillsRuleSetForStage(
        'PRE_PUSH',
        tempRoot,
        undefined,
        ['apps/web/src/presentation/App.tsx']
      );
      const rule = result.rules.find(
        (item) => item.id === 'skills.frontend.callback-hell-usar-async-await'
      );
      assert.ok(rule);
      assert.equal(result.mappedHeuristicRuleIds.has('heuristics.ts.callback-hell.ast'), true);
    })
  );
});

test('promueve no-solid-violations a ERROR en PRE_PUSH aunque la skill fuente llegue como WARN', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-solid-promotion-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/backend/src/runtime'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-03-10T19:00:00.000Z',
        bundles: [
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:vendor/skills/backend-enterprise-rules/SKILL.md',
            hash: 'b'.repeat(64),
            rules: [
              {
                id: 'skills.backend.no-solid-violations',
                description: 'Verificar que NO viole SOLID (SRP, OCP, LSP, ISP, DIP)',
                severity: 'WARN',
                platform: 'backend',
                confidence: 'MEDIUM',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'vendor/skills/backend-enterprise-rules/SKILL.md',
                evaluationMode: 'AUTO',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const preCommit = loadSkillsRuleSetForStage(
        'PRE_COMMIT',
        tempRoot,
        undefined,
        ['apps/backend/src/runtime/pumuki-srp-canary.ts']
      );
      const prePush = loadSkillsRuleSetForStage(
        'PRE_PUSH',
        tempRoot,
        undefined,
        ['apps/backend/src/runtime/pumuki-srp-canary.ts']
      );

      const preCommitRule = preCommit.rules.find(
        (rule) => rule.id === 'skills.backend.no-solid-violations'
      );
      const prePushRule = prePush.rules.find(
        (rule) => rule.id === 'skills.backend.no-solid-violations'
      );

      assert.equal(preCommitRule?.severity, 'WARN');
      assert.equal(prePushRule?.severity, 'ERROR');
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
          source: 'file:docs/codex-skills/backend-enterprise-rules.md',
          hash: 'a'.repeat(64),
          rules: [
            {
              id: 'skills.backend.no-empty-catch',
              description: 'Disallow empty catch blocks in backend runtime code.',
              severity: 'CRITICAL',
              platform: 'backend',
              sourceSkill: 'backend-guidelines',
              sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
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

test('falls back to unscoped heuristic conditions when platform folders exist but observed paths are outside apps/*', async () => {
  await withCoreSkillsDisabled(async () =>
    withTempDir('pumuki-skills-ruleset-empty-platform-tree-', async (tempRoot) => {
      mkdirSync(join(tempRoot, 'apps/backend'), { recursive: true });

      const lock = {
        version: '1.0',
        compilerVersion: '1.0.0',
        generatedAt: '2026-02-07T23:15:00.000Z',
        bundles: [
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/backend-enterprise-rules.md',
            hash: 'a'.repeat(64),
            rules: [
              {
                id: 'skills.backend.no-empty-catch',
                description: 'Disallow empty catch blocks in backend runtime code.',
                severity: 'CRITICAL',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                locked: true,
              },
            ],
          },
        ],
      } as const;

      writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(lock, null, 2));

      const detectedPlatforms: DetectedPlatforms = {
        backend: { detected: true, confidence: 'HIGH' },
      };
      const observedPaths = [
        'integrations/git/runPlatformGate.ts',
        'scripts/framework-menu-gate-lib.ts',
      ];

      const result = (
        loadSkillsRuleSetForStage as unknown as (
          stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI',
          repoRoot?: string,
          detectedPlatforms?: DetectedPlatforms,
          observedFilePaths?: ReadonlyArray<string>
        ) => ReturnType<typeof loadSkillsRuleSetForStage>
      )('PRE_COMMIT', tempRoot, detectedPlatforms, observedPaths);

      const backendRule = result.rules.find((rule) => rule.id === 'skills.backend.no-empty-catch');
      assert.ok(backendRule);
      assert.equal(backendRule.when.kind, 'Heuristic');
      assert.equal(backendRule.when.where?.filePathPrefix, undefined);
    })
  );
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
          source: 'file:docs/codex-skills/ios-enterprise-rules.md',
          hash: 'a'.repeat(64),
          rules: [
            {
              id: 'skills.ios.no-force-try',
              description: 'Disallow force try in production iOS code.',
              severity: 'WARN',
              platform: 'ios',
              sourceSkill: 'ios-guidelines',
              sourcePath: 'docs/codex-skills/ios-enterprise-rules.md',
              locked: true,
            },
          ],
        },
        {
          name: 'backend-guidelines',
          version: '1.0.0',
          source: 'file:docs/codex-skills/backend-enterprise-rules.md',
          hash: 'b'.repeat(64),
          rules: [
            {
              id: 'skills.backend.no-empty-catch',
              description: 'Disallow empty catch blocks in backend runtime code.',
              severity: 'CRITICAL',
              platform: 'backend',
              sourceSkill: 'backend-guidelines',
              sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
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
    assert.deepEqual(ruleIds, []);
    assert.deepEqual(result.registryCoverage?.declarativeRuleIds, [
      'skills.generic.architecture-note',
    ]);
    assert.equal(result.registryCoverage?.registryTotals.declarative, 1);
    assert.deepEqual(result.unsupportedDetectorRuleIds, [
      'skills.generic.architecture-note',
    ]);
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
            source: 'file:docs/codex-skills/ios-enterprise-rules.md',
            hash: 'a'.repeat(64),
            rules: [
              {
                id: 'skills.ios.no-force-try',
                description: 'Disallow force try in production iOS code.',
                severity: 'WARN',
                platform: 'ios',
                sourceSkill: 'ios-guidelines',
                sourcePath: 'docs/codex-skills/ios-enterprise-rules.md',
                locked: true,
              },
            ],
          },
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/backend-enterprise-rules.md',
            hash: 'b'.repeat(64),
            rules: [
              {
                id: 'skills.backend.no-empty-catch',
                description: 'Disallow empty catch blocks in backend runtime code.',
                severity: 'CRITICAL',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
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
            source: 'file:docs/codex-skills/ios-enterprise-rules.md',
            hash: 'a'.repeat(64),
            rules: [
              {
                id: 'skills.ios.no-force-try',
                description: 'Disallow force try in production iOS code.',
                severity: 'WARN',
                platform: 'ios',
                sourceSkill: 'ios-guidelines',
                sourcePath: 'docs/codex-skills/ios-enterprise-rules.md',
                stage: 'PRE_PUSH',
                locked: true,
              },
            ],
          },
          {
            name: 'backend-guidelines',
            version: '1.0.0',
            source: 'file:docs/codex-skills/backend-enterprise-rules.md',
            hash: 'b'.repeat(64),
            rules: [
              {
                id: 'skills.backend.no-empty-catch',
                description: 'Disallow empty catch blocks in backend runtime code.',
                severity: 'CRITICAL',
                platform: 'backend',
                sourceSkill: 'backend-guidelines',
                sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
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

      assert.deepEqual(serializeRuleSetForParity(preCommit), {
        rules: [],
        mappedHeuristicRuleIds: [],
        unsupportedAutoRuleIds: [],
      });
      assert.deepEqual(serializeRuleSetForParity(prePush), serializeRuleSetForParity(ci));
      assert.deepEqual(prePush.registryCoverage?.stageApplicableAutoRuleIds, [
        'skills.backend.no-empty-catch',
        'skills.ios.no-force-try',
      ]);
    })
  );
});
