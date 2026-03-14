import type { LegacyAuditSummary } from './framework-menu-legacy-audit-types';
import {
  LEGACY_AUDIT_OVERVIEW_SUBTITLE,
  LEGACY_AUDIT_OVERVIEW_TITLE,
  renderLegacyPanel,
} from './framework-menu-legacy-audit-render-panel';
import {
  formatLegacyAstBreakdown,
  formatLegacyEslintAudit,
  formatLegacyFileDiagnostics,
  formatLegacyPatternChecks,
  formatLegacyRulesetBreakdown,
  formatLegacyStatusLine,
} from './framework-menu-legacy-audit-render-sections';

const buildOverviewPanelLines = (): string[] => {
  return [
    LEGACY_AUDIT_OVERVIEW_TITLE,
    LEGACY_AUDIT_OVERVIEW_SUBTITLE,
    '',
    '1) Pattern checks snapshot',
    '2) ESLint snapshot',
    '3) AST evidence breakdown',
    '4) Ruleset coverage snapshot',
    '',
    'Source of truth',
    '.ai_evidence.json + canonical evidence summary',
    '',
    'Mode',
    'Legacy read-only export; no gate recomputation',
    '',
    'Canonical verdict',
    'Use pumuki status --json or doctor --deep --json',
  ];
};

const buildQuickSummaryPanelLines = (summary: LegacyAuditSummary): string[] => {
  return [
    'QUICK SUMMARY',
    '',
    `Files scanned: ${summary.filesScanned}`,
    `Files affected: ${summary.filesAffected}`,
    `Total violations: ${summary.totalViolations}`,
    `ESLint errors: ${summary.eslint.errors}`,
    `Critical issues: ${summary.bySeverity.CRITICAL}`,
    `High priority: ${summary.bySeverity.HIGH}`,
    '',
    ...formatLegacyStatusLine(summary).split('\n'),
    '',
    ...formatLegacyPatternChecks(summary).split('\n'),
    '',
    ...formatLegacyEslintAudit(summary).split('\n'),
  ];
};

const buildRemediationPanelLines = (summary: LegacyAuditSummary): string[] => {
  const topViolations = summary.topViolations.length === 0
    ? ['• none']
    : summary.topViolations.map((violation) => `• ${violation.ruleId} (${violation.count} violations)`);
  const topFindings = summary.topFindings ?? [];
  const topFindingLocations = topFindings.length === 0
    ? ['• none']
    : topFindings.map((finding) => (
      `• [${finding.severity}] ${finding.ruleId} → ${finding.file}:${finding.line}`
    ));

  return [
    '5) TOP FINDINGS SNAPSHOT',
    '',
    ...topViolations,
    '',
    'Clickable locations (file:line)',
    ...topFindingLocations,
  ];
};

const buildMetricsPanelLines = (summary: LegacyAuditSummary): string[] => {
  const affectedRatio = summary.filesScanned > 0
    ? Math.round((summary.filesAffected / Math.max(1, summary.filesScanned)) * 100)
    : 0;

  return [
    'READ-ONLY EVIDENCE SNAPSHOT',
    `Total violations detected: ${summary.totalViolations}`,
    `ESLint errors: ${summary.eslint.errors}`,
    `Critical issues: ${summary.bySeverity.CRITICAL}`,
    `High priority issues: ${summary.bySeverity.HIGH}`,
    `Files scanned: ${summary.filesScanned}`,
    `Affected ratio: ${affectedRatio}%`,
    '',
    `Evidence stage: ${summary.stage}`,
    `Evidence outcome: ${summary.outcome}`,
    'Export semantics: legacy read-only snapshot',
    'Canonical verdict: pumuki status --json / doctor --deep --json',
    '',
    'SEVERITY SNAPSHOT',
    `● CRITICAL: ${summary.bySeverity.CRITICAL}`,
    `● HIGH: ${summary.bySeverity.HIGH}`,
    `● MEDIUM: ${summary.bySeverity.MEDIUM}`,
    `● LOW: ${summary.bySeverity.LOW}`,
  ];
};

export const formatLegacyAuditReport = (
  summary: LegacyAuditSummary,
  options?: { panelWidth?: number; color?: boolean }
): string => {
  if (summary.status === 'missing') {
    return 'Legacy read-only export unavailable: no .ai_evidence.json found. Generate canonical evidence first.';
  }
  if (summary.status === 'invalid') {
    return 'Legacy read-only export unavailable: .ai_evidence.json is invalid. Regenerate canonical evidence and retry.';
  }

  const widthOptions = { width: options?.panelWidth, color: options?.color };
  return [
    renderLegacyPanel(buildOverviewPanelLines(), widthOptions),
    renderLegacyPanel(buildQuickSummaryPanelLines(summary), widthOptions),
    renderLegacyPanel(formatLegacyAstBreakdown(summary).split('\n'), widthOptions),
    renderLegacyPanel(formatLegacyRulesetBreakdown(summary).split('\n'), widthOptions),
    renderLegacyPanel(buildRemediationPanelLines(summary), widthOptions),
    renderLegacyPanel(buildMetricsPanelLines(summary), widthOptions),
  ].join('\n\n');
};
