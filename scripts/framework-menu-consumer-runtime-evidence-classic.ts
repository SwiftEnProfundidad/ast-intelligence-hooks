import type { EnterpriseEvidenceSeverity } from './framework-menu-evidence-summary-types';
import type { FrameworkMenuEvidenceSummary } from './framework-menu-evidence-summary-lib';
import { renderLegacyPanel, resolveLegacyPanelOuterWidth } from './framework-menu-legacy-audit-lib';
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

const outcomeToRole = (outcome: string | null): CliPaletteRole => {
  const normalized = (outcome ?? '').trim().toUpperCase();
  if (normalized === 'BLOCK' || normalized === 'BLOCKED') {
    return 'critical';
  }
  if (normalized === 'WARN') {
    return 'statusWarning';
  }
  if (normalized === 'PASS' || normalized === 'ALLOW' || normalized === 'ALLOWED') {
    return 'goal';
  }
  return 'sectionTitle';
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

  const lines: string[] = [
    applyCliPalette('PUMUKI — Classic evidence view (severities + platforms)', 'title', tokens),
    '',
    `${applyCliPalette('Stage', 'sectionTitle', tokens)}: ${summary.stage ?? 'unknown'}  ${applyCliPalette('Outcome', 'sectionTitle', tokens)}: ${applyCliPalette(String(summary.outcome ?? 'unknown'), outcomeToRole(summary.outcome), tokens)}`,
    `${applyCliPalette('Findings', 'sectionTitle', tokens)}: ${summary.totalFindings}  ${applyCliPalette('Scanned', 'muted', tokens)}: ${summary.filesScanned}  ${applyCliPalette('Affected', 'muted', tokens)}: ${summary.filesAffected}`,
    '',
    applyCliPalette('Enterprise severities', 'sectionTitle', tokens),
  ];

  const order: EnterpriseEvidenceSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  for (const band of order) {
    const count = ent[band] ?? 0;
    if (count === 0) {
      continue;
    }
    lines.push(
      `  ${applyCliPalette(`${band}:`, enterpriseSeverityToRole(band), tokens)} ${count}`
    );
  }

  lines.push('', applyCliPalette('Legacy severities', 'sectionTitle', tokens));
  lines.push(
    `  ${applyCliPalette('CRITICAL', 'critical', tokens)} ${summary.bySeverity.CRITICAL}  ` +
      `${applyCliPalette('ERROR', 'high', tokens)} ${summary.bySeverity.ERROR}  ` +
      `${applyCliPalette('WARN', 'medium', tokens)} ${summary.bySeverity.WARN}  ` +
      `${applyCliPalette('INFO', 'low', tokens)} ${summary.bySeverity.INFO}`
  );

  if (summary.platformAuditRows && summary.platformAuditRows.length > 0) {
    lines.push('', applyCliPalette('Platforms (from evidence snapshot)', 'sectionTitle', tokens));
    for (const row of summary.platformAuditRows) {
      lines.push(
        `  ${applyCliPalette(row.platform, 'rule', tokens)}: ${row.violations} violations`
      );
    }
    lines.push(
      applyCliPalette(
        'Note: platform buckets are heuristic (path + ruleId); "Other" is not absence of iOS/Android work.',
        'muted',
        tokens
      )
    );
  }

  lines.push('', applyCliPalette('Top violations (ranked)', 'sectionTitle', tokens));
  if (summary.topFindings.length === 0) {
    lines.push(applyCliPalette('  (none)', 'goal', tokens));
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
