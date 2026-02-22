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
  unsupportedAutoRuleIds?: ReadonlyArray<string>;
};

const STAGE_RANK: Record<Exclude<GateStage, 'STAGED'>, number> = {
  PRE_COMMIT: 30,
  PRE_PUSH: 30,
  CI: 30,
};

const PLATFORM_KEYS: ReadonlyArray<keyof DetectedPlatforms> = [
  'ios',
  'android',
  'backend',
  'frontend',
];

const SKILL_TO_HEURISTIC_RULE_IDS: Record<string, ReadonlyArray<string>> = {
  'skills.ios.no-force-unwrap': ['heuristics.ios.force-unwrap.ast'],
  'skills.ios.no-force-try': ['heuristics.ios.force-try.ast'],
  'skills.ios.no-anyview': ['heuristics.ios.anyview.ast'],
  'skills.ios.no-force-cast': ['heuristics.ios.force-cast.ast'],
  'skills.ios.no-callback-style-outside-bridges': ['heuristics.ios.callback-style.ast'],
  'skills.ios.no-dispatchqueue': ['heuristics.ios.dispatchqueue.ast'],
  'skills.ios.no-dispatchgroup': ['heuristics.ios.dispatchgroup.ast'],
  'skills.ios.no-dispatchsemaphore': ['heuristics.ios.dispatchsemaphore.ast'],
  'skills.ios.no-operation-queue': ['heuristics.ios.operation-queue.ast'],
  'skills.ios.no-task-detached': ['heuristics.ios.task-detached.ast'],
  'skills.ios.no-unchecked-sendable': ['heuristics.ios.unchecked-sendable.ast'],
  'skills.ios.no-observable-object': ['heuristics.ios.observable-object.ast'],
  'skills.ios.no-navigation-view': ['heuristics.ios.navigation-view.ast'],
  'skills.ios.no-on-tap-gesture': ['heuristics.ios.on-tap-gesture.ast'],
  'skills.ios.no-string-format': ['heuristics.ios.string-format.ast'],
  'skills.ios.no-uiscreen-main-bounds': ['heuristics.ios.uiscreen-main-bounds.ast'],
  'skills.backend.no-empty-catch': ['heuristics.ts.empty-catch.ast'],
  'skills.backend.no-console-log': ['heuristics.ts.console-log.ast'],
  'skills.backend.avoid-explicit-any': ['heuristics.ts.explicit-any.ast'],
  'skills.backend.no-solid-violations': [
    'heuristics.ts.solid.srp.class-command-query-mix.ast',
    'heuristics.ts.solid.isp.interface-command-query-mix.ast',
    'heuristics.ts.solid.ocp.discriminator-switch.ast',
    'heuristics.ts.solid.lsp.override-not-implemented.ast',
    'heuristics.ts.solid.dip.framework-import.ast',
    'heuristics.ts.solid.dip.concrete-instantiation.ast',
  ],
  'skills.backend.enforce-clean-architecture': [
    'heuristics.ts.solid.dip.framework-import.ast',
    'heuristics.ts.solid.dip.concrete-instantiation.ast',
  ],
  'skills.backend.no-god-classes': ['heuristics.ts.god-class-large-class.ast'],
  'skills.frontend.no-empty-catch': ['heuristics.ts.empty-catch.ast'],
  'skills.frontend.no-console-log': ['heuristics.ts.console-log.ast'],
  'skills.frontend.avoid-explicit-any': ['heuristics.ts.explicit-any.ast'],
  'skills.frontend.no-solid-violations': [
    'heuristics.ts.solid.srp.class-command-query-mix.ast',
    'heuristics.ts.solid.isp.interface-command-query-mix.ast',
    'heuristics.ts.solid.ocp.discriminator-switch.ast',
    'heuristics.ts.solid.lsp.override-not-implemented.ast',
    'heuristics.ts.solid.dip.framework-import.ast',
    'heuristics.ts.solid.dip.concrete-instantiation.ast',
  ],
  'skills.frontend.enforce-clean-architecture': [
    'heuristics.ts.solid.dip.framework-import.ast',
    'heuristics.ts.solid.dip.concrete-instantiation.ast',
  ],
  'skills.frontend.no-god-classes': ['heuristics.ts.god-class-large-class.ast'],
  'skills.android.no-thread-sleep': ['heuristics.android.thread-sleep.ast'],
  'skills.android.no-globalscope': ['heuristics.android.globalscope.ast'],
  'skills.android.no-runblocking': ['heuristics.android.run-blocking.ast'],
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

const normalizeObservedPath = (path: string): string => {
  return path.replace(/\\/g, '/').replace(/^\.\/+/, '');
};

const hasTypeScriptOrJavaScriptExtension = (path: string): boolean => {
  const normalized = path.toLowerCase();
  return (
    normalized.endsWith('.ts') ||
    normalized.endsWith('.js') ||
    normalized.endsWith('.mts') ||
    normalized.endsWith('.cts') ||
    normalized.endsWith('.mjs') ||
    normalized.endsWith('.cjs')
  );
};

const hasReactExtension = (path: string): boolean => {
  const normalized = path.toLowerCase();
  return normalized.endsWith('.tsx') || normalized.endsWith('.jsx');
};

const isObservedPathForPlatform = (params: {
  platform: NonNullable<RuleDefinition['platform']>;
  path: string;
}): boolean => {
  const normalized = normalizeObservedPath(params.path).toLowerCase();

  if (params.platform === 'ios') {
    return normalized.endsWith('.swift');
  }

  if (params.platform === 'android') {
    return normalized.endsWith('.kt') || normalized.endsWith('.kts');
  }

  if (params.platform === 'backend') {
    if (!hasTypeScriptOrJavaScriptExtension(normalized)) {
      return false;
    }
    if (normalized.startsWith('apps/backend/')) {
      return true;
    }
    return /(^|\/)(backend|server|api)(\/|$)/.test(normalized);
  }

  if (params.platform === 'frontend') {
    if (hasReactExtension(normalized)) {
      return true;
    }
    if (!hasTypeScriptOrJavaScriptExtension(normalized)) {
      return false;
    }
    if (
      normalized.startsWith('apps/frontend/') ||
      normalized.startsWith('apps/web/')
    ) {
      return true;
    }
    return /(^|\/)(frontend|web|client)(\/|$)/.test(normalized);
  }

  return false;
};

const toScopedPrefixFromObservedPath = (params: {
  platform: NonNullable<RuleDefinition['platform']>;
  path: string;
}): string | null => {
  const normalized = normalizeObservedPath(params.path);
  const segments = normalized.split('/').filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return null;
  }

  const keywordByPlatform: Record<
    NonNullable<RuleDefinition['platform']>,
    ReadonlyArray<string>
  > = {
    ios: ['ios'],
    backend: ['backend', 'server', 'api'],
    frontend: ['frontend', 'web', 'client'],
    android: ['android'],
    text: [],
    generic: [],
  };

  const keywords = keywordByPlatform[params.platform] ?? [];
  const keywordIndex = segments.findIndex((segment) =>
    keywords.includes(segment.toLowerCase())
  );
  if (keywordIndex >= 0) {
    return `${segments.slice(0, keywordIndex + 1).join('/')}/`;
  }

  return null;
};

