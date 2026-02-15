import type { AiEvidenceV2_1 } from '../evidence/schema';
export const toSuppressedReplacementRulesCount = (evidence: AiEvidenceV2_1): number => {
  const replacements = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    replacements.add(entry.replacedByRuleId);
  }
  return replacements.size;
};

export const toSuppressedRulesCount = (evidence: AiEvidenceV2_1): number => {
  const rules = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    rules.add(entry.ruleId);
  }
  return rules.size;
};

export const toSuppressedReplacementRulesRatioPct = (evidence: AiEvidenceV2_1): number => {
  const replacementRules = toSuppressedReplacementRulesCount(evidence);
  const suppressedRules = toSuppressedRulesCount(evidence);
  if (suppressedRules === 0) {
    return 0;
  }
  return Math.round((replacementRules / suppressedRules) * 100);
};

export const toSuppressedNonReplacementRulesCount = (evidence: AiEvidenceV2_1): number => {
  const rules = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      rules.add(entry.ruleId);
    }
  }
  return rules.size;
};

export const toSuppressedNonReplacementRulesRatioPct = (evidence: AiEvidenceV2_1): number => {
  const nonReplacementRules = toSuppressedNonReplacementRulesCount(evidence);
  const suppressedRules = toSuppressedRulesCount(evidence);
  if (suppressedRules === 0) {
    return 0;
  }
  return Math.round((nonReplacementRules / suppressedRules) * 100);
};

export const inferPlatformFromFilePath = (
  filePath: string
): 'ios' | 'backend' | 'frontend' | 'android' | 'generic' => {
  const file = filePath.toLowerCase();
  if (file.startsWith('apps/ios/') || file.endsWith('.swift')) {
    return 'ios';
  }
  if (file.startsWith('apps/backend/')) {
    return 'backend';
  }
  if (file.startsWith('apps/frontend/')) {
    return 'frontend';
  }
  if (file.startsWith('apps/android/') || file.endsWith('.kt') || file.endsWith('.kts')) {
    return 'android';
  }
  return 'generic';
};

export const toSuppressedPlatformsCount = (evidence: AiEvidenceV2_1): number => {
  const platforms = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    platforms.add(inferPlatformFromFilePath(entry.file));
  }
  return platforms.size;
};

export const toSuppressedFilesCount = (evidence: AiEvidenceV2_1): number => {
  const files = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    files.add(entry.file);
  }
  return files.size;
};

export const toSuppressedReasonsCount = (evidence: AiEvidenceV2_1): number => {
  const reasons = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    reasons.add(entry.reason);
  }
  return reasons.size;
};

export const toSuppressedWithReplacementCount = (evidence: AiEvidenceV2_1): number => {
  let count = 0;
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      count += 1;
    }
  }
  return count;
};

export const toSuppressedWithReplacementFilesCount = (evidence: AiEvidenceV2_1): number => {
  const files = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null || entry.replacedByRuleId.length > 0) {
      files.add(entry.file);
    }
  }
  return files.size;
};

export const toSuppressedWithReplacementPlatformsCount = (evidence: AiEvidenceV2_1): number => {
  const platforms = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null || entry.replacedByRuleId.length > 0) {
      platforms.add(entry.platform ?? '');
    }
  }
  return platforms.size;
};

export const toSuppressedWithoutReplacementFilesCount = (evidence: AiEvidenceV2_1): number => {
  const files = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null && entry.replacedByRuleId.length === 0) {
      files.add(entry.file);
    }
  }
  return files.size;
};

export const toSuppressedNonReplacementFilesCount = (evidence: AiEvidenceV2_1): number => {
  const files = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      files.add(entry.file);
    }
  }
  return files.size;
};

export const toSuppressedWithReplacementFilesRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalFiles = toSuppressedFilesCount(evidence);
  if (totalFiles === 0) {
    return 0;
  }
  return Math.round((toSuppressedWithReplacementFilesCount(evidence) / totalFiles) * 100);
};

export const toSuppressedReplacementFilesRatioPct = (evidence: AiEvidenceV2_1): number =>
  toSuppressedWithReplacementFilesRatioPct(evidence);

export const toSuppressedWithoutReplacementFilesRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalFiles = toSuppressedFilesCount(evidence);
  if (totalFiles === 0) {
    return 0;
  }
  return Math.round((toSuppressedWithoutReplacementFilesCount(evidence) / totalFiles) * 100);
};

export const toSuppressedNonReplacementFilesRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalFiles = toSuppressedFilesCount(evidence);
  if (totalFiles === 0) {
    return 0;
  }
  return Math.round((toSuppressedNonReplacementFilesCount(evidence) / totalFiles) * 100);
};

export const toSuppressedWithReplacementPlatformsRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalPlatforms = toSuppressedPlatformsCount(evidence);
  if (totalPlatforms === 0) {
    return 0;
  }
  return Math.round((toSuppressedWithReplacementPlatformsCount(evidence) / totalPlatforms) * 100);
};

export const toSuppressedWithoutReplacementPlatformsRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalPlatforms = toSuppressedPlatformsCount(evidence);
  if (totalPlatforms === 0) {
    return 0;
  }
  return Math.round((toSuppressedWithoutReplacementPlatformsCount(evidence) / totalPlatforms) * 100);
};

export const toSuppressedNonReplacementPlatformsRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalPlatforms = toSuppressedPlatformsCount(evidence);
  if (totalPlatforms === 0) {
    return 0;
  }
  return Math.round((toSuppressedNonReplacementPlatformsCount(evidence) / totalPlatforms) * 100);
};

export const toSuppressedReplacementPlatformsRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalPlatforms = toSuppressedPlatformsCount(evidence);
  if (totalPlatforms === 0) {
    return 0;
  }
  return Math.round((toSuppressedReplacementPlatformsCount(evidence) / totalPlatforms) * 100);
};

export const toSuppressedWithReplacementRatioPct = (evidence: AiEvidenceV2_1): number => {
  const total = evidence.consolidation?.suppressed?.length ?? 0;
  if (total === 0) {
    return 0;
  }
  return Math.round((toSuppressedWithReplacementCount(evidence) / total) * 100);
};

export const toSuppressedFindingCoverageRatioPct = (evidence: AiEvidenceV2_1): number => {
  const suppressedFindingsCount = evidence.consolidation?.suppressed?.length ?? 0;
  const findingUniverseSize =
    suppressedFindingsCount + evidence.snapshot.findings.length;
  if (findingUniverseSize === 0) {
    return 0;
  }
  return Math.round((suppressedFindingsCount / findingUniverseSize) * 100);
};

export const toSuppressedWithoutReplacementCount = (evidence: AiEvidenceV2_1): number => {
  let count = 0;
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      count += 1;
    }
  }
  return count;
};

export const toSuppressedNonReplacementRatioPct = (evidence: AiEvidenceV2_1): number => {
  const total = evidence.consolidation?.suppressed?.length ?? 0;
  if (total === 0) {
    return 0;
  }
  return Math.round((toSuppressedWithoutReplacementCount(evidence) / total) * 100);
};

export const toSuppressedWithoutReplacementRatioPct = (evidence: AiEvidenceV2_1): number => {
  const total = evidence.consolidation?.suppressed?.length ?? 0;
  if (total === 0) {
    return 0;
  }
  return Math.round((toSuppressedWithoutReplacementCount(evidence) / total) * 100);
};

