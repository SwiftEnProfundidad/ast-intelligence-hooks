import type {
  EvidenceSnapshot,
  FrameworkMenuEvidencePlatformRow,
  FrameworkMenuEvidenceSummary,
} from './framework-menu-evidence-summary-types';
import { readEvidenceSummaryFile } from './framework-menu-evidence-summary-file';
import {
  asFindings,
  asNonNegativeInt,
  normalizeEnterpriseSeverityCounts,
  toStringOrNull,
} from './framework-menu-evidence-summary-normalize';
import {
  buildTopFindings,
  countFiles,
  countFindingsBySeverity,
  emptyEnterpriseSeverityCount,
  emptySeverityCount,
  toEnterpriseFromLegacy,
  toTopFiles,
} from './framework-menu-evidence-summary-severity';

export type ReadEvidenceSummaryForMenuOptions = {
  topFindingsLimit?: number;
  topFileLocationsLimit?: number;
  topFilesLimit?: number;
};

const sumLegacySeverityBand = (row: { by_severity?: unknown }): number => {
  const bands = row.by_severity;
  if (!bands || typeof bands !== 'object') {
    return 0;
  }
  const b = bands as Record<string, unknown>;
  const keys = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
  let total = 0;
  for (const key of keys) {
    const value = b[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      total += value;
    }
  }
  return total;
};

const parsePlatformAuditRows = (
  snapshot: EvidenceSnapshot
): ReadonlyArray<FrameworkMenuEvidencePlatformRow> => {
  const raw = snapshot.platforms;
  if (!Array.isArray(raw)) {
    return [];
  }
  const rows: FrameworkMenuEvidencePlatformRow[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const platform = toStringOrNull((entry as { platform?: unknown }).platform) ?? 'Other';
    const violations = sumLegacySeverityBand(entry as { by_severity?: unknown });
    rows.push({ platform, violations });
  }
  return rows;
};

export const readEvidenceSummaryForMenu = (
  repoRoot: string = process.cwd(),
  options?: ReadEvidenceSummaryForMenuOptions
): FrameworkMenuEvidenceSummary => {
  const topFindingsLimit = options?.topFindingsLimit ?? 10;
  const topFileLocationsLimit = options?.topFileLocationsLimit ?? 10;
  const topFilesLimit = options?.topFilesLimit ?? 5;
  const evidence = readEvidenceSummaryFile(repoRoot);

  if (evidence.status === 'missing') {
    return {
      status: 'missing',
      stage: null,
      outcome: null,
      totalFindings: 0,
      filesScanned: 0,
      filesAffected: 0,
      bySeverity: emptySeverityCount(),
      byEnterpriseSeverity: emptyEnterpriseSeverityCount(),
      topFiles: [],
      topFileLocations: [],
      topFindings: [],
    };
  }

  if (evidence.status === 'invalid') {
    return {
      status: 'invalid',
      stage: null,
      outcome: null,
      totalFindings: 0,
      filesScanned: 0,
      filesAffected: 0,
      bySeverity: emptySeverityCount(),
      byEnterpriseSeverity: emptyEnterpriseSeverityCount(),
      topFiles: [],
      topFileLocations: [],
      topFindings: [],
    };
  }

  const findings = asFindings(evidence.snapshot.findings);
  const bySeverity = countFindingsBySeverity(findings);
  const byEnterpriseSeverity =
    normalizeEnterpriseSeverityCounts(evidence.severityMetrics?.by_enterprise_severity) ??
    toEnterpriseFromLegacy(bySeverity);
  const filesScanned = asNonNegativeInt(
    evidence.snapshot.files_scanned ?? evidence.snapshot.filesScanned
  );
  const filesAffected = asNonNegativeInt(
    evidence.snapshot.files_affected ?? evidence.snapshot.filesAffected
  );
  const topFileLocations = countFiles({ findings, repoRoot })
    .slice(0, topFileLocationsLimit)
    .map((entry) => ({
      file: entry.file,
      line: entry.line,
    }));
  const topFindings = buildTopFindings({ findings, repoRoot, maxItems: topFindingsLimit });
  const platformAuditRows = parsePlatformAuditRows(evidence.snapshot);

  return {
    status: 'ok',
    stage: toStringOrNull(evidence.snapshot.stage),
    outcome: toStringOrNull(evidence.snapshot.outcome),
    totalFindings: findings.length,
    filesScanned,
    filesAffected,
    bySeverity,
    byEnterpriseSeverity,
    topFiles: toTopFiles({ findings, repoRoot, maxItems: topFilesLimit }),
    topFileLocations,
    topFindings,
    ...(platformAuditRows.length > 0 ? { platformAuditRows } : {}),
  };
};
