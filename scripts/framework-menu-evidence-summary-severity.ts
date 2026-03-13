import type {
  EnterpriseEvidenceSeverity,
  EvidenceFinding,
  EvidenceSeverity,
} from './framework-menu-evidence-summary-types';
import {
  asNonNegativeInt,
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

const normalizeFindingLine = (value: unknown): number => {
  if (Array.isArray(value)) {
    const lines = value
      .map((entry) => asNonNegativeInt(entry))
      .filter((entry) => entry > 0);
    return lines.length > 0 ? Math.min(...lines) : 1;
  }

  const line = asNonNegativeInt(value);
  return line > 0 ? line : 1;
};

const severityRank = (severity: EvidenceSeverity): number => {
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

const toEnterpriseSeverity = (severity: EvidenceSeverity): EnterpriseEvidenceSeverity => {
  if (severity === 'CRITICAL') {
    return 'CRITICAL';
  }
  if (severity === 'ERROR') {
    return 'HIGH';
  }
  if (severity === 'WARN') {
    return 'MEDIUM';
  }
  return 'LOW';
};

export const countFiles = (params: {
  findings: ReadonlyArray<EvidenceFinding>;
  repoRoot: string;
}): ReadonlyArray<{ file: string; count: number; line: number }> => {
  const filesMap = new Map<string, { count: number; line: number }>();
  for (const finding of params.findings) {
    const rawFile = toStringOrNull(finding.filePath) ?? toStringOrNull(finding.file);
    if (!rawFile) {
      continue;
    }
    const file = toRepoRelativePath({
      repoRoot: params.repoRoot,
      filePath: rawFile,
    });
    const line = normalizeFindingLine(finding.lines);
    const current = filesMap.get(file);
    if (!current) {
      filesMap.set(file, { count: 1, line });
      continue;
    }
    filesMap.set(file, {
      count: current.count + 1,
      line: Math.min(current.line, line),
    });
  }

  return [...filesMap.entries()]
    .sort((left, right) => right[1].count - left[1].count || left[0].localeCompare(right[0]))
    .map(([file, entry]) => ({ file, count: entry.count, line: entry.line }));
};

export const buildTopFindings = (params: {
  findings: ReadonlyArray<EvidenceFinding>;
  repoRoot: string;
  maxItems: number;
}): ReadonlyArray<{
  severity: EnterpriseEvidenceSeverity;
  ruleId: string;
  file: string;
  line: number;
}> => {
  const normalized = params.findings
    .map((finding) => {
      const severity = normalizeSeverity(finding.severity);
      const rawFile = toStringOrNull(finding.filePath) ?? toStringOrNull(finding.file);
      if (!severity || !rawFile) {
        return null;
      }

      return {
        severity,
        ruleId: toStringOrNull(finding.ruleId) ?? 'unknown.rule',
        file: toRepoRelativePath({
          repoRoot: params.repoRoot,
          filePath: rawFile,
        }),
        line: normalizeFindingLine(finding.lines),
      };
    })
    .filter((finding): finding is {
      severity: EvidenceSeverity;
      ruleId: string;
      file: string;
      line: number;
    } => finding !== null);

  return normalized
    .sort((left, right) => {
      const bySeverity = severityRank(left.severity) - severityRank(right.severity);
      if (bySeverity !== 0) {
        return bySeverity;
      }
      const byFile = left.file.localeCompare(right.file);
      if (byFile !== 0) {
        return byFile;
      }
      if (left.line !== right.line) {
        return left.line - right.line;
      }
      return left.ruleId.localeCompare(right.ruleId);
    })
    .slice(0, params.maxItems)
    .map((finding) => ({
      severity: toEnterpriseSeverity(finding.severity),
      ruleId: finding.ruleId,
      file: finding.file,
      line: finding.line,
    }));
};
