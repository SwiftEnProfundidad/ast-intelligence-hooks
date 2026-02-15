import type { AiEvidenceV2_1 } from '../evidence/schema';
import { severityRank } from './evidenceFacetsBase';
import { inferPlatformFromFilePath } from './evidenceFacetsSuppressed';
export const toFindingsFilesCount = (findings: AiEvidenceV2_1['snapshot']['findings']): number => {
  const files = new Set<string>();
  for (const finding of findings) {
    files.add(finding.file);
  }
  return files.size;
};

export const toFindingsRulesCount = (findings: AiEvidenceV2_1['snapshot']['findings']): number => {
  const rules = new Set<string>();
  for (const finding of findings) {
    rules.add(finding.ruleId);
  }
  return rules.size;
};

export const toFindingsWithLinesCount = (findings: AiEvidenceV2_1['snapshot']['findings']): number => {
  let count = 0;
  for (const finding of findings) {
    if (finding.lines && Array.isArray(finding.lines) && finding.lines.length > 0) {
      count += 1;
    }
  }
  return count;
};

export const toPlatformConfidenceCounts = (
  platforms: AiEvidenceV2_1['platforms']
): Record<string, number> => {
  const counts = new Map<string, number>();
  for (const entry of Object.values(platforms)) {
    counts.set(entry.confidence, (counts.get(entry.confidence) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
};

export const toFindingsByPlatform = (
  findings: AiEvidenceV2_1['snapshot']['findings']
): Record<string, number> => {
  const counts = new Map<string, number>();
  for (const finding of findings) {
    const platform = inferPlatformFromFilePath(finding.file);
    counts.set(platform, (counts.get(platform) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
};

export const toLedgerByPlatform = (ledger: AiEvidenceV2_1['ledger']): Record<string, number> => {
  const counts = new Map<string, number>();
  for (const entry of ledger) {
    const platform = inferPlatformFromFilePath(entry.file);
    counts.set(platform, (counts.get(platform) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
};

export const toLedgerFilesCount = (ledger: AiEvidenceV2_1['ledger']): number => {
  const files = new Set<string>();
  for (const entry of ledger) {
    files.add(entry.file);
  }
  return files.size;
};

export const toLedgerRulesCount = (ledger: AiEvidenceV2_1['ledger']): number => {
  const rules = new Set<string>();
  for (const entry of ledger) {
    rules.add(entry.ruleId);
  }
  return rules.size;
};

export const toHighestSeverity = (
  findings: AiEvidenceV2_1['snapshot']['findings']
): string | null => {
  let highest: string | null = null;
  for (const finding of findings) {
    const severity = finding.severity.toUpperCase();
    if (highest === null) {
      highest = severity;
      continue;
    }
    const currentRank = severityRank[severity] ?? Number.MAX_SAFE_INTEGER;
    const highestRank = severityRank[highest] ?? Number.MAX_SAFE_INTEGER;
    if (currentRank < highestRank) {
      highest = severity;
    }
  }
  return highest;
};

export const toBlockingFindingsCount = (findings: AiEvidenceV2_1['snapshot']['findings']): number => {
  let count = 0;
  for (const finding of findings) {
    const rank = severityRank[finding.severity.toUpperCase()] ?? Number.MAX_SAFE_INTEGER;
    if (rank <= severityRank.ERROR) {
      count += 1;
    }
  }
  return count;
};
