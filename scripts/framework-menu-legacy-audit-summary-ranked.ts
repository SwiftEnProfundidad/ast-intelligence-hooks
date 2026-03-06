import type { LegacySeverity } from './framework-menu-legacy-audit-types';
import type { NormalizedFinding } from './framework-menu-legacy-audit-summary-types';
import { mapLegacySeverity } from './framework-menu-legacy-audit-summary-normalize';

export const countViolations = (
  findings: ReadonlyArray<NormalizedFinding>
): ReadonlyArray<{ ruleId: string; count: number }> => {
  const buckets = new Map<string, number>();
  for (const finding of findings) {
    buckets.set(finding.ruleId, (buckets.get(finding.ruleId) ?? 0) + 1);
  }
  return [...buckets.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([ruleId, count]) => ({ ruleId, count }));
};

export const countFiles = (
  findings: ReadonlyArray<NormalizedFinding>
): ReadonlyArray<{ file: string; count: number; line: number }> => {
  const buckets = new Map<string, { count: number; line: number }>();
  for (const finding of findings) {
    const current = buckets.get(finding.file);
    if (!current) {
      buckets.set(finding.file, { count: 1, line: finding.line });
      continue;
    }
    buckets.set(finding.file, {
      count: current.count + 1,
      line: Math.min(current.line, finding.line),
    });
  }
  return [...buckets.entries()]
    .sort((left, right) => right[1].count - left[1].count || left[0].localeCompare(right[0]))
    .map(([file, entry]) => ({ file, count: entry.count, line: entry.line }));
};

const findingSeverityRank = (severity: NormalizedFinding['severity']): number => {
  if (severity === 'CRITICAL') {
    return 0;
  }
  if (severity === 'ERROR') {
    return 1;
  }
  if (severity === 'WARN') {
    return 2;
  }
  return 3;
};

export const buildTopFindings = (
  findings: ReadonlyArray<NormalizedFinding>,
  maxItems: number
): ReadonlyArray<{ severity: LegacySeverity; ruleId: string; file: string; line: number }> => {
  return [...findings]
    .sort((left, right) => {
      const severityDelta = findingSeverityRank(left.severity) - findingSeverityRank(right.severity);
      if (severityDelta !== 0) {
        return severityDelta;
      }
      const fileDelta = left.file.localeCompare(right.file);
      if (fileDelta !== 0) {
        return fileDelta;
      }
      if (left.line !== right.line) {
        return left.line - right.line;
      }
      return left.ruleId.localeCompare(right.ruleId);
    })
    .slice(0, maxItems)
    .map((finding) => ({
      severity: mapLegacySeverity(finding.severity),
      ruleId: finding.ruleId,
      file: finding.file,
      line: finding.line,
    }));
};
