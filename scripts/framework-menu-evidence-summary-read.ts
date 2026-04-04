import type { FrameworkMenuEvidenceSummary } from './framework-menu-evidence-summary-types';
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

export const readEvidenceSummaryForMenu = (
  repoRoot: string = process.cwd()
): FrameworkMenuEvidenceSummary => {
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
    .slice(0, 10)
    .map((entry) => ({
      file: entry.file,
      line: entry.line,
    }));
  const topFindings = buildTopFindings({ findings, repoRoot, maxItems: 10 });

  return {
    status: 'ok',
    stage: toStringOrNull(evidence.snapshot.stage),
    outcome: toStringOrNull(evidence.snapshot.outcome),
    totalFindings: findings.length,
    filesScanned,
    filesAffected,
    bySeverity,
    byEnterpriseSeverity,
    topFiles: toTopFiles({ findings, repoRoot }),
    topFileLocations,
    topFindings,
  };
};
