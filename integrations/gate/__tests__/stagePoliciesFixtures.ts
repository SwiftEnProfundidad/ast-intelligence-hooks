import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateGate } from '../../../core/gate/evaluateGate';
import { evaluateRules } from '../../../core/gate/evaluateRules';
import { astHeuristicsRuleSet } from '../../../core/rules/presets/astHeuristicsRuleSet';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import {
  applyHeuristicSeverityForStage,
  policyForCI,
  policyForPreCommit,
  policyForPrePush,
  resolvePolicyForStage,
} from '../stagePolicies';

type GateTestStage = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';

export const findSeverity = (ruleId: string, stage: GateTestStage) => {
  const rules = applyHeuristicSeverityForStage(astHeuristicsRuleSet, stage);
  const rule = rules.find((current) => current.id === ruleId);
  assert.ok(rule, `Expected rule ${ruleId} to exist`);
  return rule.severity;
};

export {
  astHeuristicsRuleSet,
  assert,
  applyHeuristicSeverityForStage,
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
