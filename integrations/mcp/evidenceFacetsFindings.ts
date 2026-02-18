import type { AiEvidenceV2_1 } from '../evidence/schema';
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