export const toSuppressedReasonsCoverageRatioPct = (evidence: AiEvidenceV2_1): number => {
  const suppressedFindingsCount = evidence.consolidation?.suppressed?.length ?? 0;
  const reasonsCount = toSuppressedReasonsCount(evidence);
  if (suppressedFindingsCount === 0) {
    return 0;
  }
  return Math.round((reasonsCount / suppressedFindingsCount) * 100);
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
  const reasonsCount = toSuppressedReasonsCount(evidence);
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
  const reasonsCount = toSuppressedReasonsCount(evidence);
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

export const toSuppressedShareDirectionPriorityScore = (evidence: AiEvidenceV2_1): number => {
  const confidence = toSuppressedShareDirectionConfidence(evidence);
  const direction = toSuppressedShareDirection(evidence);
  if (direction === 'balanced') {
    return 0;
  }
  return Number(confidence.toFixed(2));
};

export const toSuppressedShareTriageSummary = (evidence: AiEvidenceV2_1): string => {
  const label = toSuppressedShareDirectionLabel(evidence);
  const bucket = toSuppressedShareDirectionStrengthBucket(evidence);
  const priorityScore = toSuppressedShareDirectionPriorityScore(evidence);
  const triageHint = toSuppressedShareDirectionTriageHint(evidence);
  return `${label} | ${bucket} | priority ${priorityScore} | ${triageHint}`;
};

export const toSuppressedShareTriageDigest = (evidence: AiEvidenceV2_1): string => {
  const directionCode = toSuppressedShareDirectionCode(evidence);
  const bucket = toSuppressedShareDirectionStrengthBucket(evidence);
  const priorityScore = toSuppressedShareDirectionPriorityScore(evidence);
  return `${directionCode}:${bucket}:${priorityScore}`;
};

export const toSuppressedShareTriageAction = (evidence: AiEvidenceV2_1): string => {
  const direction = toSuppressedShareDirection(evidence);
  const confidence = toSuppressedShareDirectionConfidence(evidence);
  if (direction === 'balanced') {
    return 'review_both_paths';
  }
  if (direction === 'replacement') {
    return confidence >= 66.67
      ? 'review_replacement_first'
      : 'review_replacement_then_non_replacement';
  }
  return confidence >= 66.67
    ? 'review_non_replacement_first'
    : 'review_non_replacement_then_replacement';
};

export const toSuppressedShareTriagePlaybook = (evidence: AiEvidenceV2_1): string => {
  const action = toSuppressedShareTriageAction(evidence);
  if (action === 'review_replacement_first') {
    return 'review_replacement_rules>validate_replacements>check_non_replacement_fallbacks';
  }
  if (action === 'review_replacement_then_non_replacement') {
    return 'review_replacement_rules>review_non_replacement_paths>validate_balance_delta';
  }
  if (action === 'review_non_replacement_first') {
    return 'review_non_replacement_paths>validate_suppression_justification>check_replacement_rules';
  }
  if (action === 'review_non_replacement_then_replacement') {
    return 'review_non_replacement_paths>review_replacement_rules>validate_balance_delta';
  }
  return 'review_replacement_rules>review_non_replacement_paths>validate_balance_delta';
};

export const toSuppressedShareTriagePriorityBand = (
  evidence: AiEvidenceV2_1,
): 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' => {
  const score = toSuppressedShareDirectionPriorityScore(evidence);
  if (score <= 0) {
    return 'NONE';
  }
  if (score >= 80) {
    return 'HIGH';
  }
  if (score >= 50) {
    return 'MEDIUM';
  }
  return 'LOW';
};

export const toSuppressedShareTriageOrder = (evidence: AiEvidenceV2_1): string => {
  const action = toSuppressedShareTriageAction(evidence);
  if (action === 'review_replacement_first') {
    return 'replacement>non_replacement';
  }
  if (action === 'review_replacement_then_non_replacement') {
    return 'replacement>non_replacement';
  }
  if (action === 'review_non_replacement_first') {
    return 'non_replacement>replacement';
  }
  if (action === 'review_non_replacement_then_replacement') {
    return 'non_replacement>replacement';
  }
  return 'replacement=non_replacement';
};

export const toSuppressedShareTriagePrimarySide = (
  evidence: AiEvidenceV2_1,
): 'replacement' | 'non_replacement' | 'balanced' => {
  return toSuppressedShareDirection(evidence);
};

export const toSuppressedShareTriageSecondarySide = (
  evidence: AiEvidenceV2_1,
): 'replacement' | 'non_replacement' | 'balanced' => {
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  if (primarySide === 'replacement') {
    return 'non_replacement';
  }
  if (primarySide === 'non_replacement') {
    return 'replacement';
  }
  return 'balanced';
};

export const toSuppressedShareTriageSidePair = (evidence: AiEvidenceV2_1): string => {
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  const secondarySide = toSuppressedShareTriageSecondarySide(evidence);
  if (primarySide === 'balanced' && secondarySide === 'balanced') {
    return 'balanced=balanced';
  }
  return `${primarySide}>${secondarySide}`;
};

