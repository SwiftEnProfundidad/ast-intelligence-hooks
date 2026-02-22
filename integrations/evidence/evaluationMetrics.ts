import type { SnapshotEvaluationMetrics } from './schema';

const normalizeCount = (input: number): number =>
  Number.isFinite(input) ? Math.max(0, Math.trunc(input)) : 0;

const normalizeStringArray = (values: ReadonlyArray<string>): string[] => {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))
  ).sort();
};

export const createEmptyEvaluationMetrics = (): SnapshotEvaluationMetrics => ({
  facts_total: 0,
  rules_total: 0,
  baseline_rules: 0,
  heuristic_rules: 0,
  skills_rules: 0,
  project_rules: 0,
  matched_rules: 0,
  unmatched_rules: 0,
  evaluated_rule_ids: [],
  matched_rule_ids: [],
  unmatched_rule_ids: [],
});

export const normalizeSnapshotEvaluationMetrics = (
  value?: SnapshotEvaluationMetrics
): SnapshotEvaluationMetrics => {
  if (!value) {
    return createEmptyEvaluationMetrics();
  }

  return {
    facts_total: normalizeCount(value.facts_total),
    rules_total: normalizeCount(value.rules_total),
    baseline_rules: normalizeCount(value.baseline_rules),
    heuristic_rules: normalizeCount(value.heuristic_rules),
    skills_rules: normalizeCount(value.skills_rules),
    project_rules: normalizeCount(value.project_rules),
    matched_rules: normalizeCount(value.matched_rules),
    unmatched_rules: normalizeCount(value.unmatched_rules),
    evaluated_rule_ids: normalizeStringArray(value.evaluated_rule_ids),
    matched_rule_ids: normalizeStringArray(value.matched_rule_ids),
    unmatched_rule_ids: normalizeStringArray(value.unmatched_rule_ids),
  };
};
