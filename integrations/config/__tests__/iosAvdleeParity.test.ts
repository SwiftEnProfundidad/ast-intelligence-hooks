import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  __resetCoreSkillsLockCacheForTests,
  loadCoreSkillsLock,
} from '../coreSkillsLock';
import { resolveMappedHeuristicRuleIds } from '../skillsDetectorRegistry';
import { loadSkillsSources } from '../skillsSources';

const repoRoot = resolve(__dirname, '..', '..', '..');

const astBundles = [
  {
    skill: 'swift-concurrency',
    bundle: 'ios-concurrency-guidelines',
    sourcePath: 'vendor/skills/swift-concurrency/SKILL.md',
    ruleIds: [
      'skills.ios.no-assume-isolated',
      'skills.ios.no-dispatchgroup',
      'skills.ios.no-dispatchqueue',
      'skills.ios.no-dispatchsemaphore',
      'skills.ios.no-nonisolated-unsafe',
      'skills.ios.no-operation-queue',
      'skills.ios.no-preconcurrency',
      'skills.ios.no-task-detached',
      'skills.ios.no-unchecked-sendable',
    ],
  },
  {
    skill: 'swiftui-expert-skill',
    bundle: 'ios-swiftui-expert-guidelines',
    sourcePath: 'vendor/skills/swiftui-expert-skill/SKILL.md',
    ruleIds: [
      'skills.ios.no-contains-user-filter',
      'skills.ios.no-corner-radius',
      'skills.ios.no-font-weight-bold',
      'skills.ios.no-foreach-indices',
      'skills.ios.no-foreground-color',
      'skills.ios.no-geometryreader',
      'skills.ios.no-legacy-onchange',
      'skills.ios.no-legacy-swiftui-observable-wrapper',
      'skills.ios.no-navigation-view',
      'skills.ios.no-observable-object',
      'skills.ios.no-on-tap-gesture',
      'skills.ios.no-passed-value-state-wrapper',
      'skills.ios.guideline.ios-swiftui-expert.always-mark-state-and-stateobject-as-private-makes-dependencies-clear',
      'skills.ios.no-scrollview-shows-indicators',
      'skills.ios.no-sheet-is-presented',
      'skills.ios.no-string-format',
      'skills.ios.no-tab-item',
      'skills.ios.no-uiscreen-main-bounds',
    ],
  },
  {
    skill: 'swift-testing-expert',
    bundle: 'ios-swift-testing-guidelines',
    sourcePath: 'vendor/skills/swift-testing-expert/SKILL.md',
    ruleIds: [
      'skills.ios.no-legacy-expectation-description',
      'skills.ios.no-mixed-testing-frameworks',
      'skills.ios.no-wait-for-expectations',
      'skills.ios.no-xctassert',
      'skills.ios.no-xctunwrap',
      'skills.ios.prefer-swift-testing',
    ],
  },
  {
    skill: 'core-data-expert',
    bundle: 'ios-core-data-guidelines',
    sourcePath: 'vendor/skills/core-data-expert/SKILL.md',
    ruleIds: [
      'skills.ios.no-core-data-layer-leak',
      'skills.ios.no-nsmanagedobject-async-boundary',
      'skills.ios.no-nsmanagedobject-boundary',
      'skills.ios.no-nsmanagedobject-state-leak',
    ],
  },
] as const;

const snapshotAbsorbedSkill = {
  skill: 'update-swiftui-apis',
  snapshots: [
    'assets/rule-packs/ios-swiftui-modernization-v1.json',
    'assets/rule-packs/ios-swiftui-modernization-v2.json',
  ],
  absorbedRuleIds: [
    'skills.ios.no-corner-radius',
    'skills.ios.no-foreground-color',
    'skills.ios.no-legacy-onchange',
    'skills.ios.no-scrollview-shows-indicators',
    'skills.ios.no-sheet-is-presented',
    'skills.ios.no-tab-item',
  ],
} as const;

const operationalOnlySkills = [
  'xcode-build-benchmark',
  'xcode-build-orchestrator',
  'xcode-project-analyzer',
  'xcode-compilation-analyzer',
  'xcode-build-fixer',
  'spm-build-analysis',
  'rocketsim',
] as const;

const publicAvdleeSkills = [
  ...astBundles.map((bundle) => bundle.skill),
  snapshotAbsorbedSkill.skill,
  ...operationalOnlySkills,
] as const;

const readAstBundleNames = (): string[] => {
  const sources = loadSkillsSources(repoRoot);
  assert.ok(sources);
  return sources.bundles.map((bundle) => bundle.name);
};

const readRequiredSkillsFromAgents = (): Set<string> => {
  const content = readFileSync(resolve(repoRoot, 'AGENTS.md'), 'utf8');
  return new Set(
    [...content.matchAll(/REQUIRED\s+SKILL:\s*([A-Za-z0-9_.:/-]+)/gi)].map((match) =>
      String(match[1]).trim()
    )
  );
};

