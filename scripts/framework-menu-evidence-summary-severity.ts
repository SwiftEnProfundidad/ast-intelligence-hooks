import type {
  EnterpriseEvidenceSeverity,
  EvidenceFinding,
  EvidenceSeverity,
} from './framework-menu-evidence-summary-types';
import {
  normalizeSeverity,
  toRepoRelativePath,
  toStringOrNull,
} from './framework-menu-evidence-summary-normalize';

export const emptySeverityCount = (): Record<EvidenceSeverity, number> => ({
  CRITICAL: 0,
  ERROR: 0,
  WARN: 0,
  INFO: 0,
});

export const emptyEnterpriseSeverityCount = (): Record<EnterpriseEvidenceSeverity, number> => ({
  CRITICAL: 0,
  HIGH: 0,
  MEDIUM: 0,
  LOW: 0,
});

export const toEnterpriseFromLegacy = (
  bySeverity: Readonly<Record<EvidenceSeverity, number>>
): Record<EnterpriseEvidenceSeverity, number> => ({
  CRITICAL: bySeverity.CRITICAL,
  HIGH: bySeverity.ERROR,
  MEDIUM: bySeverity.WARN,
  LOW: bySeverity.INFO,
});

export const countFindingsBySeverity = (
  findings: ReadonlyArray<EvidenceFinding>
): Record<EvidenceSeverity, number> => {
  const bySeverity = emptySeverityCount();
  for (const finding of findings) {
    const severity = normalizeSeverity(finding.severity);
    if (!severity) {
      continue;
    }
    bySeverity[severity] += 1;
  }
  return bySeverity;
};

export const toTopFiles = (params: {
  findings: ReadonlyArray<EvidenceFinding>;
  repoRoot: string;
}): ReadonlyArray<{ file: string; count: number }> => {
  const filesMap = new Map<string, number>();
  for (const finding of params.findings) {
    const rawFile = toStringOrNull(finding.file);
    if (!rawFile) {
      continue;
    }
    const file = toRepoRelativePath({
      repoRoot: params.repoRoot,
      filePath: rawFile,
    });
    filesMap.set(file, (filesMap.get(file) ?? 0) + 1);
  }

  return [...filesMap.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .map(([file, count]) => ({ file, count }));
};
