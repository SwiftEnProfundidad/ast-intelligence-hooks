import type { LegacyAuditSummary } from './framework-menu-legacy-audit-types';
import { formatLegacyAuditReport } from './framework-menu-legacy-audit-render';
import {
  buildLegacyAuditTopFilesSection,
  buildLegacyAuditTopFindingsSection,
} from './framework-menu-legacy-audit-markdown-links';

export const buildLegacyAuditMarkdownDocument = (summary: LegacyAuditSummary): string => {
  const report = formatLegacyAuditReport(summary);
  return [
    '# PUMUKI Legacy Read-Only Evidence Snapshot',
    '',
    'Derived from `.ai_evidence.json`. This document does not redefine the canonical gate verdict.',
    '',
    '## Snapshot',
    `- Stage: \`${summary.stage}\``,
    `- Outcome: \`${summary.outcome}\``,
    `- Total violations: \`${summary.totalViolations}\``,
    `- Severity: \`CRITICAL ${summary.bySeverity.CRITICAL} | HIGH ${summary.bySeverity.HIGH} | MEDIUM ${summary.bySeverity.MEDIUM} | LOW ${summary.bySeverity.LOW}\``,
    '- Mode: `legacy read-only`',
    '- Canonical verdict: `pumuki status --json | doctor --deep --json`',
    '',
    '## Clickable Top Files',
    buildLegacyAuditTopFilesSection(summary),
    '',
    '## Clickable Findings',
    buildLegacyAuditTopFindingsSection(summary),
    '',
    '## Legacy Read-Only Panel',
    '```text',
    report,
    '```',
    '',
  ].join('\n');
};