const skillNameFromVendoredSource = (source: string): string | undefined => {
  return source.match(/vendor\/skills\/([^/]+)\//)?.[1];
};

test('phase10 mantiene la paridad AST de avdlee con bundles y reglas iOS exactas', () => {
  __resetCoreSkillsLockCacheForTests();

  const sources = loadSkillsSources(repoRoot);
  const lock = loadCoreSkillsLock();
  assert.ok(sources);
  assert.ok(lock);

  for (const entry of astBundles) {
    const sourceBundle = sources.bundles.find((bundle) => bundle.name === entry.bundle);
    assert.ok(sourceBundle, `Missing skills.sources bundle for ${entry.skill}`);
    assert.equal(sourceBundle?.sourcePath, entry.sourcePath);

    const lockBundle = lock.bundles.find((bundle) => bundle.name === entry.bundle);
    assert.ok(lockBundle, `Missing skills.lock bundle for ${entry.skill}`);

    const actualRuleIds = new Set((lockBundle?.rules ?? []).map((rule) => rule.id));
    for (const ruleId of entry.ruleIds) {
      assert.equal(
        actualRuleIds.has(ruleId),
        true,
        `Missing canonical AST rule in ${entry.bundle}: ${ruleId}`
      );
    }

    for (const ruleId of entry.ruleIds) {
      const mappedHeuristicRuleIds = resolveMappedHeuristicRuleIds(ruleId);
      assert.equal(
        mappedHeuristicRuleIds.length > 0,
        true,
        `Missing AST detector mapping for ${ruleId}`
      );
    }
  }
});

test('AGENTS declara toda skill vendorizada que entra en el lock AST', () => {
  __resetCoreSkillsLockCacheForTests();

  const lock = loadCoreSkillsLock();
  assert.ok(lock);

  const requiredSkills = readRequiredSkillsFromAgents();
  const lockedVendoredSkills = new Set(
    lock.bundles
      .map((bundle) => skillNameFromVendoredSource(bundle.source))
      .filter((skillName): skillName is string => typeof skillName === 'string')
  );
  const missingFromAgents = [...lockedVendoredSkills]
    .filter((skillName) => !requiredSkills.has(skillName))
    .sort();

  assert.deepEqual(missingFromAgents, []);
});

test('catalogo publico avdlee queda clasificado sin skills huerfanas', () => {
  assert.deepEqual([...publicAvdleeSkills].sort(), [
    'core-data-expert',
    'rocketsim',
    'spm-build-analysis',
    'swift-concurrency',
    'swift-testing-expert',
    'swiftui-expert-skill',
    'update-swiftui-apis',
    'xcode-build-benchmark',
    'xcode-build-fixer',
    'xcode-build-orchestrator',
    'xcode-compilation-analyzer',
    'xcode-project-analyzer',
  ]);
});

test('phase10 absorbe update-swiftui-apis mediante snapshots versionados y no como bundle separado', () => {
  __resetCoreSkillsLockCacheForTests();

  const lock = loadCoreSkillsLock();
  assert.ok(lock);

  const bundleNames = readAstBundleNames();
  assert.equal(bundleNames.includes('update-swiftui-apis'), false);
  assert.equal(lock.bundles.some((bundle) => bundle.name === 'update-swiftui-apis'), false);

  for (const snapshotPath of snapshotAbsorbedSkill.snapshots) {
    assert.equal(
      existsSync(resolve(repoRoot, snapshotPath)),
      true,
      `Missing SwiftUI modernization snapshot: ${snapshotPath}`
    );
  }

  const swiftUiBundle = lock.bundles.find(
    (bundle) => bundle.name === 'ios-swiftui-expert-guidelines'
  );
  assert.ok(swiftUiBundle);
  const swiftUiRuleIds = new Set(swiftUiBundle?.rules.map((rule) => rule.id));
  for (const ruleId of snapshotAbsorbedSkill.absorbedRuleIds) {
    assert.equal(
      swiftUiRuleIds.has(ruleId),
      true,
      `Missing snapshot-absorbed SwiftUI rule: ${ruleId}`
    );
  }
});

test('phase10 mantiene xcode-build y spm-build-analysis como skills operativas fuera del lock AST', () => {
  __resetCoreSkillsLockCacheForTests();

  const lock = loadCoreSkillsLock();
  assert.ok(lock);

  const bundleNames = readAstBundleNames();
  const sourcePaths = loadSkillsSources(repoRoot)?.bundles.map((bundle) => bundle.sourcePath) ?? [];

  for (const skillName of operationalOnlySkills) {
    assert.equal(
      bundleNames.some((bundleName) => bundleName.includes(skillName)),
      false,
      `Operational skill should not exist as AST bundle: ${skillName}`
    );
    assert.equal(
      lock.bundles.some((bundle) => bundle.name.includes(skillName)),
      false,
      `Operational skill should not exist in skills.lock: ${skillName}`
    );
    assert.equal(
      sourcePaths.some((sourcePath) => sourcePath.includes(skillName)),
      false,
      `Operational skill should not be sourced from skills.sources: ${skillName}`
    );
  }
});
