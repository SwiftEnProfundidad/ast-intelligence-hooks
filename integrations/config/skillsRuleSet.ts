import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { GateStage } from '../../core/gate/GateStage';
import type { Condition } from '../../core/rules/Condition';
import type { RuleDefinition } from '../../core/rules/RuleDefinition';
import type { RuleSet } from '../../core/rules/RuleSet';
import { isSeverityAtLeast, type Severity } from '../../core/rules/Severity';
import {
  type SkillsRuleEvaluationMode,
  type SkillsCompiledRule,
  type SkillsLockBundle,
} from './skillsLock';
import { loadSkillsPolicy, type SkillsBundlePolicy } from './skillsPolicy';
import type { DetectedPlatforms } from '../platform/detectPlatforms';
import { loadEffectiveSkillsLock } from './skillsEffectiveLock';

export type SkillsRuleSetLoadResult = {
  rules: RuleSet;
  activeBundles: ReadonlyArray<SkillsLockBundle>;
  mappedHeuristicRuleIds: ReadonlySet<string>;
  requiresHeuristicFacts: boolean;
};

const STAGE_RANK: Record<Exclude<GateStage, 'STAGED'>, number> = {
  PRE_COMMIT: 10,
  PRE_PUSH: 20,
  CI: 30,
};

const PLATFORM_KEYS: ReadonlyArray<keyof DetectedPlatforms> = [
  'ios',
  'android',
  'backend',
  'frontend',
];

const SKILL_TO_HEURISTIC_RULE_ID: Record<string, string> = {
  'skills.ios.no-force-unwrap': 'heuristics.ios.force-unwrap.ast',
  'skills.ios.no-force-try': 'heuristics.ios.force-try.ast',
  'skills.ios.no-anyview': 'heuristics.ios.anyview.ast',
  'skills.ios.no-force-cast': 'heuristics.ios.force-cast.ast',
  'skills.ios.no-callback-style-outside-bridges': 'heuristics.ios.callback-style.ast',
  'skills.ios.no-dispatchqueue': 'heuristics.ios.dispatchqueue.ast',
  'skills.ios.no-dispatchgroup': 'heuristics.ios.dispatchgroup.ast',
  'skills.ios.no-dispatchsemaphore': 'heuristics.ios.dispatchsemaphore.ast',
  'skills.ios.no-operation-queue': 'heuristics.ios.operation-queue.ast',
  'skills.ios.no-task-detached': 'heuristics.ios.task-detached.ast',
  'skills.ios.no-unchecked-sendable': 'heuristics.ios.unchecked-sendable.ast',
  'skills.ios.no-observable-object': 'heuristics.ios.observable-object.ast',
  'skills.ios.no-navigation-view': 'heuristics.ios.navigation-view.ast',
  'skills.ios.no-on-tap-gesture': 'heuristics.ios.on-tap-gesture.ast',
  'skills.ios.no-string-format': 'heuristics.ios.string-format.ast',
  'skills.ios.no-uiscreen-main-bounds': 'heuristics.ios.uiscreen-main-bounds.ast',
  'skills.backend.no-empty-catch': 'heuristics.ts.empty-catch.ast',
  'skills.backend.no-console-log': 'heuristics.ts.console-log.ast',
  'skills.backend.avoid-explicit-any': 'heuristics.ts.explicit-any.ast',
  'skills.frontend.no-empty-catch': 'heuristics.ts.empty-catch.ast',
  'skills.frontend.no-console-log': 'heuristics.ts.console-log.ast',
  'skills.frontend.avoid-explicit-any': 'heuristics.ts.explicit-any.ast',
  'skills.android.no-thread-sleep': 'heuristics.android.thread-sleep.ast',
  'skills.android.no-globalscope': 'heuristics.android.globalscope.ast',
  'skills.android.no-runblocking': 'heuristics.android.run-blocking.ast',
};

const PLATFORM_HEURISTIC_FILE_PREFIXES: Record<
  NonNullable<RuleDefinition['platform']>,
  ReadonlyArray<string>
> = {
  ios: ['apps/ios/', 'ios/'],
  backend: ['apps/backend/'],
  frontend: ['apps/frontend/', 'apps/web/'],
  android: ['apps/android/'],
  text: [],
  generic: [],
};

