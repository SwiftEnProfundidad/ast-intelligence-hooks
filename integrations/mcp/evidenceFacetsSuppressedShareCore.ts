import type { AiEvidenceV2_1 } from '../evidence/schema';

export const toSuppressedReplacementRuleFilePlatformTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      triples.add(`${entry.replacementRuleId}:${entry.file}:${entry.platform}`);
    }
  }
  return triples.size;
};

export const toSuppressedNonReplacementRuleFilePlatformTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      triples.add(`${entry.ruleId}:${entry.file}:${entry.platform}`);
    }
  }
  return triples.size;
};

export const toSuppressedReasonRuleFileTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    triples.add(`${entry.reason}:${entry.ruleId}:${entry.file}`);
  }
  return triples.size;
};

export const toSuppressedReasonRulePlatformTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    triples.add(`${entry.reason}:${entry.ruleId}:${entry.platform}`);
  }
  return triples.size;
};

export const toSuppressedReasonFilePlatformTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    triples.add(`${entry.reason}:${entry.file}:${entry.platform}`);
  }
  return triples.size;
};

export const toSuppressedReasonPlatformPairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    pairs.add(`${entry.reason}:${entry.platform}`);
  }
  return pairs.size;
};

export const toSuppressedReasonFilePairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    pairs.add(`${entry.reason}:${entry.file}`);
  }
  return pairs.size;
};

export const toSuppressedReplacementReasonPlatformPairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      pairs.add(`${entry.reason}:${entry.platform}`);
    }
  }
  return pairs.size;
};

export const toSuppressedNonReplacementReasonPlatformPairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      pairs.add(`${entry.reason}:${entry.platform}`);
    }
  }
  return pairs.size;
};

export const toSuppressedReplacementReasonRuleFileTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      triples.add(`${entry.reason}:${entry.ruleId}:${entry.file}`);
    }
  }
  return triples.size;
};

export const toSuppressedNonReplacementReasonRuleFileTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      triples.add(`${entry.reason}:${entry.ruleId}:${entry.file}`);
    }
  }
  return triples.size;
};

export const toSuppressedReplacementReasonRulePlatformTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      triples.add(`${entry.reason}:${entry.ruleId}:${entry.platform}`);
    }
  }
  return triples.size;
};

export const toSuppressedNonReplacementReasonRulePlatformTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      triples.add(`${entry.reason}:${entry.ruleId}:${entry.platform}`);
    }
  }
  return triples.size;
};

export const toSuppressedReasonRuleFilePlatformQuadruplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const quadruples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    quadruples.add(`${entry.reason}:${entry.ruleId}:${entry.file}:${entry.platform}`);
  }
  return quadruples.size;
};

export const toSuppressedReplacementReasonRuleFilePlatformQuadruplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const quadruples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      quadruples.add(`${entry.reason}:${entry.ruleId}:${entry.file}:${entry.platform}`);
    }
  }
  return quadruples.size;
};

export const toSuppressedNonReplacementReasonRuleFilePlatformQuadruplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const quadruples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      quadruples.add(`${entry.reason}:${entry.ruleId}:${entry.file}:${entry.platform}`);
    }
  }
  return quadruples.size;
};

export const toSuppressedReasonRuleFilePlatformReplacementSplitCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const splits = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    const replacementBucket = entry.replacementRuleId === null ? 'non_replacement' : 'replacement';
    splits.add(`${entry.reason}:${entry.ruleId}:${entry.file}:${entry.platform}:${replacementBucket}`);
  }
  return splits.size;
};

export const toSuppressedReplacementSplitModesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const modes = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    modes.add(entry.replacementRuleId === null ? 'non_replacement' : 'replacement');
  }
  return modes.size;
};

export const toSuppressedReplacementSplitModeReplacementCount = (
  evidence: AiEvidenceV2_1,
): number => {
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      return 1;
    }
  }
  return 0;
};

export const toSuppressedReplacementSplitModeNonReplacementCount = (
  evidence: AiEvidenceV2_1,
): number => {
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      return 1;
    }
  }
  return 0;
};

