import type { AiEvidenceV2_1 } from '../evidence/schema';
import {
  toSuppressedNonReplacementPlatformsCount,
  toSuppressedReplacementPlatformsCount,
  toSuppressedWithoutReplacementPlatformsCount,
} from './evidenceFacetsSuppressedRelations';

const toRoundedRatioPct = (numerator: number, denominator: number): number => {
  if (denominator === 0) {
    return 0;
  }
  return Math.round((numerator / denominator) * 100);
};

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
  return toRoundedRatioPct(replacementRules, suppressedRules);
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
  return toRoundedRatioPct(nonReplacementRules, suppressedRules);
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
  return toRoundedRatioPct(toSuppressedWithReplacementFilesCount(evidence), totalFiles);
};

export const toSuppressedReplacementFilesRatioPct = (evidence: AiEvidenceV2_1): number =>
  toSuppressedWithReplacementFilesRatioPct(evidence);

export const toSuppressedWithoutReplacementFilesRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalFiles = toSuppressedFilesCount(evidence);
  return toRoundedRatioPct(toSuppressedWithoutReplacementFilesCount(evidence), totalFiles);
};

export const toSuppressedNonReplacementFilesRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalFiles = toSuppressedFilesCount(evidence);
  return toRoundedRatioPct(toSuppressedNonReplacementFilesCount(evidence), totalFiles);
};

export const toSuppressedWithReplacementPlatformsRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalPlatforms = toSuppressedPlatformsCount(evidence);
  return toRoundedRatioPct(toSuppressedWithReplacementPlatformsCount(evidence), totalPlatforms);
};

export const toSuppressedWithoutReplacementPlatformsRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalPlatforms = toSuppressedPlatformsCount(evidence);
  return toRoundedRatioPct(toSuppressedWithoutReplacementPlatformsCount(evidence), totalPlatforms);
};

export const toSuppressedNonReplacementPlatformsRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalPlatforms = toSuppressedPlatformsCount(evidence);
  return toRoundedRatioPct(toSuppressedNonReplacementPlatformsCount(evidence), totalPlatforms);
};

export const toSuppressedReplacementPlatformsRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalPlatforms = toSuppressedPlatformsCount(evidence);
  return toRoundedRatioPct(toSuppressedReplacementPlatformsCount(evidence), totalPlatforms);
};

export const toSuppressedWithReplacementRatioPct = (evidence: AiEvidenceV2_1): number => {
  const total = evidence.consolidation?.suppressed?.length ?? 0;
  return toRoundedRatioPct(toSuppressedWithReplacementCount(evidence), total);
};

export const toSuppressedFindingCoverageRatioPct = (evidence: AiEvidenceV2_1): number => {
  const suppressedFindingsCount = evidence.consolidation?.suppressed?.length ?? 0;
  const findingUniverseSize =
    suppressedFindingsCount + evidence.snapshot.findings.length;
  return toRoundedRatioPct(suppressedFindingsCount, findingUniverseSize);
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
  return toSuppressedWithoutReplacementRatioPct(evidence);
};

export const toSuppressedWithoutReplacementRatioPct = (evidence: AiEvidenceV2_1): number => {
  const total = evidence.consolidation?.suppressed?.length ?? 0;
  return toRoundedRatioPct(toSuppressedWithoutReplacementCount(evidence), total);
};

export const toSuppressedReasonsCoverageRatioPct = (evidence: AiEvidenceV2_1): number => {
  const suppressedFindingsCount = evidence.consolidation?.suppressed?.length ?? 0;
  const reasonsCount = toSuppressedReasonsCount(evidence);
  return toRoundedRatioPct(reasonsCount, suppressedFindingsCount);
};


