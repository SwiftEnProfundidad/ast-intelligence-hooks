import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateGate } from '../../../core/gate/evaluateGate';
import { evaluateRules } from '../../../core/gate/evaluateRules';
import { astHeuristicsRuleSet } from '../../../core/rules/presets/astHeuristicsRuleSet';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import {
  applyHeuristicSeverityForStage as applyHeuristicSeverityForStageFromPolicies,
  policyForCI,
  policyForPreCommit,
  policyForPrePush,
  resolvePolicyForStage,
} from '../stagePolicies';

type GateTestStage = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';

const strictHeuristicsEnforcement = {
  mode: 'strict' as const,
  source: 'env' as const,
  blocking: true,
};

export const applyHeuristicSeverityForStage = (
  rules: RuleSet,
  stage: GateTestStage
) => {
  return applyHeuristicSeverityForStageFromPolicies(rules, stage, strictHeuristicsEnforcement);
};

export const findSeverity = (ruleId: string, stage: GateTestStage) => {
  const rules = applyHeuristicSeverityForStage(astHeuristicsRuleSet, stage);
  const rule = rules.find((current) => current.id === ruleId);
  assert.ok(rule, `Expected rule ${ruleId} to exist`);
  return rule.severity;
};

export {
  astHeuristicsRuleSet,
  assert,
  evaluateGate,
  evaluateRules,
  join,
  policyForCI,
  policyForPreCommit,
  policyForPrePush,
  resolvePolicyForStage,
  withTempDir,
  writeFileSync,
};
