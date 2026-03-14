import type { LegacyAuditSummary } from './framework-menu-legacy-audit-types';

export const normalizeLegacyAuditMarkdownPath = (file: string): string => {
  return file.replace(/\\/g, '/').replace(/^\.\//, '');
};

export const toLegacyAuditMarkdownFileLink = (file: string, line: number): string => {
  const normalized = normalizeLegacyAuditMarkdownPath(file);
  const safePath = encodeURI(normalized);
  return `[${normalized}:${line}](./${safePath}#L${line})`;
};

export const buildLegacyAuditTopFindingsSection = (summary: LegacyAuditSummary): string => {
  return (summary.topFindings ?? []).length === 0
    ? '- none'
    : (summary.topFindings ?? [])
      .map((finding) =>
        `- [${finding.severity}] ${finding.ruleId} -> ${toLegacyAuditMarkdownFileLink(finding.file, finding.line)}`
      )
      .join('\n');
};

export const buildLegacyAuditTopFilesSection = (summary: LegacyAuditSummary): string => {
  return (summary.topFileLocations ?? []).length === 0
    ? '- none'
    : (summary.topFileLocations ?? [])
      .map((entry) => `- ${toLegacyAuditMarkdownFileLink(entry.file, entry.line)}`)
      .join('\n');
};
