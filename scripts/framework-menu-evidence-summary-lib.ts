import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type EvidenceSeverity = 'CRITICAL' | 'ERROR' | 'WARN' | 'INFO';

type EvidenceFinding = {
  file?: unknown;
  severity?: unknown;
};

type EvidenceSnapshot = {
  stage?: unknown;
  outcome?: unknown;
  findings?: unknown;
};

export type FrameworkMenuEvidenceSummary = {
  status: 'ok' | 'missing' | 'invalid';
  stage: string | null;
  outcome: string | null;
  totalFindings: number;
  bySeverity: Record<EvidenceSeverity, number>;
  topFiles: ReadonlyArray<{ file: string; count: number }>;
};

const EVIDENCE_FILE = '.ai_evidence.json';

const emptySeverityCount = (): Record<EvidenceSeverity, number> => ({
  CRITICAL: 0,
  ERROR: 0,
  WARN: 0,
  INFO: 0,
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

const toTopFiles = (findings: EvidenceFinding[]): ReadonlyArray<{ file: string; count: number }> => {
  const filesMap = new Map<string, number>();
  for (const finding of findings) {
    const file = toStringOrNull(finding.file);
    if (!file) {
      continue;
    }
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
      topFiles: [],
    };
  }

  try {
    const parsed = JSON.parse(readFileSync(evidencePath, 'utf8')) as {
      snapshot?: EvidenceSnapshot;
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

    return {
      status: 'ok',
      stage: toStringOrNull(snapshot.stage),
      outcome: toStringOrNull(snapshot.outcome),
      totalFindings: findings.length,
      bySeverity,
      topFiles: toTopFiles(findings),
    };
  } catch {
    return {
      status: 'invalid',
      stage: null,
      outcome: null,
      totalFindings: 0,
      bySeverity: emptySeverityCount(),
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
  return [
    `Evidence: status=ok stage=${stage} outcome=${outcome} findings=${summary.totalFindings}`,
    `Severities: critical=${summary.bySeverity.CRITICAL} error=${summary.bySeverity.ERROR} warn=${summary.bySeverity.WARN} info=${summary.bySeverity.INFO}`,
    formatTopFiles(summary.topFiles),
  ].join('\n');
};