export const toSuppressedReasonRuleFilePlatformReplacementDualModeCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const modesByKey = new Map<string, Set<string>>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    const key = `${entry.reason}:${entry.ruleId}:${entry.file}:${entry.platform}`;
    const mode = entry.replacementRuleId === null ? 'non_replacement' : 'replacement';
    const modes = modesByKey.get(key) ?? new Set<string>();
    modes.add(mode);
    modesByKey.set(key, modes);
  }

  let count = 0;
  for (const modes of modesByKey.values()) {
    if (modes.size > 1) {
      count += 1;
    }
  }
  return count;
};

export const toSuppressedReplacementRuleFilePlatformDistinctCount = (
  evidence: AiEvidenceV2_1,
): number => {
  return toSuppressedReplacementRuleFilePlatformTriplesCount(evidence);
};

export const toSuppressedNonReplacementRuleFilePlatformDistinctCount = (
  evidence: AiEvidenceV2_1,
): number => {
  return toSuppressedNonReplacementRuleFilePlatformTriplesCount(evidence);
};

export const toSuppressedRuleFilePlatformDistinctTotalCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    triples.add(`${entry.ruleId}:${entry.file}:${entry.platform}`);
  }
  return triples.size;
};

export const toSuppressedReplacementRuleFilePlatformShareOfTotalPct = (
  evidence: AiEvidenceV2_1,
): number => {
  const replacement = toSuppressedReplacementRuleFilePlatformDistinctCount(evidence);
  const total = toSuppressedRuleFilePlatformDistinctTotalCount(evidence);
  if (total === 0) {
    return 0;
  }
  return Number(((replacement / total) * 100).toFixed(2));
};

export const toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct = (
  evidence: AiEvidenceV2_1,
): number => {
  const nonReplacement =
    toSuppressedNonReplacementRuleFilePlatformDistinctCount(evidence);
  const total = toSuppressedRuleFilePlatformDistinctTotalCount(evidence);
  if (total === 0) {
    return 0;
  }
  return Number(((nonReplacement / total) * 100).toFixed(2));
};

export const toSuppressedReplacementVsNonReplacementShareGapPct = (
  evidence: AiEvidenceV2_1,
): number => {
  const replacement = toSuppressedReplacementRuleFilePlatformShareOfTotalPct(evidence);
  const nonReplacement =
    toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct(evidence);
  return Number(Math.abs(replacement - nonReplacement).toFixed(2));
};

export const toSuppressedReplacementRuleFilePlatformDominancePct = (
  evidence: AiEvidenceV2_1,
): number => {
  const replacement = toSuppressedReplacementRuleFilePlatformShareOfTotalPct(evidence);
  const nonReplacement =
    toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct(evidence);
  return Number(Math.max(replacement, nonReplacement).toFixed(2));
};

export const toSuppressedReplacementMinusNonReplacementShareSignedPct = (
  evidence: AiEvidenceV2_1,
): number => {
  const replacement = toSuppressedReplacementRuleFilePlatformShareOfTotalPct(evidence);
  const nonReplacement =
    toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct(evidence);
  return Number((replacement - nonReplacement).toFixed(2));
};

export const toSuppressedNonReplacementRuleFilePlatformDominancePct = (
  evidence: AiEvidenceV2_1,
): number => {
  const replacement = toSuppressedReplacementRuleFilePlatformShareOfTotalPct(evidence);
  const nonReplacement =
    toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct(evidence);
  return Number(Math.max(nonReplacement - replacement, 0).toFixed(2));
};

export const toSuppressedSharePolarizationIndexPct = (evidence: AiEvidenceV2_1): number => {
  const replacement = toSuppressedReplacementRuleFilePlatformShareOfTotalPct(evidence);
  const nonReplacement =
    toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct(evidence);
  return Number(Math.abs(replacement - nonReplacement).toFixed(2));
};

export const toSuppressedShareBalanceScorePct = (evidence: AiEvidenceV2_1): number => {
  const polarization = toSuppressedSharePolarizationIndexPct(evidence);
  return Number(Math.max(100 - polarization, 0).toFixed(2));
};

