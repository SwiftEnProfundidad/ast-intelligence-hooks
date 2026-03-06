import type { FrameworkMenuEvidenceSummary } from './framework-menu-evidence-summary-types';

const toEnterpriseFromLegacy = (summary: FrameworkMenuEvidenceSummary) => {
  return {
    CRITICAL: summary.bySeverity.CRITICAL,
    HIGH: summary.bySeverity.ERROR,
    MEDIUM: summary.bySeverity.WARN,
    LOW: summary.bySeverity.INFO,
  };
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
      'Run `./node_modules/.bin/pumuki-pre-commit` to generate fresh evidence.',
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
    summary.byEnterpriseSeverity ?? toEnterpriseFromLegacy(summary);

  return [
    `Evidence: status=ok stage=${stage} outcome=${outcome} findings=${summary.totalFindings}`,
    `Severities (enterprise): critical=${byEnterpriseSeverity.CRITICAL} high=${byEnterpriseSeverity.HIGH} medium=${byEnterpriseSeverity.MEDIUM} low=${byEnterpriseSeverity.LOW}`,
    `Severities (legacy): critical=${summary.bySeverity.CRITICAL} error=${summary.bySeverity.ERROR} warn=${summary.bySeverity.WARN} info=${summary.bySeverity.INFO}`,
    formatTopFiles(summary.topFiles),
  ].join('\n');
};
