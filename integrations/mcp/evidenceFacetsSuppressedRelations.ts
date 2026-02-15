import type { AiEvidenceV2_1 } from '../evidence/schema';

const toSuppressedReasonsCountLocal = (evidence: AiEvidenceV2_1): number => {
  const reasons = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    reasons.add(entry.reason);
  }
  return reasons.size;
};

export const toSuppressedRuleFilePairsCount = (evidence: AiEvidenceV2_1): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    pairs.add(`${entry.ruleId}:${entry.file}`);
  }
  return pairs.size;
};

export const toSuppressedReasonsWithReplacementCount = (evidence: AiEvidenceV2_1): number => {
  const reasons = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      reasons.add(entry.reason);
    }
  }
  return reasons.size;
};

export const toSuppressedReasonsWithReplacementRatioPct = (evidence: AiEvidenceV2_1): number => {
  const reasonsWithReplacement = toSuppressedReasonsWithReplacementCount(evidence);
  const reasonsCount = toSuppressedReasonsCountLocal(evidence);
  if (reasonsCount === 0) {
    return 0;
  }
  return Math.round((reasonsWithReplacement / reasonsCount) * 100);
};

export const toSuppressedReasonsWithoutReplacementCount = (evidence: AiEvidenceV2_1): number => {
  const reasons = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      reasons.add(entry.reason);
    }
  }
  return reasons.size;
};

export const toSuppressedReasonsWithoutReplacementRatioPct = (evidence: AiEvidenceV2_1): number => {
  const reasonsWithoutReplacement = toSuppressedReasonsWithoutReplacementCount(evidence);
  const reasonsCount = toSuppressedReasonsCountLocal(evidence);
  if (reasonsCount === 0) {
    return 0;
  }
  return Math.round((reasonsWithoutReplacement / reasonsCount) * 100);
};

export const toSuppressedPlatformRulePairsCount = (evidence: AiEvidenceV2_1): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    pairs.add(`${entry.platform}:${entry.ruleId}`);
  }
  return pairs.size;
};

export const toSuppressedPlatformFilePairsCount = (evidence: AiEvidenceV2_1): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    pairs.add(`${entry.platform}:${entry.file}`);
  }
  return pairs.size;
};

export const toSuppressedReplacementRuleFilePairsCount = (evidence: AiEvidenceV2_1): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      pairs.add(`${entry.replacementRuleId}:${entry.file}`);
    }
  }
  return pairs.size;
};

export const toSuppressedReplacementRuleFilePairsRatioPct = (
  evidence: AiEvidenceV2_1,
): number => {
  const replacementRuleFilePairs = toSuppressedReplacementRuleFilePairsCount(evidence);
  const totalRuleFilePairs = toSuppressedRuleFilePairsCount(evidence);
  if (totalRuleFilePairs === 0) {
    return 0;
  }
  return Math.round((replacementRuleFilePairs / totalRuleFilePairs) * 100);
};

export const toSuppressedReplacementRulePlatformPairsCount = (evidence: AiEvidenceV2_1): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      pairs.add(`${entry.replacementRuleId}:${entry.platform}`);
    }
  }
  return pairs.size;
};

export const toSuppressedReplacementRulePlatformPairsRatioPct = (
  evidence: AiEvidenceV2_1,
): number => {
  const replacementRulePlatformPairs = toSuppressedReplacementRulePlatformPairsCount(evidence);
  const totalRulePlatformPairs = toSuppressedPlatformRulePairsCount(evidence);
  if (totalRulePlatformPairs === 0) {
    return 0;
  }
  return Math.round((replacementRulePlatformPairs / totalRulePlatformPairs) * 100);
};

export const toSuppressedReplacementPlatformsCount = (evidence: AiEvidenceV2_1): number => {
  const platforms = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      platforms.add(entry.platform ?? '');
    }
  }
  return platforms.size;
};

export const toSuppressedNonReplacementPlatformsCount = (evidence: AiEvidenceV2_1): number => {
  const platforms = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      platforms.add(entry.platform ?? '');
    }
  }
  return platforms.size;
};

export const toSuppressedWithoutReplacementPlatformsCount = (evidence: AiEvidenceV2_1): number => {
  const platforms = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if ((entry.replacementRuleId === null || entry.replacementRuleId === undefined) && entry.replacedByRuleId.length === 0) {
      platforms.add(entry.platform ?? '');
    }
  }
  return platforms.size;
};

export const toSuppressedNonReplacementReasonFilePairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      pairs.add(`${entry.reason}:${entry.file}`);
    }
  }
  return pairs.size;
};

export const toSuppressedNonReplacementRuleFilePairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      pairs.add(`${entry.ruleId}:${entry.file}`);
    }
  }
  return pairs.size;
};

export const toSuppressedNonReplacementRuleFilePairsRatioPct = (
  evidence: AiEvidenceV2_1,
): number => {
  const nonReplacementRuleFilePairs = toSuppressedNonReplacementRuleFilePairsCount(evidence);
  const totalRuleFilePairs = toSuppressedRuleFilePairsCount(evidence);
  if (totalRuleFilePairs === 0) {
    return 0;
  }
  return Math.round((nonReplacementRuleFilePairs / totalRuleFilePairs) * 100);
};

export const toSuppressedNonReplacementRulePlatformPairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      pairs.add(`${entry.ruleId}:${entry.platform}`);
    }
  }
  return pairs.size;
};

export const toSuppressedNonReplacementRulePlatformPairsRatioPct = (
  evidence: AiEvidenceV2_1,
): number => {
  const nonReplacementRulePlatformPairs = toSuppressedNonReplacementRulePlatformPairsCount(evidence);
  const totalRulePlatformPairs = toSuppressedPlatformRulePairsCount(evidence);
  if (totalRulePlatformPairs === 0) {
    return 0;
  }
  return Math.round((nonReplacementRulePlatformPairs / totalRulePlatformPairs) * 100);
};

export const toSuppressedNonReplacementReasonsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const reasons = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      reasons.add(entry.reason);
    }
  }
  return reasons.size;
};

export const toSuppressedReplacementReasonFilePairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      pairs.add(`${entry.reason}:${entry.file}`);
    }
  }
  return pairs.size;
};

export const toSuppressedReplacementRuleReasonPairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      pairs.add(`${entry.replacementRuleId}:${entry.reason}`);
    }
  }
  return pairs.size;
};

export const toSuppressedReplacementRuleIdsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const ruleIds = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    const replacementRuleId = entry.replacementRuleId ?? entry.replacedByRuleId;
    if (replacementRuleId.length > 0) {
      ruleIds.add(replacementRuleId);
    }
  }
  return ruleIds.size;
};

export const toSuppressedReplacementReasonsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const reasons = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      reasons.add(entry.reason);
    }
  }
  return reasons.size;
};