export const toSuppressedShareTriageSideAlignment = (
  evidence: AiEvidenceV2_1,
): 'balanced' | 'same' | 'opposed' => {
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  const secondarySide = toSuppressedShareTriageSecondarySide(evidence);
  if (primarySide === 'balanced' && secondarySide === 'balanced') {
    return 'balanced';
  }
  if (primarySide === secondarySide) {
    return 'same';
  }
  return 'opposed';
};

export const toSuppressedShareTriageFocusTarget = (evidence: AiEvidenceV2_1): string => {
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  if (primarySide === 'replacement') {
    return 'replacement_rules';
  }
  if (primarySide === 'non_replacement') {
    return 'non_replacement_paths';
  }
  return 'both_paths';
};

export const toSuppressedShareTriageFocusOrder = (evidence: AiEvidenceV2_1): string => {
  const focusTarget = toSuppressedShareTriageFocusTarget(evidence);
  if (focusTarget === 'replacement_rules') {
    return 'replacement_rules>non_replacement_paths';
  }
  if (focusTarget === 'non_replacement_paths') {
    return 'non_replacement_paths>replacement_rules';
  }
  return 'replacement_rules=non_replacement_paths';
};

export const toSuppressedShareTriageFocusMode = (
  evidence: AiEvidenceV2_1,
): 'single' | 'dual' => {
  const focusTarget = toSuppressedShareTriageFocusTarget(evidence);
  if (focusTarget === 'both_paths') {
    return 'dual';
  }
  return 'single';
};

export const toSuppressedShareTriageIntensity = (evidence: AiEvidenceV2_1): number => {
  const priorityScore = toSuppressedShareDirectionPriorityScore(evidence);
  if (priorityScore <= 0) {
    return 0;
  }
  const focusMode = toSuppressedShareTriageFocusMode(evidence);
  const multiplier = focusMode === 'dual' ? 0.5 : 1;
  return Number((priorityScore * multiplier).toFixed(2));
};

export const toSuppressedShareTriageLane = (evidence: AiEvidenceV2_1): string => {
  const priorityBand = toSuppressedShareTriagePriorityBand(evidence);
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  if (priorityBand === 'NONE') {
    return 'watch_lane';
  }
  if (primarySide === 'balanced') {
    return `balanced_${priorityBand.toLowerCase()}_lane`;
  }
  if (primarySide === 'replacement') {
    return priorityBand === 'HIGH' ? 'replacement_fast_lane' : 'replacement_standard_lane';
  }
  return priorityBand === 'HIGH'
    ? 'non_replacement_fast_lane'
    : 'non_replacement_standard_lane';
};

export const toSuppressedShareTriageRoute = (evidence: AiEvidenceV2_1): string => {
  const lane = toSuppressedShareTriageLane(evidence);
  if (lane === 'watch_lane') {
    return 'watch_lane:observe';
  }
  const focusOrder = toSuppressedShareTriageFocusOrder(evidence);
  return `${lane}:${focusOrder}`;
};

export const toSuppressedShareTriageChannel = (
  evidence: AiEvidenceV2_1,
): 'watch' | 'balanced' | 'fast' | 'standard' => {
  const lane = toSuppressedShareTriageLane(evidence);
  if (lane === 'watch_lane') {
    return 'watch';
  }
  if (lane.startsWith('balanced_')) {
    return 'balanced';
  }
  if (lane.endsWith('_fast_lane')) {
    return 'fast';
  }
  return 'standard';
};

export const toSuppressedShareTriageTrack = (evidence: AiEvidenceV2_1): string => {
  const channel = toSuppressedShareTriageChannel(evidence);
  if (channel === 'watch') {
    return 'monitor_track';
  }
  if (channel === 'balanced') {
    return 'balanced_track';
  }
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  if (primarySide === 'replacement') {
    return channel === 'fast' ? 'replacement_fast_track' : 'replacement_standard_track';
  }
  if (primarySide === 'non_replacement') {
    return channel === 'fast'
      ? 'non_replacement_fast_track'
      : 'non_replacement_standard_track';
  }
  return 'balanced_track';
};