const resolveObservedPlatformPrefixes = (params: {
  platform: NonNullable<RuleDefinition['platform']>;
  observedFilePaths?: ReadonlyArray<string>;
}): ReadonlyArray<string> => {
  if (!params.observedFilePaths || params.observedFilePaths.length === 0) {
    return [];
  }

  const prefixes = params.observedFilePaths
    .filter((path) =>
      isObservedPathForPlatform({
        platform: params.platform,
        path,
      })
    )
    .map((path) =>
      toScopedPrefixFromObservedPath({
        platform: params.platform,
        path,
      })
    )
    .filter((prefix): prefix is string => typeof prefix === 'string' && prefix.length > 0);

  return [...new Set(prefixes)].sort();
};

const resolvePlatformHeuristicPrefixes = (params: {
  platform: NonNullable<RuleDefinition['platform']>;
  repoRoot: string;
  observedFilePaths?: ReadonlyArray<string>;
}): ReadonlyArray<string> => {
  const prefixes = PLATFORM_HEURISTIC_FILE_PREFIXES[params.platform] ?? [];
  if (prefixes.length === 0) {
    return [];
  }

  const hasPlatformTree = prefixes.some((prefix) => {
    return existsSync(resolve(params.repoRoot, prefix));
  });

  if (!hasPlatformTree) {
    return resolveObservedPlatformPrefixes({
      platform: params.platform,
      observedFilePaths: params.observedFilePaths,
    });
  }

  return prefixes;
};

