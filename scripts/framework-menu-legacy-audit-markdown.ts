import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatLegacyAuditReport } from './framework-menu-legacy-audit-render';
import { readLegacyAuditSummary } from './framework-menu-legacy-audit-summary';

export const exportLegacyAuditMarkdown = (params?: {
  repoRoot?: string;
  outputPath?: string;
}): string => {
  const repoRoot = params?.repoRoot ?? process.cwd();
  const summary = readLegacyAuditSummary(repoRoot);
  const report = formatLegacyAuditReport(summary);
  const outputPath = params?.outputPath
    ?? join(repoRoot, '.audit-reports', 'pumuki-legacy-audit.md');
  mkdirSync(join(outputPath, '..'), { recursive: true });

  const normalizeMarkdownPath = (file: string): string => {
    return file.replace(/\\/g, '/').replace(/^\.\//, '');
  };

  const toMarkdownFileLink = (file: string, line: number): string => {
    const normalized = normalizeMarkdownPath(file);
    const safePath = encodeURI(normalized);
    return `[${normalized}:${line}](./${safePath}#L${line})`;
  };

  const topFindingsSection = (summary.topFindings ?? []).length === 0
    ? '- none'
    : (summary.topFindings ?? [])
      .map((finding) =>
        `- [${finding.severity}] ${finding.ruleId} -> ${toMarkdownFileLink(finding.file, finding.line)}`
      )
      .join('\n');

  const topFilesByLocationSection = (summary.topFileLocations ?? []).length === 0
    ? '- none'
    : (summary.topFileLocations ?? [])
      .map((entry) => `- ${toMarkdownFileLink(entry.file, entry.line)}`)
      .join('\n');

  const markdown = [
    '# PUMUKI Audit Report',
    '',
    '## Snapshot',
    `- Stage: \`${summary.stage}\``,
    `- Outcome: \`${summary.outcome}\``,
    `- Total violations: \`${summary.totalViolations}\``,
    `- Severity: \`CRITICAL ${summary.bySeverity.CRITICAL} | HIGH ${summary.bySeverity.HIGH} | MEDIUM ${summary.bySeverity.MEDIUM} | LOW ${summary.bySeverity.LOW}\``,
    '',
    '## Clickable Top Files',
    topFilesByLocationSection,
    '',
    '## Clickable Findings',
    topFindingsSection,
    '',
    '## Legacy Panel',
    '```text',
    report,
    '```',
    '',
  ].join('\n');

  writeFileSync(outputPath, markdown, 'utf8');
  return outputPath;
};
