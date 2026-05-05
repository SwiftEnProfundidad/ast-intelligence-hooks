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

const createSemanticEnforcementRatio = (params: {
  registryTotal: number;
  unsupportedDetector: number;
}): number => {
  if (params.registryTotal === 0) {
    return 1;
  }
  const supported = Math.max(0, params.registryTotal - params.unsupportedDetector);
  return normalizeCoverageRatio(supported / params.registryTotal);
};

export const createEmptySnapshotRulesCoverage = (
  stage: GateStage
): SnapshotRulesCoverage => ({
  stage,
  contract: 'AUTO_RUNTIME_RULES_FOR_STAGE',
  scope_note:
    'No runtime rules were evaluated for this stage. DECLARATIVE registry rules are not runtime detectors.',
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
  auto_runtime_coverage_ratio: 1,
  semantic_enforcement_ratio: 1,
  global_skills_enforcement: {
    status: 'enforced',
    registry_total: 0,
    detector_supported: 0,
    declarative_only: 0,
    unsupported_detector: 0,
  },
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
  const unsupportedDetectorRuleIds = normalizeStringArray(
    value.unsupported_detector_rule_ids ?? []
  );
  const stageApplicableAutoRuleIds = normalizeStringArray(
    value.stage_applicable_auto_rule_ids ?? []
  );
  const declarativeRuleIds = normalizeStringArray(value.declarative_rule_ids ?? []);
  const registryTotals = value.registry_totals;

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
  const unsupportedDetectorCount = Math.max(
    unsupportedDetectorRuleIds.length,
    normalizeCount(value.counts?.unsupported_detector ?? 0)
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

  if (registryTotals) {
    counts.registry_total = normalizeCount(registryTotals.total);
    counts.registry_auto = normalizeCount(registryTotals.auto);
    counts.registry_declarative = normalizeCount(registryTotals.declarative);
  }
  if (stageApplicableAutoRuleIds.length > 0) {
    counts.stage_applicable_auto = stageApplicableAutoRuleIds.length;
  }

  if (unsupportedAutoCount > 0) {
    counts.unsupported_auto = unsupportedAutoCount;
  }
  if (unsupportedDetectorCount > 0) {
    counts.unsupported_detector = unsupportedDetectorCount;
  }

  const ratioFromCounts = createCoverageRatio(counts.active, counts.evaluated);
  const coverageRatio = normalizeCoverageRatio(
    Number.isFinite(value.coverage_ratio) ? value.coverage_ratio : ratioFromCounts
  );
  const registryTotal = normalizeCount(
    value.global_skills_enforcement?.registry_total
      ?? value.registry_totals?.total
      ?? counts.registry_total
      ?? 0
  );
  const declarativeOnly = normalizeCount(
    value.global_skills_enforcement?.declarative_only
      ?? value.registry_totals?.declarative
      ?? counts.registry_declarative
      ?? 0
  );
  const unsupportedDetector = normalizeCount(
    value.global_skills_enforcement?.unsupported_detector
      ?? counts.unsupported_detector
      ?? unsupportedDetectorCount
  );
  const detectorSupported = normalizeCount(
    value.global_skills_enforcement?.detector_supported
      ?? Math.max(0, registryTotal - unsupportedDetector)
  );
  const semanticEnforcementRatio = normalizeCoverageRatio(
    Number.isFinite(value.semantic_enforcement_ratio)
      ? value.semantic_enforcement_ratio ?? 1
      : createSemanticEnforcementRatio({
        registryTotal,
        unsupportedDetector,
      })
  );
  const globalSkillsStatus: NonNullable<
    SnapshotRulesCoverage['global_skills_enforcement']
  >['status'] =
    registryTotal === 0 || unsupportedDetector === 0
      ? 'enforced'
      : detectorSupported > 0
        ? 'partially_enforced'
        : 'unsupported';

  const normalized: SnapshotRulesCoverage = {
    stage,
    contract: value.contract ?? 'AUTO_RUNTIME_RULES_FOR_STAGE',
    scope_note:
      value.scope_note ??
      'rules_coverage reports AUTO runtime rules applicable to this stage, not total DECLARATIVE registry surface.',
    active_rule_ids: activeRuleIds,
    evaluated_rule_ids: evaluatedRuleIds,
    matched_rule_ids: matchedRuleIds,
    unevaluated_rule_ids: unevaluatedRuleIds,
    counts,
    coverage_ratio: coverageRatio,
    auto_runtime_coverage_ratio: normalizeCoverageRatio(
      Number.isFinite(value.auto_runtime_coverage_ratio)
        ? value.auto_runtime_coverage_ratio ?? coverageRatio
        : coverageRatio
    ),
    semantic_enforcement_ratio: semanticEnforcementRatio,
    global_skills_enforcement: {
      status: value.global_skills_enforcement?.status ?? globalSkillsStatus,
      registry_total: registryTotal,
      detector_supported: detectorSupported,
      declarative_only: declarativeOnly,
      unsupported_detector: unsupportedDetector,
    },
  };

  if (registryTotals) {
    normalized.registry_totals = {
      total: normalizeCount(registryTotals.total),
      auto: normalizeCount(registryTotals.auto),
      declarative: normalizeCount(registryTotals.declarative),
    };
  }

  if (stageApplicableAutoRuleIds.length > 0) {
    normalized.stage_applicable_auto_rule_ids = stageApplicableAutoRuleIds;
  }

  if (declarativeRuleIds.length > 0) {
    normalized.declarative_rule_ids = declarativeRuleIds;
  }

  if (typeof value.declarative_excluded_reason === 'string') {
    normalized.declarative_excluded_reason = value.declarative_excluded_reason;
  }

  if (unsupportedAutoRuleIds.length > 0 || unsupportedAutoCount > 0) {
    normalized.unsupported_auto_rule_ids = unsupportedAutoRuleIds;
  }
  if (unsupportedDetectorRuleIds.length > 0 || unsupportedDetectorCount > 0) {
    normalized.unsupported_detector_rule_ids = unsupportedDetectorRuleIds;
  }

  return normalized;
};
