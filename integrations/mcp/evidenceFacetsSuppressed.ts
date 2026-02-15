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


export * from './evidenceFacetsSuppressedShare';