export const toSuppressedShareTriageStream = (evidence: AiEvidenceV2_1): string => {
  const track = toSuppressedShareTriageTrack(evidence);
  if (track === 'monitor_track') {
    return 'observation_stream';
  }
  if (track === 'balanced_track') {
    return 'balanced_stream';
  }
  if (track === 'replacement_fast_track') {
    return 'replacement_priority_stream';
  }
  if (track === 'non_replacement_fast_track') {
    return 'non_replacement_priority_stream';
  }
  if (track === 'replacement_standard_track') {
    return 'replacement_standard_stream';
  }
  return 'non_replacement_standard_stream';
};

export const toSuppressedShareTriageStreamClass = (
  evidence: AiEvidenceV2_1,
): 'observation' | 'balanced' | 'priority' | 'standard' => {
  const stream = toSuppressedShareTriageStream(evidence);
  if (stream === 'observation_stream') {
    return 'observation';
  }
  if (stream === 'balanced_stream') {
    return 'balanced';
  }
  if (stream.endsWith('_priority_stream')) {
    return 'priority';
  }
  return 'standard';
};

export const toSuppressedShareTriageStreamRank = (
  evidence: AiEvidenceV2_1,
): 0 | 1 | 2 | 3 => {
  const streamClass = toSuppressedShareTriageStreamClass(evidence);
  if (streamClass === 'observation') {
    return 0;
  }
  if (streamClass === 'balanced') {
    return 1;
  }
  if (streamClass === 'standard') {
    return 2;
  }
  return 3;
};

export const toSuppressedShareTriageStreamScore = (evidence: AiEvidenceV2_1): number => {
  const rank = toSuppressedShareTriageStreamRank(evidence);
  return Number(((rank / 3) * 100).toFixed(2));
};

export const toSuppressedShareTriageStreamScoreBand = (
  evidence: AiEvidenceV2_1,
): 'LOW' | 'MEDIUM' | 'HIGH' => {
  const score = toSuppressedShareTriageStreamScore(evidence);
  if (score >= 80) {
    return 'HIGH';
  }
  if (score >= 40) {
    return 'MEDIUM';
  }
  return 'LOW';
};

export const toSuppressedShareTriageStreamSignal = (evidence: AiEvidenceV2_1): string => {
  const streamClass = toSuppressedShareTriageStreamClass(evidence);
  const scoreBand = toSuppressedShareTriageStreamScoreBand(evidence);
  return `${streamClass}:${scoreBand}`;
};

export const toSuppressedShareTriageStreamSignalCode = (evidence: AiEvidenceV2_1): string => {
  const streamClass = toSuppressedShareTriageStreamClass(evidence);
  const scoreBand = toSuppressedShareTriageStreamScoreBand(evidence);
  const classCode = (() => {
    if (streamClass === 'observation') {
      return 'OBS';
    }
    if (streamClass === 'balanced') {
      return 'BAL';
    }
    if (streamClass === 'priority') {
      return 'PRI';
    }
    return 'STD';
  })();
  const bandCode = scoreBand === 'HIGH' ? 'H' : scoreBand === 'MEDIUM' ? 'M' : 'L';
  return `${classCode}-${bandCode}`;
};

export const toSuppressedShareTriageStreamSignalFamily = (evidence: AiEvidenceV2_1): string => {
  const streamClass = toSuppressedShareTriageStreamClass(evidence);
  if (streamClass === 'observation') {
    return 'observation_family';
  }
  if (streamClass === 'balanced') {
    return 'balanced_family';
  }
  if (streamClass === 'priority') {
    return 'priority_family';
  }
  return 'standard_family';
};

export const toSuppressedShareTriageStreamSignalFamilyCode = (evidence: AiEvidenceV2_1): string => {
  const family = toSuppressedShareTriageStreamSignalFamily(evidence);
  if (family === 'observation_family') {
    return 'OBS_FAM';
  }
  if (family === 'balanced_family') {
    return 'BAL_FAM';
  }
  if (family === 'priority_family') {
    return 'PRI_FAM';
  }
  return 'STD_FAM';
};

