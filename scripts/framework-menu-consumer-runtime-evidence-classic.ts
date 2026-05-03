import type { EnterpriseEvidenceSeverity } from './framework-menu-evidence-summary-types';
import type { FrameworkMenuEvidenceSummary } from './framework-menu-evidence-summary-lib';
import {
  readLegacyAuditSummary,
  renderLegacyPanel,
  resolveLegacyPanelOuterWidth,
} from './framework-menu-legacy-audit-lib';
import { applyCliPalette, buildCliDesignTokens } from './framework-menu-ui-components-lib';
import type { CliPaletteRole } from './framework-menu-ui-components-types';

const enterpriseSeverityToRole = (severity: EnterpriseEvidenceSeverity): CliPaletteRole => {
  if (severity === 'CRITICAL') {
    return 'critical';
  }
  if (severity === 'HIGH') {
    return 'high';
  }
  if (severity === 'MEDIUM') {
    return 'medium';
  }
  return 'low';
};

export const formatVintageEvidenceReportLines = (
  summary: FrameworkMenuEvidenceSummary,
  tokens: ReturnType<typeof buildCliDesignTokens>
): string[] => {
  if (summary.status !== 'ok') {
    return [
      applyCliPalette('PUMUKI — Classic evidence view', 'title', tokens),
      applyCliPalette(
        summary.status === 'missing'
          ? 'No .ai_evidence.json — run an engine audit (1, 11–14) first.'
          : 'Invalid .ai_evidence.json — regenerate from a gate run.',
        'muted',
        tokens
      ),
    ];
  }

  const ent = summary.byEnterpriseSeverity ?? {
    CRITICAL: summary.bySeverity.CRITICAL,
    HIGH: summary.bySeverity.ERROR,
    MEDIUM: summary.bySeverity.WARN,
    LOW: summary.bySeverity.INFO,
  };
  const total = Math.max(0, summary.totalFindings);
  const scanned = Math.max(0, summary.filesScanned);
  const healthPenalty = scanned > 0
    ? Math.min(100, Math.round((total * 100) / Math.max(1, scanned)))
    : 0;
  const healthScore = Math.max(
    0,
    Math.min(
      100,
      100
        - healthPenalty
        - (ent.CRITICAL > 0 ? 10 : 0)
        - (ent.HIGH > 50 ? 10 : 0)
        - (summary.bySeverity.ERROR > 0 ? 5 : 0)
    )
  );
  const healthLabel = healthScore >= 80
    ? 'Excellent'
    : healthScore >= 60
      ? 'Good'
      : healthScore >= 40
        ? 'Needs Improvement'
        : 'Critical';
  const legacy = readLegacyAuditSummary(process.cwd());
  const patterns = legacy.status === 'ok'
    ? legacy.patternChecks
    : { todoFixme: 0, consoleLog: 0, anyType: 0, sqlRaw: 0 };

  const lines: string[] = [
    applyCliPalette('Advanced Project Audit — AST Intelligence & Quality Gate', 'title', tokens),
    '',
    applyCliPalette('═══════════════════════════════════════════════════════════════', 'title', tokens),
    applyCliPalette('Summary', 'title', tokens),
    applyCliPalette('═══════════════════════════════════════════════════════════════', 'title', tokens),
    '',
    applyCliPalette('QUICK SUMMARY', 'sectionTitle', tokens),
    `  Files Scanned:      ${summary.filesScanned}`,
    `  Total Violations:   ${summary.totalFindings}`,
    `  ESLint Errors:      ${summary.bySeverity.ERROR}`,
    `  Critical Issues:    ${ent.CRITICAL}`,
    `  High Priority:      ${ent.HIGH}`,
    '',
    ent.CRITICAL > 0 || ent.HIGH > 0 || summary.bySeverity.ERROR > 0
      ? applyCliPalette('  STATUS: ACTION REQUIRED', 'critical', tokens)
      : applyCliPalette('  STATUS: ALL CLEAR', 'goal', tokens),
    '',
    applyCliPalette('1. PATTERN CHECKS', 'sectionTitle', tokens),
    '─────────────────────────────────────────────────────────────',
    `  TODO_FIXME: ${patterns.todoFixme}`,
    `  CONSOLE_LOG: ${patterns.consoleLog}`,
    `  ANY_TYPE: ${patterns.anyType}`,
    `  SQL_RAW: ${patterns.sqlRaw}`,
    '',
    applyCliPalette('2. ESLINT AUDIT RESULTS', 'sectionTitle', tokens),
    '─────────────────────────────────────────────────────────────',
    `  ESLint: errors=${summary.bySeverity.ERROR} warnings=${summary.bySeverity.WARN}`,
    '',
    applyCliPalette('3. AST INTELLIGENCE - SEVERITY BREAKDOWN (Repository)', 'sectionTitle', tokens),
    '─────────────────────────────────────────────────────────────',
  ];

  const order: EnterpriseEvidenceSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  for (const band of order) {
    const count = ent[band] ?? 0;
    const pct = total > 0 ? ` (${Math.round((count * 100) / total)}%)` : '';
    lines.push(
      `  ${applyCliPalette(`${band}:`, enterpriseSeverityToRole(band), tokens)} ${count} violations${pct}`
    );
  }

  lines.push('', applyCliPalette('4. PLATFORM-SPECIFIC ANALYSIS', 'sectionTitle', tokens));
  lines.push('─────────────────────────────────────────────────────────────');
  if (summary.platformAuditRows && summary.platformAuditRows.length > 0) {
    const hasOtherRules = summary.platformAuditRows.some((row) =>
      row.platform === 'Other' && (row.violations > 0 || (row.activeRules ?? 0) > 0)
    );
    for (const row of summary.platformAuditRows) {
      const rulesSuffix =
        typeof row.evaluatedRules === 'number' || typeof row.activeRules === 'number'
          ? ` · rules evaluated=${row.evaluatedRules ?? 0}/${row.activeRules ?? 0}`
          : '';
      lines.push(
        `  ${applyCliPalette(row.platform, 'rule', tokens)}: ${row.violations} violations${rulesSuffix}`
      );
    }
    if (hasOtherRules) {
      lines.push(
        applyCliPalette(
          '  Other = cross-cutting/generic governance, evidence, BDD and shared-type rules.',
          'muted',
          tokens
        )
      );
    }
  } else {
    lines.push('  No platform summary available.');
  }

  lines.push('', applyCliPalette('5. TOP VIOLATIONS & REMEDIATION', 'sectionTitle', tokens));
  lines.push('─────────────────────────────────────────────────────────────');
  if (summary.topFindings.length === 0) {
    lines.push(applyCliPalette('  No violations detected', 'goal', tokens));
  } else {
    for (const finding of summary.topFindings) {
      const role = enterpriseSeverityToRole(finding.severity);
      lines.push(
        `  ${applyCliPalette(`[${finding.severity}]`, role, tokens)} ${finding.ruleId}`
      );
      lines.push(
        `      ${applyCliPalette(`${finding.file}:${finding.line}`, 'muted', tokens)}`
      );
    }
  }

  lines.push(
    '',
    applyCliPalette('6. EXECUTIVE SUMMARY', 'sectionTitle', tokens),
    '─────────────────────────────────────────────────────────────',
    `  Total violations detected: ${summary.totalFindings}`,
    `  ESLint errors:            ${summary.bySeverity.ERROR}`,
    `  ESLint warnings:          ${summary.bySeverity.WARN}`,
    `  Critical issues:          ${ent.CRITICAL}`,
    `  High priority issues:     ${ent.HIGH}`,
    `  Files scanned:            ${summary.filesScanned}`,
    '',
    `  Code Health Score: ${healthScore}% (${healthLabel})`,
    '',
    ent.CRITICAL > 0 || ent.HIGH > 0 || summary.bySeverity.ERROR > 0
      ? applyCliPalette('  ACTION REQUIRED: Critical or high-severity issues detected.', 'critical', tokens)
      : applyCliPalette('  No critical issues detected', 'goal', tokens),
    '',
    applyCliPalette('7. AUDIT METADATA', 'sectionTitle', tokens),
    '─────────────────────────────────────────────────────────────',
    `  Stage: ${summary.stage ?? 'unknown'}`,
    `  Outcome: ${summary.outcome ?? 'unknown'}`,
    `  Files scanned: ${summary.filesScanned}`,
    '',
    applyCliPalette('FINAL SUMMARY - VIOLATIONS BY SEVERITY', 'title', tokens),
    `  CRITICAL: ${ent.CRITICAL}`,
    `  HIGH:     ${ent.HIGH}`,
    `  MEDIUM:   ${ent.MEDIUM}`,
    `  LOW:      ${ent.LOW}`,
    '',
    `  Total violations: ${summary.totalFindings}`
  );

  return lines;
};

export const renderVintageEvidenceReport = (params: {
  write: (text: string) => void;
  summary: FrameworkMenuEvidenceSummary;
  useColor: () => boolean;
}): void => {
  if (process.env.PUMUKI_MENU_VINTAGE_REPORT === '0') {
    return;
  }
  const tokens = buildCliDesignTokens({
    width: resolveLegacyPanelOuterWidth(),
    color: params.useColor(),
  });

  const lines = formatVintageEvidenceReportLines(params.summary, tokens);
  params.write(
    `\n${renderLegacyPanel(lines, {
      width: resolveLegacyPanelOuterWidth(),
      color: params.useColor(),
    })}\n`
  );
};
