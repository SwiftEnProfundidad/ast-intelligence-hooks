export type SaasEnterpriseKpiInput = {
  evaluated_signals: number;
  true_positive_signals: number;
  false_positive_signals: number;
  baseline_risk_score: number;
  current_risk_score: number;
  lead_time_hours: number;
  debt_score: number;
};

export type SaasEnterpriseKpiSnapshot = {
  precision: number;
  drift: number;
  lead_time_hours: number;
  debt_risk: number;
};

export type SaasEnterpriseUnitReport = {
  unit_id: string;
  repositories: number;
  coverage_ratio: number;
  blocked_ratio: number;
  weighted_risk: number;
};

export type SaasEnterpriseDistributedReport = {
  generated_at: string;
  totals: {
    units: number;
    repositories: number;
    coverage_ratio: number;
    blocked_ratio: number;
  };
  units: ReadonlyArray<SaasEnterpriseUnitReport>;
};

export type SaasEnterpriseAdoptionThresholds = {
  min_precision_for_pilot: number;
  max_drift_for_scale: number;
  max_blocked_ratio_for_scale: number;
  min_coverage_for_scale: number;
};

export type SaasEnterpriseAdoptionDecision = {
  stage: 'blocked' | 'pilot' | 'scale';
  reason_codes: ReadonlyArray<string>;
};

const roundToSix = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
};

const toNonNegative = (value: number): number => {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return value;
};

export const buildSaasEnterpriseKpiSnapshot = (
  input: SaasEnterpriseKpiInput
): SaasEnterpriseKpiSnapshot => {
  const evaluated = Math.max(0, Math.trunc(input.evaluated_signals));
  const truePositive = Math.max(0, Math.trunc(input.true_positive_signals));
  const falsePositive = Math.max(0, Math.trunc(input.false_positive_signals));
  const denominator = truePositive + falsePositive;
  const precision = denominator === 0 ? 0 : truePositive / denominator;
  const baselineRisk = toNonNegative(input.baseline_risk_score);
  const currentRisk = toNonNegative(input.current_risk_score);
  const drift =
    baselineRisk === 0
      ? currentRisk === 0
        ? 0
        : 1
      : Math.abs(currentRisk - baselineRisk) / baselineRisk;

  return {
    precision: roundToSix(clamp01(precision)),
    drift: roundToSix(toNonNegative(drift)),
    lead_time_hours: roundToSix(toNonNegative(input.lead_time_hours)),
    debt_risk: roundToSix(clamp01(input.debt_score)),
  };
};

export const buildSaasEnterpriseDistributedReport = (params: {
  units: ReadonlyArray<SaasEnterpriseUnitReport>;
  generatedAt?: string;
}): SaasEnterpriseDistributedReport => {
  const units = [...params.units]
    .map((unit) => ({
      unit_id: unit.unit_id,
      repositories: Math.max(0, Math.trunc(unit.repositories)),
      coverage_ratio: roundToSix(clamp01(unit.coverage_ratio)),
      blocked_ratio: roundToSix(clamp01(unit.blocked_ratio)),
      weighted_risk: roundToSix(toNonNegative(unit.weighted_risk)),
    }))
    .sort((left, right) => left.unit_id.localeCompare(right.unit_id));

  const repositories = units.reduce((total, unit) => total + unit.repositories, 0);
  const coverageRatio =
    units.length === 0
      ? 0
      : roundToSix(units.reduce((total, unit) => total + unit.coverage_ratio, 0) / units.length);
  const blockedRatio =
    units.length === 0
      ? 0
      : roundToSix(units.reduce((total, unit) => total + unit.blocked_ratio, 0) / units.length);

  return {
    generated_at: params.generatedAt ?? new Date().toISOString(),
    totals: {
      units: units.length,
      repositories,
      coverage_ratio: coverageRatio,
      blocked_ratio: blockedRatio,
    },
    units,
  };
};

const defaultThresholds = (): SaasEnterpriseAdoptionThresholds => {
  return {
    min_precision_for_pilot: 0.7,
    max_drift_for_scale: 0.2,
    max_blocked_ratio_for_scale: 0.2,
    min_coverage_for_scale: 0.85,
  };
};

export const evaluateSaasEnterpriseAdoptionDecision = (params: {
  kpi: SaasEnterpriseKpiSnapshot;
  report: Pick<SaasEnterpriseDistributedReport, 'totals'>;
  thresholds?: Partial<SaasEnterpriseAdoptionThresholds>;
}): SaasEnterpriseAdoptionDecision => {
  const thresholds = {
    ...defaultThresholds(),
    ...params.thresholds,
  };
  const reasons: string[] = [];

  if (params.kpi.precision < thresholds.min_precision_for_pilot) {
    reasons.push('precision_below_pilot_threshold');
  }

  if (reasons.length > 0) {
    return {
      stage: 'blocked',
      reason_codes: reasons,
    };
  }

  const canScale =
    params.kpi.drift <= thresholds.max_drift_for_scale &&
    params.report.totals.blocked_ratio <= thresholds.max_blocked_ratio_for_scale &&
    params.report.totals.coverage_ratio >= thresholds.min_coverage_for_scale;

  if (canScale) {
    return {
      stage: 'scale',
      reason_codes: ['scale_thresholds_met'],
    };
  }

  return {
    stage: 'pilot',
    reason_codes: ['pilot_thresholds_met'],
  };
};
