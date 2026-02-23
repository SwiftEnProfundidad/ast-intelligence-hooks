import type { GateStage } from '../../core/gate/GateStage';
import type { SnapshotRulesCoverage } from './schema';

const normalizeCount = (input: number): number =>
  Number.isFinite(input) ? Math.max(0, Math.trunc(input)) : 0;

const normalizeCoverageRatio = (input: number): number => {
  if (!Number.isFinite(input)) {
    return 1;
  }
  if (input <= 0) {
    return 0;
  }
  if (input >= 1) {
    return 1;
  }
  return Number(input.toFixed(6));
};

const normalizeStringArray = (values: ReadonlyArray<string>): string[] => {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))
  ).sort();
};

const createCoverageRatio = (active: number, evaluated: number): number => {
  if (active === 0) {
    return 1;
  }
  return normalizeCoverageRatio(evaluated / active);
};

export const createEmptySnapshotRulesCoverage = (
  stage: GateStage
): SnapshotRulesCoverage => ({
  stage,
  active_rule_ids: [],
  evaluated_rule_ids: [],
  matched_rule_ids: [],
  unevaluated_rule_ids: [],
  counts: {
    active: 0,
    evaluated: 0,
    matched: 0,
    unevaluated: 0,
  },
  coverage_ratio: 1,
});

export const normalizeSnapshotRulesCoverage = (
  stage: GateStage,
  value?: SnapshotRulesCoverage
): SnapshotRulesCoverage => {
  if (!value) {
    return createEmptySnapshotRulesCoverage(stage);
  }

  const activeRuleIds = normalizeStringArray(value.active_rule_ids);
  const evaluatedRuleIds = normalizeStringArray(value.evaluated_rule_ids);
  const matchedRuleIds = normalizeStringArray(value.matched_rule_ids);
  const unevaluatedRuleIds = normalizeStringArray(value.unevaluated_rule_ids);
  const unsupportedAutoRuleIds = normalizeStringArray(value.unsupported_auto_rule_ids ?? []);

  const derivedCounts = {
    active: activeRuleIds.length,
    evaluated: evaluatedRuleIds.length,
    matched: matchedRuleIds.length,
    unevaluated: unevaluatedRuleIds.length,
  };

  const unsupportedAutoCount = Math.max(
    unsupportedAutoRuleIds.length,
    normalizeCount(value.counts?.unsupported_auto ?? 0)
  );

  const counts: SnapshotRulesCoverage['counts'] = {
    active: Math.max(derivedCounts.active, normalizeCount(value.counts?.active ?? 0)),
    evaluated: Math.max(derivedCounts.evaluated, normalizeCount(value.counts?.evaluated ?? 0)),
    matched: Math.max(derivedCounts.matched, normalizeCount(value.counts?.matched ?? 0)),
    unevaluated: Math.max(
      derivedCounts.unevaluated,
      normalizeCount(value.counts?.unevaluated ?? 0)
    ),
  };

  if (unsupportedAutoCount > 0) {
    counts.unsupported_auto = unsupportedAutoCount;
  }

  const ratioFromCounts = createCoverageRatio(counts.active, counts.evaluated);
  const coverageRatio = normalizeCoverageRatio(
    Number.isFinite(value.coverage_ratio) ? value.coverage_ratio : ratioFromCounts
  );

  const normalized: SnapshotRulesCoverage = {
    stage,
    active_rule_ids: activeRuleIds,
    evaluated_rule_ids: evaluatedRuleIds,
    matched_rule_ids: matchedRuleIds,
    unevaluated_rule_ids: unevaluatedRuleIds,
    counts,
    coverage_ratio: coverageRatio,
  };

  if (unsupportedAutoRuleIds.length > 0 || unsupportedAutoCount > 0) {
    normalized.unsupported_auto_rule_ids = unsupportedAutoRuleIds;
  }

  return normalized;
};
