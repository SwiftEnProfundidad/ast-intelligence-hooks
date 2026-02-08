import { createHash } from 'node:crypto';
import type { GatePolicy } from '../../core/gate/GatePolicy';
import type { GateStage } from '../../core/gate/GateStage';
import type { RuleSet } from '../../core/rules/RuleSet';
import {
  createSkillsPolicyDeterministicHash,
  loadSkillsPolicy,
} from '../config/skillsPolicy';
import type { SkillsStage } from '../config/skillsLock';

const promotedHeuristicRuleIds = new Set<string>([
  'heuristics.ts.console-log.ast',
  'heuristics.ts.explicit-any.ast',
  'heuristics.ios.force-unwrap.ast',
  'heuristics.ios.anyview.ast',
  'heuristics.ios.force-try.ast',
  'heuristics.ios.force-cast.ast',
  'heuristics.ios.callback-style.ast',
  'heuristics.android.thread-sleep.ast',
  'heuristics.android.globalscope.ast',
  'heuristics.android.run-blocking.ast',
]);

const shouldPromoteHeuristicRule = (ruleId: string, stage: GateStage): boolean => {
  if (stage !== 'PRE_PUSH' && stage !== 'CI') {
    return false;
  }
  return promotedHeuristicRuleIds.has(ruleId);
};

export type ResolvedStagePolicy = {
  policy: GatePolicy;
  trace: {
    source: 'default' | 'skills.policy';
    bundle: string;
    hash: string;
  };
};

const defaultPolicyByStage: Record<SkillsStage, GatePolicy> = {
  PRE_COMMIT: {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'CRITICAL',
    warnOnOrAbove: 'ERROR',
  },
  PRE_PUSH: {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  },
  CI: {
    stage: 'CI',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  },
};

const createPolicyTraceHash = (params: {
  stage: SkillsStage;
  source: 'default' | 'skills.policy';
  blockOnOrAbove: GatePolicy['blockOnOrAbove'];
  warnOnOrAbove: GatePolicy['warnOnOrAbove'];
  sourcePolicyHash?: string;
}): string => {
  return createHash('sha256')
    .update(
      JSON.stringify({
        stage: params.stage,
        source: params.source,
        blockOnOrAbove: params.blockOnOrAbove,
        warnOnOrAbove: params.warnOnOrAbove,
        sourcePolicyHash: params.sourcePolicyHash ?? null,
      })
    )
    .digest('hex');
};

export const resolvePolicyForStage = (
  stage: SkillsStage,
  repoRoot: string = process.cwd()
): ResolvedStagePolicy => {
  const defaults = defaultPolicyByStage[stage];
  const loadedPolicy = loadSkillsPolicy(repoRoot);
  const stageOverride = loadedPolicy?.stages[stage];

  if (!stageOverride) {
    return {
      policy: defaults,
      trace: {
        source: 'default',
        bundle: `gate-policy.default.${stage}`,
        hash: createPolicyTraceHash({
          stage,
          source: 'default',
          blockOnOrAbove: defaults.blockOnOrAbove,
          warnOnOrAbove: defaults.warnOnOrAbove,
        }),
      },
    };
  }

  const resolvedPolicy: GatePolicy = {
    stage: defaults.stage,
    blockOnOrAbove: stageOverride.blockOnOrAbove,
    warnOnOrAbove: stageOverride.warnOnOrAbove,
  };

  return {
    policy: resolvedPolicy,
    trace: {
      source: 'skills.policy',
      bundle: `gate-policy.skills.policy.${stage}`,
      hash: createPolicyTraceHash({
        stage,
        source: 'skills.policy',
        blockOnOrAbove: resolvedPolicy.blockOnOrAbove,
        warnOnOrAbove: resolvedPolicy.warnOnOrAbove,
        sourcePolicyHash: createSkillsPolicyDeterministicHash(loadedPolicy),
      }),
    },
  };
};

export const applyHeuristicSeverityForStage = (
  rules: RuleSet,
  stage: GateStage
): RuleSet => {
  return rules.map((rule) => {
    if (!shouldPromoteHeuristicRule(rule.id, stage)) {
      return rule;
    }
    return {
      ...rule,
      severity: 'ERROR',
    };
  });
};

export const policyForPreCommit = (): GatePolicy => {
  return defaultPolicyByStage.PRE_COMMIT;
};

export const policyForPrePush = (): GatePolicy => {
  return defaultPolicyByStage.PRE_PUSH;
};

export const policyForCI = (): GatePolicy => {
  return defaultPolicyByStage.CI;
};
