import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type EvidenceSeverity = 'CRITICAL' | 'ERROR' | 'WARN' | 'INFO';
type EnterpriseEvidenceSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type EvidenceMetricValue = string | number | boolean | null | Date;

type EvidenceFinding = {
  file?: unknown;
  severity?: unknown;
};

type EvidenceSnapshot = {
  stage?: unknown;
  outcome?: unknown;
  findings?: unknown;
};

type EvidenceSeverityMetrics = {
  by_enterprise_severity?: unknown;
};

export type FrameworkMenuEvidenceSummary = {
  status: 'ok' | 'missing' | 'invalid';
  stage: string | null;
  outcome: string | null;
  totalFindings: number;
  bySeverity: Record<EvidenceSeverity, number>;
  byEnterpriseSeverity?: Record<EnterpriseEvidenceSeverity, number>;
  topFiles: ReadonlyArray<{ file: string; count: number }>;
};

const EVIDENCE_FILE = '.ai_evidence.json';

const emptySeverityCount = (): Record<EvidenceSeverity, number> => ({
  CRITICAL: 0,
  ERROR: 0,
  WARN: 0,
  INFO: 0,
});

const emptyEnterpriseSeverityCount = (): Record<EnterpriseEvidenceSeverity, number> => ({
  CRITICAL: 0,
  HIGH: 0,
  MEDIUM: 0,
  LOW: 0,
});

const toStringOrNull = (value: unknown): string | null => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
};

const asFindings = (value: unknown): EvidenceFinding[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as EvidenceFinding[];
};

const normalizePath = (value: string): string => {
  return value.replace(/\\/g, '/');
};

const normalizeRepoRoot = (repoRoot: string): string => {
  const normalized = normalizePath(repoRoot.trim());
  if (normalized.endsWith('/')) {
    return normalized.slice(0, -1);
  }
  return normalized;
};

const toRepoRelativePath = (params: { repoRoot: string; filePath: string }): string => {
  const candidate = normalizePath(params.filePath).replace(/^\.\//, '');
  if (!candidate.startsWith('/')) {
    return candidate;
  }
  const repoRoot = normalizeRepoRoot(params.repoRoot);
  const repoPrefix = `${repoRoot}/`;
  if (candidate === repoRoot) {
    return '.';
  }
  if (candidate.startsWith(repoPrefix)) {
    const relativePath = candidate.slice(repoPrefix.length);
    return relativePath.length > 0 ? relativePath : '.';
  }
  return candidate;
};

const toTopFiles = (params: {
  findings: EvidenceFinding[];
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

const normalizeSeverity = (value: unknown): EvidenceSeverity | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  if (normalized === 'CRITICAL') {
    return 'CRITICAL';
  }
  if (normalized === 'ERROR') {
    return 'ERROR';
  }
  if (normalized === 'WARN') {
    return 'WARN';
  }
  if (normalized === 'INFO') {
    return 'INFO';
  }
  return null;
};

const toEnterpriseFromLegacy = (
  bySeverity: Readonly<Record<EvidenceSeverity, number>>
): Record<EnterpriseEvidenceSeverity, number> => {
  return {
    CRITICAL: bySeverity.CRITICAL,
    HIGH: bySeverity.ERROR,
    MEDIUM: bySeverity.WARN,
    LOW: bySeverity.INFO,
  };
};

const normalizeEnterpriseSeverityCounts = (
  value: unknown
): Record<EnterpriseEvidenceSeverity, number> | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const record = value as Record<string, EvidenceMetricValue>;
  const parse = (entry: EvidenceMetricValue | undefined): number => {
    if (typeof entry !== 'number' || !Number.isFinite(entry)) {
      return 0;
    }
    return Math.max(0, Math.trunc(entry));
  };
  return {
    CRITICAL: parse(record.CRITICAL),
    HIGH: parse(record.HIGH),
    MEDIUM: parse(record.MEDIUM),
    LOW: parse(record.LOW),
  };
};

export const readEvidenceSummaryForMenu = (
  repoRoot: string = process.cwd()
): FrameworkMenuEvidenceSummary => {
  const evidencePath = join(repoRoot, EVIDENCE_FILE);
  if (!existsSync(evidencePath)) {
    return {
      status: 'missing',
      stage: null,
      outcome: null,
      totalFindings: 0,
      bySeverity: emptySeverityCount(),
      byEnterpriseSeverity: emptyEnterpriseSeverityCount(),
      topFiles: [],
    };
  }

  try {
    const parsed = JSON.parse(readFileSync(evidencePath, 'utf8')) as {
      snapshot?: EvidenceSnapshot;
      severity_metrics?: EvidenceSeverityMetrics;
    };
    const snapshot = (parsed?.snapshot ?? {}) as EvidenceSnapshot;
    const findings = asFindings(snapshot.findings);
    const bySeverity = emptySeverityCount();

    for (const finding of findings) {
      const severity = normalizeSeverity(finding.severity);
      if (!severity) {
        continue;
      }
      bySeverity[severity] += 1;
    }
    const byEnterpriseSeverity =
      normalizeEnterpriseSeverityCounts(parsed?.severity_metrics?.by_enterprise_severity) ??
      toEnterpriseFromLegacy(bySeverity);

    return {
      status: 'ok',
      stage: toStringOrNull(snapshot.stage),
      outcome: toStringOrNull(snapshot.outcome),
      totalFindings: findings.length,
      bySeverity,
      byEnterpriseSeverity,
      topFiles: toTopFiles({ findings, repoRoot }),
    };
  } catch {
    return {
      status: 'invalid',
      stage: null,
      outcome: null,
      totalFindings: 0,
      bySeverity: emptySeverityCount(),
      byEnterpriseSeverity: emptyEnterpriseSeverityCount(),
      topFiles: [],
    };
  }
};

const formatTopFiles = (topFiles: ReadonlyArray<{ file: string; count: number }>): string => {
  if (topFiles.length === 0) {
    return 'Top files: none';
  }
  return `Top files: ${topFiles
    .map((entry) => `${entry.file} (${entry.count})`)
    .join(', ')}`;
};

export const formatEvidenceSummaryForMenu = (
  summary: FrameworkMenuEvidenceSummary
): string => {
  if (summary.status === 'missing') {
    return [
      'Evidence: status=missing',
      'Run `npx --yes pumuki-pre-commit` to generate fresh evidence.',
    ].join('\n');
  }

  if (summary.status === 'invalid') {
    return [
      'Evidence: status=invalid',
      'Fix `.ai_evidence.json` format and regenerate from a gate command.',
    ].join('\n');
  }

  const stage = summary.stage ?? 'unknown';
  const outcome = summary.outcome ?? 'unknown';
  const byEnterpriseSeverity =
    summary.byEnterpriseSeverity ?? toEnterpriseFromLegacy(summary.bySeverity);
  return [
    `Evidence: status=ok stage=${stage} outcome=${outcome} findings=${summary.totalFindings}`,
    `Severities (enterprise): critical=${byEnterpriseSeverity.CRITICAL} high=${byEnterpriseSeverity.HIGH} medium=${byEnterpriseSeverity.MEDIUM} low=${byEnterpriseSeverity.LOW}`,
    `Severities (legacy): critical=${summary.bySeverity.CRITICAL} error=${summary.bySeverity.ERROR} warn=${summary.bySeverity.WARN} info=${summary.bySeverity.INFO}`,
    formatTopFiles(summary.topFiles),
  ].join('\n');
};
