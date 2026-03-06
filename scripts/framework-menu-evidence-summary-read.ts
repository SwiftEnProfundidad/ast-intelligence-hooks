import type { FrameworkMenuEvidenceSummary } from './framework-menu-evidence-summary-types';
import { readEvidenceSummaryFile } from './framework-menu-evidence-summary-file';
import {
  asFindings,
  normalizeEnterpriseSeverityCounts,
  toStringOrNull,
} from './framework-menu-evidence-summary-normalize';
import {
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
      bySeverity: emptySeverityCount(),
      byEnterpriseSeverity: emptyEnterpriseSeverityCount(),
      topFiles: [],
    };
  }

  if (evidence.status === 'invalid') {
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

  const findings = asFindings(evidence.snapshot.findings);
  const bySeverity = countFindingsBySeverity(findings);
  const byEnterpriseSeverity =
    normalizeEnterpriseSeverityCounts(evidence.severityMetrics?.by_enterprise_severity) ??
    toEnterpriseFromLegacy(bySeverity);

  return {
    status: 'ok',
    stage: toStringOrNull(evidence.snapshot.stage),
    outcome: toStringOrNull(evidence.snapshot.outcome),
    totalFindings: findings.length,
    bySeverity,
    byEnterpriseSeverity,
    topFiles: toTopFiles({ findings, repoRoot }),
  };
};