const resolvePlatformHeuristicPrefixes = (params: {
  platform: NonNullable<RuleDefinition['platform']>;
  repoRoot: string;
}): ReadonlyArray<string> => {
  const prefixes = PLATFORM_HEURISTIC_FILE_PREFIXES[params.platform] ?? [];
  if (prefixes.length === 0) {
    return [];
  }

  const hasPlatformTree = prefixes.some((prefix) => {
    return existsSync(resolve(params.repoRoot, prefix));
  });

  if (!hasPlatformTree) {
    return [];
  }

  return prefixes;
};

const resolveScopeForPlatform = (
  platform: NonNullable<RuleDefinition['platform']>,
  repoRoot: string
): RuleDefinition['scope'] | undefined => {
  const prefixes = resolvePlatformHeuristicPrefixes({ platform, repoRoot });
  if (prefixes.length === 0) {
    return undefined;
  }
  return {
    include: [...prefixes],
  };
};

const toCode = (ruleId: string): string => {
  return `SKILLS_${ruleId.replace(/[^A-Za-z0-9]+/g, '_').toUpperCase()}`;
};

const stageApplies = (
  currentStage: Exclude<GateStage, 'STAGED'>,
  ruleStage?: Exclude<GateStage, 'STAGED'>
): boolean => {
  if (!ruleStage) {
    return true;
  }
  return STAGE_RANK[currentStage] >= STAGE_RANK[ruleStage];
};

const buildHeuristicConditionForPlatform = (params: {
  ruleId: string;
  platform: NonNullable<RuleDefinition['platform']>;
  repoRoot: string;
}): Condition => {
  const prefixes = resolvePlatformHeuristicPrefixes({
    platform: params.platform,
    repoRoot: params.repoRoot,
  });
  if (prefixes.length === 0) {
    return {
      kind: 'Heuristic',
      where: {
        ruleId: params.ruleId,
      },
    };
  }

  if (prefixes.length === 1) {
    return {
      kind: 'Heuristic',
      where: {
        ruleId: params.ruleId,
        filePathPrefix: prefixes[0],
      },
    };
  }

  return {
    kind: 'Any',
    conditions: prefixes.map((prefix) => ({
      kind: 'Heuristic' as const,
      where: {
        ruleId: params.ruleId,
        filePathPrefix: prefix,
      },
    })),
  };
};

const resolveBundleEnabled = (params: {
  bundleName: string;
  defaultBundleEnabled: boolean;
  bundlePolicy?: SkillsBundlePolicy;
}): boolean => {
  if (!params.bundlePolicy) {
    return params.defaultBundleEnabled;
  }
  return params.bundlePolicy.enabled;
};

const resolveRuleSeverity = (params: {
  rule: SkillsCompiledRule;
  bundlePolicy?: SkillsBundlePolicy;
  stage: Exclude<GateStage, 'STAGED'>;
}): Severity => {
  const promotedRuleIds = params.bundlePolicy?.promoteToErrorRuleIds ?? [];
  const shouldPromote =
    (params.stage === 'PRE_PUSH' || params.stage === 'CI') &&
    promotedRuleIds.includes(params.rule.id);

  if (!shouldPromote) {
    return params.rule.severity;
  }

  return isSeverityAtLeast(params.rule.severity, 'ERROR')
    ? params.rule.severity
    : 'ERROR';
};

const resolveRuleEvaluationMode = (
  rule: SkillsCompiledRule
): SkillsRuleEvaluationMode => {
  return rule.evaluationMode ?? 'AUTO';
};