export const toSuppressedShareImbalanceIndexPct = (evidence: AiEvidenceV2_1): number => {
  return toSuppressedSharePolarizationIndexPct(evidence);
};

export const toSuppressedSharePolarizationBalanceGapPct = (
  evidence: AiEvidenceV2_1,
): number => {
  const polarization = toSuppressedSharePolarizationIndexPct(evidence);
  const balance = toSuppressedShareBalanceScorePct(evidence);
  return Number(Math.abs(polarization - balance).toFixed(2));
};

export const toSuppressedShareNetPolarityPct = (evidence: AiEvidenceV2_1): number => {
  const replacement = toSuppressedReplacementRuleFilePlatformShareOfTotalPct(evidence);
  const nonReplacement =
    toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct(evidence);
  return Number((replacement - nonReplacement).toFixed(2));
};

export const toSuppressedShareDirection = (
  evidence: AiEvidenceV2_1,
): 'replacement' | 'non_replacement' | 'balanced' => {
  const netPolarity = toSuppressedShareNetPolarityPct(evidence);
  if (netPolarity > 0) {
    return 'replacement';
  }
  if (netPolarity < 0) {
    return 'non_replacement';
  }
  return 'balanced';
};

export const toSuppressedShareDirectionConfidence = (evidence: AiEvidenceV2_1): number => {
  const netPolarity = toSuppressedShareNetPolarityPct(evidence);
  return Number(Math.min(Math.abs(netPolarity), 100).toFixed(2));
};

export const toSuppressedShareDirectionStrengthBucket = (
  evidence: AiEvidenceV2_1,
): 'LOW' | 'MEDIUM' | 'HIGH' => {
  const confidence = toSuppressedShareDirectionConfidence(evidence);
  if (confidence >= 66.67) {
    return 'HIGH';
  }
  if (confidence >= 33.34) {
    return 'MEDIUM';
  }
  return 'LOW';
};

export const toSuppressedShareDirectionStrengthRank = (evidence: AiEvidenceV2_1): 1 | 2 | 3 => {
  const bucket = toSuppressedShareDirectionStrengthBucket(evidence);
  if (bucket === 'HIGH') {
    return 3;
  }
  if (bucket === 'MEDIUM') {
    return 2;
  }
  return 1;
};

export const toSuppressedShareDirectionIsBalanced = (evidence: AiEvidenceV2_1): boolean => {
  return toSuppressedShareDirection(evidence) === 'balanced';
};

export const toSuppressedShareDirectionLabel = (evidence: AiEvidenceV2_1): string => {
  const direction = toSuppressedShareDirection(evidence);
  if (direction === 'replacement') {
    return 'Replacement Dominant';
  }
  if (direction === 'non_replacement') {
    return 'Non-Replacement Dominant';
  }
  return 'Balanced';
};

export const toSuppressedShareDirectionCode = (evidence: AiEvidenceV2_1): 'R' | 'N' | 'B' => {
  const direction = toSuppressedShareDirection(evidence);
  if (direction === 'replacement') {
    return 'R';
  }
  if (direction === 'non_replacement') {
    return 'N';
  }
  return 'B';
};

export const toSuppressedShareDirectionTriageHint = (evidence: AiEvidenceV2_1): string => {
  const direction = toSuppressedShareDirection(evidence);
  const confidence = toSuppressedShareDirectionConfidence(evidence);
  if (direction === 'balanced') {
    return 'Balanced suppression split; inspect replacement and non-replacement paths equally.';
  }
  if (direction === 'replacement') {
    return confidence >= 66.67
      ? 'Replacement-dominant suppression; prioritize replacement rule review first.'
      : 'Replacement-leaning suppression; review replacement paths before non-replacement.';
  }
  return confidence >= 66.67
    ? 'Non-replacement-dominant suppression; prioritize non-replacement suppression review first.'
    : 'Non-replacement-leaning suppression; review non-replacement paths before replacement.';
};

