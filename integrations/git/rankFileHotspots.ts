import type { FileTechnicalRiskSignal } from './composeFileTechnicalRiskSignals';

export type FileHotspotRankingWeights = {
  severityCritical: number;
  severityHigh: number;
  severityMedium: number;
  severityLow: number;
  churnCommit: number;
  churnLinesPer10: number;
  churnLinesCap: number;
  ownershipDistinctAuthor: number;
  ruleDiversity: number;
  traceabilityPenalty: number;
};

export type FileHotspotScoreBreakdown = {
  severityScore: number;
  churnScore: number;
  ownershipScore: number;
  ruleDiversityScore: number;
  traceabilityPenaltyScore: number;
};

export type FileHotspotRank = {
  rank: number;
  path: string;
  rawScore: number;
  normalizedScore: number;
  breakdown: FileHotspotScoreBreakdown;
  signal: FileTechnicalRiskSignal;
};

const defaultWeights: FileHotspotRankingWeights = {
  severityCritical: 100,
  severityHigh: 40,
  severityMedium: 15,
  severityLow: 5,
  churnCommit: 4,
  churnLinesPer10: 1,
  churnLinesCap: 200,
  ownershipDistinctAuthor: 3,
  ruleDiversity: 6,
  traceabilityPenalty: 1,
};

const roundToSixDecimals = (value: number): number => {
  return Math.round(value * 1_000_000) / 1_000_000;
};

const toNonNegativeInt = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
};

const clampWeights = (weights?: Partial<FileHotspotRankingWeights>): FileHotspotRankingWeights => {
  if (!weights) {
    return defaultWeights;
  }
  const merged: FileHotspotRankingWeights = {
    ...defaultWeights,
    ...weights,
  };
  return {
    severityCritical: toNonNegativeInt(merged.severityCritical),
    severityHigh: toNonNegativeInt(merged.severityHigh),
    severityMedium: toNonNegativeInt(merged.severityMedium),
    severityLow: toNonNegativeInt(merged.severityLow),
    churnCommit: toNonNegativeInt(merged.churnCommit),
    churnLinesPer10: toNonNegativeInt(merged.churnLinesPer10),
    churnLinesCap: toNonNegativeInt(merged.churnLinesCap),
    ownershipDistinctAuthor: toNonNegativeInt(merged.ownershipDistinctAuthor),
    ruleDiversity: toNonNegativeInt(merged.ruleDiversity),
    traceabilityPenalty: toNonNegativeInt(merged.traceabilityPenalty),
  };
};

const computeBreakdown = (
  signal: FileTechnicalRiskSignal,
  weights: FileHotspotRankingWeights
): FileHotspotScoreBreakdown => {
  const critical = toNonNegativeInt(signal.findingsByEnterpriseSeverity.CRITICAL);
  const high = toNonNegativeInt(signal.findingsByEnterpriseSeverity.HIGH);
  const medium = toNonNegativeInt(signal.findingsByEnterpriseSeverity.MEDIUM);
  const low = toNonNegativeInt(signal.findingsByEnterpriseSeverity.LOW);

  const severityScore =
    critical * weights.severityCritical +
    high * weights.severityHigh +
    medium * weights.severityMedium +
    low * weights.severityLow;

  const commits = toNonNegativeInt(signal.churnCommits);
  const churnLines = toNonNegativeInt(signal.churnTotalLines);
  const churnLineUnits = Math.floor(Math.min(churnLines, weights.churnLinesCap) / 10);
  const churnScore = commits * weights.churnCommit + churnLineUnits * weights.churnLinesPer10;

  const ownershipScore =
    toNonNegativeInt(signal.churnDistinctAuthors) * weights.ownershipDistinctAuthor;
  const ruleDiversityScore = toNonNegativeInt(signal.findingsDistinctRules) * weights.ruleDiversity;
  const traceabilityPenaltyUnits = Math.max(
    0,
    toNonNegativeInt(signal.findingsWithoutLines) - toNonNegativeInt(signal.findingsWithLines)
  );
  const traceabilityPenaltyScore = traceabilityPenaltyUnits * weights.traceabilityPenalty;

  return {
    severityScore,
    churnScore,
    ownershipScore,
    ruleDiversityScore,
    traceabilityPenaltyScore,
  };
};

const toRawScore = (breakdown: FileHotspotScoreBreakdown): number => {
  return (
    breakdown.severityScore +
    breakdown.churnScore +
    breakdown.ownershipScore +
    breakdown.ruleDiversityScore +
    breakdown.traceabilityPenaltyScore
  );
};

export const rankFileHotspots = (params: {
  signals: ReadonlyArray<FileTechnicalRiskSignal>;
  topN?: number;
  weights?: Partial<FileHotspotRankingWeights>;
}): ReadonlyArray<FileHotspotRank> => {
  const topN = params.topN ?? 10;
  if (!Number.isInteger(topN) || topN <= 0) {
    throw new Error('topN must be a positive integer');
  }
  const weights = clampWeights(params.weights);

  const scored = params.signals
    .map((signal) => {
      const breakdown = computeBreakdown(signal, weights);
      return {
        signal,
        breakdown,
        rawScore: toRawScore(breakdown),
      };
    })
    .filter((entry) => entry.rawScore > 0)
    .sort(
      (left, right) =>
        right.rawScore - left.rawScore ||
        right.breakdown.severityScore - left.breakdown.severityScore ||
        right.breakdown.churnScore - left.breakdown.churnScore ||
        left.signal.path.localeCompare(right.signal.path)
    );

  const maxRaw = scored[0]?.rawScore ?? 0;
  return scored.slice(0, topN).map((entry, index) => ({
    rank: index + 1,
    path: entry.signal.path,
    rawScore: entry.rawScore,
    normalizedScore: maxRaw > 0 ? roundToSixDecimals(entry.rawScore / maxRaw) : 0,
    breakdown: entry.breakdown,
    signal: entry.signal,
  }));
};
