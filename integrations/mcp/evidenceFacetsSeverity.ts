import type { AiEvidenceV2_1 } from '../evidence/schema';

export const severityOrder = ['CRITICAL', 'ERROR', 'WARN', 'INFO'] as const;
export const severityRank: Record<string, number> = {
  CRITICAL: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
};

export const toSeverityCounts = (
  findings: AiEvidenceV2_1['snapshot']['findings']
): Record<string, number> => {
  const counts = new Map<string, number>();
  for (const finding of findings) {
    const key = finding.severity.toUpperCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const orderedEntries = [...counts.entries()].sort(([left], [right]) => {
    const leftIndex = severityOrder.indexOf(left as (typeof severityOrder)[number]);
    const rightIndex = severityOrder.indexOf(right as (typeof severityOrder)[number]);
    const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
    if (normalizedLeft !== normalizedRight) {
      return normalizedLeft - normalizedRight;
    }
    return left.localeCompare(right);
  });

  return Object.fromEntries(orderedEntries);
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
