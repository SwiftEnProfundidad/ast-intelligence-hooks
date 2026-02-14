import type { GateStage } from '../../core/gate/GateStage';
import type { RuleDefinition } from '../../core/rules/RuleDefinition';
import type { RuleSet } from '../../core/rules/RuleSet';
import { isSeverityAtLeast, type Severity } from '../../core/rules/Severity';
import {
  loadSkillsLock,
  type SkillsCompiledRule,
  type SkillsLockBundle,
} from './skillsLock';
import { loadSkillsPolicy, type SkillsBundlePolicy } from './skillsPolicy';

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

const SKILL_TO_HEURISTIC_RULE_ID: Record<string, string> = {
  'skills.ios.no-force-unwrap': 'heuristics.ios.force-unwrap.ast',
  'skills.ios.no-force-try': 'heuristics.ios.force-try.ast',
  'skills.ios.no-anyview': 'heuristics.ios.anyview.ast',
  'skills.ios.no-callback-style-outside-bridges': 'heuristics.ios.callback-style.ast',
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

const toRuleDefinition = (params: {
  rule: SkillsCompiledRule;
  stage: Exclude<GateStage, 'STAGED'>;
  bundlePolicy?: SkillsBundlePolicy;
}): RuleDefinition | undefined => {
  const mappedHeuristicRuleId = SKILL_TO_HEURISTIC_RULE_ID[params.rule.id];
  if (!mappedHeuristicRuleId) {
    return undefined;
  }

  if (!stageApplies(params.stage, params.rule.stage)) {
    return undefined;
  }

  return {
    id: params.rule.id,
    description: params.rule.description,
    severity: resolveRuleSeverity({
      rule: params.rule,
      bundlePolicy: params.bundlePolicy,
      stage: params.stage,
    }),
    platform: params.rule.platform,
    locked: params.rule.locked ?? true,
    confidence: params.rule.confidence,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: mappedHeuristicRuleId,
      },
    },
    then: {
      kind: 'Finding',
      message: params.rule.description,
      code: toCode(params.rule.id),
    },
  };
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
  repoRoot: string = process.cwd()
): SkillsRuleSetLoadResult => {
  const lock = loadSkillsLock(repoRoot);
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

  const rules: RuleDefinition[] = [];
  const mappedHeuristicRuleIds = new Set<string>();

  for (const bundle of activeBundles) {
    const bundlePolicy = policy?.bundles[bundle.name];

    for (const compiledRule of bundle.rules) {
      const convertedRule = toRuleDefinition({
        rule: compiledRule,
        stage,
        bundlePolicy,
      });

      if (!convertedRule) {
        continue;
      }

      rules.push(convertedRule);
      const mappedId = SKILL_TO_HEURISTIC_RULE_ID[compiledRule.id];
      if (mappedId) {
        mappedHeuristicRuleIds.add(mappedId);
      }
    }
  }

  return {
    rules,
    activeBundles,
    mappedHeuristicRuleIds,
    requiresHeuristicFacts: rules.length > 0,
  };
};
