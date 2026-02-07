import type { GatePolicy } from '../../core/gate/GatePolicy';
import type { GateStage } from '../../core/gate/GateStage';
import type { RuleSet } from '../../core/rules/RuleSet';

const promotedHeuristicRuleIds = new Set<string>([
  'heuristics.ts.console-log.ast',
  'heuristics.ts.explicit-any.ast',
  'heuristics.ios.force-unwrap.ast',
  'heuristics.ios.anyview.ast',
  'heuristics.ios.force-try.ast',
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
  return {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'CRITICAL',
    warnOnOrAbove: 'ERROR',
  };
};

export const policyForPrePush = (): GatePolicy => {
  return {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
};

export const policyForCI = (): GatePolicy => {
  return {
    stage: 'CI',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };
};