const resolveScopeForPlatform = (
  platform: NonNullable<RuleDefinition['platform']>,
  repoRoot: string,
  observedFilePaths?: ReadonlyArray<string>
): RuleDefinition['scope'] | undefined => {
  const prefixes = resolvePlatformHeuristicPrefixes({
    platform,
    repoRoot,
    observedFilePaths,
  });
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
  observedFilePaths?: ReadonlyArray<string>;
}): Condition => {
  const prefixes = resolvePlatformHeuristicPrefixes({
    platform: params.platform,
    repoRoot: params.repoRoot,
    observedFilePaths: params.observedFilePaths,
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
  const shouldPromote = promotedRuleIds.includes(params.rule.id);

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

const resolveMappedHeuristicRuleIds = (ruleId: string): ReadonlyArray<string> => {
  return SKILL_TO_HEURISTIC_RULE_IDS[ruleId] ?? [];
};

const toRuleDefinition = (params: {
  rule: SkillsCompiledRule;
  stage: Exclude<GateStage, 'STAGED'>;
  bundlePolicy?: SkillsBundlePolicy;
  repoRoot: string;
  observedFilePaths?: ReadonlyArray<string>;
}): RuleDefinition | undefined => {
  const mappedHeuristicRuleIds = resolveMappedHeuristicRuleIds(params.rule.id);

  if (!stageApplies(params.stage, params.rule.stage)) {
    return undefined;
  }

  const evaluationMode = resolveRuleEvaluationMode(params.rule);
  const severity = resolveRuleSeverity({
    rule: params.rule,
    bundlePolicy: params.bundlePolicy,
    stage: params.stage,
  });

  if (evaluationMode === 'AUTO') {
    if (mappedHeuristicRuleIds.length === 0) {
      return undefined;
    }
    const heuristicConditions = mappedHeuristicRuleIds.map((ruleId) =>
      buildHeuristicConditionForPlatform({
        ruleId,
        platform: params.rule.platform,
        repoRoot: params.repoRoot,
        observedFilePaths: params.observedFilePaths,
      })
    );
    const when: Condition =
      heuristicConditions.length === 1
        ? heuristicConditions[0]
        : {
            kind: 'Any',
            conditions: heuristicConditions,
          };
    return {
      id: params.rule.id,
      description: params.rule.description,
      severity,
      platform: params.rule.platform,
      locked: params.rule.locked ?? true,
      confidence: params.rule.confidence,
      when,
      then: {
        kind: 'Finding',
        message: params.rule.description,
        code: toCode(params.rule.id),
      },
      scope: resolveScopeForPlatform(
        params.rule.platform,
        params.repoRoot,
        params.observedFilePaths
      ),
    };
  }

  // Declarative rules remain explicit, but AUTO rules without mapping are
  // excluded from runtime rule conversion and reported separately.
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
    scope: resolveScopeForPlatform(
      params.rule.platform,
      params.repoRoot,
      params.observedFilePaths
    ),
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
    unsupportedAutoRuleIds: [],
  };
};

export const loadSkillsRuleSetForStage = (
  stage: Exclude<GateStage, 'STAGED'>,
  repoRoot: string = process.cwd(),
  detectedPlatforms?: DetectedPlatforms,
  observedFilePaths?: ReadonlyArray<string>
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
  const unsupportedAutoRuleIds = new Set<string>();

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

      const mappedRuleIds = resolveMappedHeuristicRuleIds(compiledRule.id);
      const evaluationMode = resolveRuleEvaluationMode(compiledRule);
      if (evaluationMode === 'AUTO' && mappedRuleIds.length === 0) {
        unsupportedAutoRuleIds.add(compiledRule.id);
        continue;
      }

      const convertedRule = toRuleDefinition({
        rule: compiledRule,
        stage,
        bundlePolicy,
        repoRoot,
        observedFilePaths,
      });

      if (!convertedRule) {
        continue;
      }

      rulesById.set(convertedRule.id, convertedRule);
      for (const mappedId of mappedRuleIds) {
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
    unsupportedAutoRuleIds: [...unsupportedAutoRuleIds].sort(),
  };
};