export const toSuppressedShareTriageStreamSignalFamilyRank = (
  evidence: AiEvidenceV2_1,
): 0 | 1 | 2 | 3 => {
  const family = toSuppressedShareTriageStreamSignalFamily(evidence);
  if (family === 'observation_family') {
    return 0;
  }
  if (family === 'balanced_family') {
    return 1;
  }
  if (family === 'standard_family') {
    return 2;
  }
  return 3;
};

export const toSuppressedShareTriageStreamSignalFamilyWeight = (
  evidence: AiEvidenceV2_1,
): number => {
  const rank = toSuppressedShareTriageStreamSignalFamilyRank(evidence);
  return Number(((rank / 3) * 100).toFixed(2));
};

export const toSuppressedShareTriageStreamSignalFamilyBucket = (
  evidence: AiEvidenceV2_1,
): 'LOW' | 'MEDIUM' | 'HIGH' => {
  const weight = toSuppressedShareTriageStreamSignalFamilyWeight(evidence);
  if (weight >= 80) {
    return 'HIGH';
  }
  if (weight >= 40) {
    return 'MEDIUM';
  }
  return 'LOW';
};

export const toSuppressedShareTriageStreamSignalFamilyDigest = (evidence: AiEvidenceV2_1): string => {
  const familyCode = toSuppressedShareTriageStreamSignalFamilyCode(evidence);
  const bucket = toSuppressedShareTriageStreamSignalFamilyBucket(evidence);
  return `${familyCode}:${bucket}`;
};

export const toSuppressedShareTriageStreamSignalFamilyDigestCode = (
  evidence: AiEvidenceV2_1,
): string => {
  const familyCode = toSuppressedShareTriageStreamSignalFamilyCode(evidence);
  const bucket = toSuppressedShareTriageStreamSignalFamilyBucket(evidence);
  return `${familyCode}_${bucket}`;
};

export const toSuppressedShareTriageStreamSignalFamilyTrace = (evidence: AiEvidenceV2_1): string => {
  const digestCode = toSuppressedShareTriageStreamSignalFamilyDigestCode(evidence);
  const route = toSuppressedShareTriageRoute(evidence);
  return `${digestCode}@${route}`;
};

export const toSuppressedShareTriageStreamSignalFamilyTraceCode = (
  evidence: AiEvidenceV2_1,
): string => {
  const trace = toSuppressedShareTriageStreamSignalFamilyTrace(evidence);
  return trace
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

export const toSuppressedShareTriageStreamSignalFamilyTraceHash = (
  evidence: AiEvidenceV2_1,
): string => {
  const trace = toSuppressedShareTriageStreamSignalFamilyTrace(evidence);
  let hash = 0x811c9dc5;
  for (const character of trace) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).toUpperCase().padStart(8, '0');
};

export const toSuppressedShareTriageStreamSignalFamilyTraceHashCode = (
  evidence: AiEvidenceV2_1,
): string => {
  const traceHash = toSuppressedShareTriageStreamSignalFamilyTraceHash(evidence);
  return `TRACE_HASH_${traceHash}`;
};

export const toSuppressedShareTriageStreamSignalFamilyTraceHashBucket = (
  evidence: AiEvidenceV2_1,
): 'LOW' | 'MEDIUM' | 'HIGH' => {
  const traceHash = toSuppressedShareTriageStreamSignalFamilyTraceHash(evidence);
  const leadByte = Number.parseInt(traceHash.slice(0, 2), 16);
  if (leadByte >= 170) {
    return 'HIGH';
  }
  if (leadByte >= 85) {
    return 'MEDIUM';
  }
  return 'LOW';
};

export const toSuppressedShareTriageStreamSignalFamilyTraceHashRank = (
  evidence: AiEvidenceV2_1,
): 0 | 1 | 2 => {
  const bucket = toSuppressedShareTriageStreamSignalFamilyTraceHashBucket(evidence);
  if (bucket === 'HIGH') {
    return 2;
  }
  if (bucket === 'MEDIUM') {
    return 1;
  }
  return 0;
};

export const toSuppressedShareTriageStreamSignalFamilyTraceHashWeight = (
  evidence: AiEvidenceV2_1,
): number => {
  const rank = toSuppressedShareTriageStreamSignalFamilyTraceHashRank(evidence);
  return Number(((rank / 2) * 100).toFixed(2));
};