const toRuleDefinition = (params: {
  rule: SkillsCompiledRule;
  stage: Exclude<GateStage, 'STAGED'>;
  bundlePolicy?: SkillsBundlePolicy;
  repoRoot: string;
}): RuleDefinition | undefined => {
  const mappedHeuristicRuleId = SKILL_TO_HEURISTIC_RULE_ID[params.rule.id];

  if (!stageApplies(params.stage, params.rule.stage)) {
    return undefined;
  }

  const evaluationMode = resolveRuleEvaluationMode(params.rule);
  const severity = resolveRuleSeverity({
    rule: params.rule,
    bundlePolicy: params.bundlePolicy,
    stage: params.stage,
  });

  if (mappedHeuristicRuleId && evaluationMode === 'AUTO') {
    return {
      id: params.rule.id,
      description: params.rule.description,
      severity,
      platform: params.rule.platform,
      locked: params.rule.locked ?? true,
      confidence: params.rule.confidence,
      when: buildHeuristicConditionForPlatform({
        ruleId: mappedHeuristicRuleId,
        platform: params.rule.platform,
        repoRoot: params.repoRoot,
      }),
      then: {
        kind: 'Finding',
        message: params.rule.description,
        code: toCode(params.rule.id),
      },
      scope: resolveScopeForPlatform(params.rule.platform, params.repoRoot),
    };
  }

  // Declarative fallback: keep rule active/evaluable without emitting findings
  // until a deterministic automatic detector exists for this rule.
  return {
    id: params.rule.id,
    description: params.rule.description,
    severity,
    platform: params.rule.platform,
    locked: params.rule.locked ?? true,
    confidence: params.rule.confidence,
    when: {
      kind: 'FileContent',
      regex: ['a^'],
    },
    then: {
      kind: 'Finding',
      message: `[Declarative] ${params.rule.description}`,
      code: `${toCode(params.rule.id)}_DECLARATIVE`,
    },
    scope: resolveScopeForPlatform(params.rule.platform, params.repoRoot),
  };
};

const hasDetectedPlatforms = (detectedPlatforms?: DetectedPlatforms): boolean => {
  if (!detectedPlatforms) {
    return false;
  }
  return PLATFORM_KEYS.some((platform) => detectedPlatforms[platform]?.detected === true);
};

const isRulePlatformActive = (params: {
  rule: SkillsCompiledRule;
  detectedPlatforms?: DetectedPlatforms;
}): boolean => {
  if (!params.detectedPlatforms) {
    return true;
  }
  if (params.rule.platform === 'generic' || params.rule.platform === 'text') {
    return true;
  }
  if (!hasDetectedPlatforms(params.detectedPlatforms)) {
    return false;
  }
  if (params.rule.platform === 'ios') {
    return params.detectedPlatforms?.ios?.detected === true;
  }
  if (params.rule.platform === 'android') {
    return params.detectedPlatforms?.android?.detected === true;
  }
  if (params.rule.platform === 'backend') {
    return params.detectedPlatforms?.backend?.detected === true;
  }
  if (params.rule.platform === 'frontend') {
    return params.detectedPlatforms?.frontend?.detected === true;
  }
  return true;
};

const emptyResult = (): SkillsRuleSetLoadResult => {
  return {
    rules: [],
    activeBundles: [],
    mappedHeuristicRuleIds: new Set<string>(),
    requiresHeuristicFacts: false,
  };
};

export const loadSkillsRuleSetForStage = (
  stage: Exclude<GateStage, 'STAGED'>,
  repoRoot: string = process.cwd(),
  detectedPlatforms?: DetectedPlatforms
): SkillsRuleSetLoadResult => {
  const lock = loadEffectiveSkillsLock(repoRoot);
  if (!lock || lock.bundles.length === 0) {
    return emptyResult();
  }

  const policy = loadSkillsPolicy(repoRoot);
  const defaultBundleEnabled = policy?.defaultBundleEnabled ?? true;

  const activeBundles = lock.bundles.filter((bundle) => {
    return resolveBundleEnabled({
      bundleName: bundle.name,
      defaultBundleEnabled,
      bundlePolicy: policy?.bundles[bundle.name],
    });
  });

  if (activeBundles.length === 0) {
    return emptyResult();
  }

  const rulesById = new Map<string, RuleDefinition>();
  const mappedHeuristicRuleIds = new Set<string>();

  for (const bundle of activeBundles) {
    const bundlePolicy = policy?.bundles[bundle.name];

    for (const compiledRule of bundle.rules) {
      if (
        !isRulePlatformActive({
          rule: compiledRule,
          detectedPlatforms,
        })
      ) {
        continue;
      }

      const convertedRule = toRuleDefinition({
        rule: compiledRule,
        stage,
        bundlePolicy,
        repoRoot,
      });

      if (!convertedRule) {
        continue;
      }

      rulesById.set(convertedRule.id, convertedRule);
      const mappedId = SKILL_TO_HEURISTIC_RULE_ID[compiledRule.id];
      if (mappedId) {
        mappedHeuristicRuleIds.add(mappedId);
      }
    }
  }

  const rules = [...rulesById.values()].sort((left, right) =>
    left.id.localeCompare(right.id)
  );

  return {
    rules,
    activeBundles,
    mappedHeuristicRuleIds,
    requiresHeuristicFacts: mappedHeuristicRuleIds.size > 0,
  };
};
