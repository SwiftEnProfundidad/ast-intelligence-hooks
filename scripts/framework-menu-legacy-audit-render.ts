import type {
  GateSeverity,
  LegacyAuditSummary,
  LegacyMenuDesignTokens,
  LegacyMenuPaletteRole,
  LegacySeverity,
  PlatformSummary,
} from './framework-menu-legacy-audit-types';

const OVERVIEW_TITLE = 'PUMUKI — Hook-System (run: npx ast-hooks)';
const OVERVIEW_SUBTITLE = 'AST Intelligence System Overview';
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;
const PANEL_MIN_WIDTH = 56;
const PANEL_MAX_WIDTH = 120;
const PANEL_DEFAULT_WIDTH = 88;
const PANEL_TTY_MARGIN = 8;

const formatStatusLine = (summary: LegacyAuditSummary): string => {
  if (summary.bySeverity.CRITICAL > 0 || summary.bySeverity.HIGH > 0) {
    return '⚠ STATUS: ACTION REQUIRED\nCritical or high-severity issues detected';
  }
  if (summary.bySeverity.MEDIUM > 0 || summary.bySeverity.LOW > 0) {
    return '⚠ STATUS: REVIEW RECOMMENDED\nOnly medium/low issues detected';
  }
  return '✅ STATUS: CLEAN\nNo violations detected';
};

const formatPlatformBlock = (platform: PlatformSummary): string => {
  const lines = [
    `┌ Platform: ${platform.platform}`,
    `│ ● CRITICAL: ${platform.bySeverity.CRITICAL} ● HIGH: ${platform.bySeverity.HIGH} ● MEDIUM: ${platform.bySeverity.MEDIUM} ● LOW: ${platform.bySeverity.LOW}`,
    `│ Files affected: ${platform.filesAffected}`,
    '│ Top violations:',
  ];
  if (platform.topViolations.length === 0) {
    lines.push('│   none');
  } else {
    for (const violation of platform.topViolations) {
      lines.push(`│   ${violation.ruleId}: ${violation.count}`);
    }
  }
  lines.push('└ End platform block');
  return lines.join('\n');
};

const stripAnsi = (value: string): string => value.replace(ANSI_PATTERN, '');

const visibleLength = (value: string): number => stripAnsi(value).length;

const padRight = (value: string, width: number): string => {
  const padding = width - visibleLength(value);
  if (padding <= 0) {
    return value;
  }
  return `${value}${' '.repeat(padding)}`;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const resolvePanelOuterWidth = (requested?: number): number => {
  const forcedWidth = Number(process.env.PUMUKI_MENU_WIDTH ?? 0);
  if (Number.isFinite(forcedWidth) && forcedWidth > 0) {
    return clamp(Math.trunc(forcedWidth), PANEL_MIN_WIDTH, PANEL_MAX_WIDTH);
  }
  if (Number.isFinite(requested ?? Number.NaN) && (requested ?? 0) > 0) {
    return clamp(Math.trunc(Number(requested)), PANEL_MIN_WIDTH, PANEL_MAX_WIDTH);
  }
  const ttyColumns = Number(process.stdout.columns ?? 0);
  if (Number.isFinite(ttyColumns) && ttyColumns > 0) {
    return clamp(Math.trunc(ttyColumns - PANEL_TTY_MARGIN), PANEL_MIN_WIDTH, PANEL_MAX_WIDTH);
  }
  return PANEL_DEFAULT_WIDTH;
};

const useColor = (enabled?: boolean): boolean => {
  if (typeof enabled === 'boolean') {
    return enabled;
  }
  if (process.env.NO_COLOR === '1') {
    return false;
  }
  return process.stdout.isTTY === true;
};

const color = (text: string, code: string, enabled: boolean): string => {
  if (!enabled) {
    return text;
  }
  return `\u001b[${code}m${text}\u001b[0m`;
};

const useAsciiMode = (): boolean => {
  if (process.env.PUMUKI_MENU_ASCII === '1') {
    return true;
  }
  const locale = (process.env.LC_ALL ?? process.env.LC_CTYPE ?? process.env.LANG ?? '').toLowerCase();
  return locale === 'c' || locale === 'posix';
};

const toAsciiLine = (line: string): string => {
  return line
    .replace(/—/g, '-')
    .replace(/→/g, '->')
    .replace(/•/g, '*')
    .replace(/●/g, 'o')
    .replace(/⚠/g, '!')
    .replace(/✅/g, 'OK')
    .replace(/ℹ/g, 'i')
    .replace(/┌/g, '+')
    .replace(/└/g, '+')
    .replace(/│/g, '|');
};

const buildLegacyMenuDesignTokens = (options?: {
  width?: number;
  color?: boolean;
}): LegacyMenuDesignTokens => {
  const panelOuterWidth = resolvePanelOuterWidth(options?.width);
  return {
    colorEnabled: useColor(options?.color),
    asciiMode: useAsciiMode(),
    panelOuterWidth,
    panelInnerWidth: panelOuterWidth - 4,
    border: useAsciiMode()
      ? {
        topLeft: '+',
        topRight: '+',
        bottomLeft: '+',
        bottomRight: '+',
        horizontal: '-',
        vertical: '|',
      }
      : {
        topLeft: '╭',
        topRight: '╮',
        bottomLeft: '╰',
        bottomRight: '╯',
        horizontal: '─',
        vertical: '│',
      },
    palette: {
      title: '96;1',
      subtitle: '92;1',
      switch: '90',
      sectionTitle: '96;1',
      statusWarning: '93;1',
      rule: '93',
      goal: '92',
      critical: '91',
      high: '93',
      medium: '33',
      low: '94',
      muted: '90',
      border: '94',
    },
  };
};

export const resolveLegacyMenuDesignTokens = (options?: {
  width?: number;
  color?: boolean;
}): LegacyMenuDesignTokens => buildLegacyMenuDesignTokens(options);

const applyPalette = (
  line: string,
  role: LegacyMenuPaletteRole,
  tokens: LegacyMenuDesignTokens
): string => {
  return color(line, tokens.palette[role], tokens.colorEnabled);
};

const styleLegacyLine = (line: string, tokens: LegacyMenuDesignTokens): string => {
  if (line.length === 0) {
    return line;
  }
  if (line.startsWith('PUMUKI — Hook-System')) {
    return applyPalette(line, 'title', tokens);
  }
  if (line === OVERVIEW_SUBTITLE) {
    return applyPalette(line, 'subtitle', tokens);
  }
  if (line.startsWith('A. Switch')) {
    return applyPalette(line, 'switch', tokens);
  }
  if (line === 'QUICK SUMMARY' || line === 'METRICS' || line.startsWith('FINAL SUMMARY')) {
    return applyPalette(line, 'sectionTitle', tokens);
  }
  if (/^(\d\)|5\)|6\))\s/.test(line)) {
    return applyPalette(line, 'sectionTitle', tokens);
  }
  if (line.includes('ACTION REQUIRED')) {
    return applyPalette(line, 'statusWarning', tokens);
  }
  if (line.startsWith('Rule:')) {
    return applyPalette(line, 'rule', tokens);
  }
  if (line.startsWith('Goal:')) {
    return applyPalette(line, 'goal', tokens);
  }
  if (line.startsWith('● CRITICAL')) {
    return applyPalette(line, 'critical', tokens);
  }
  if (line.startsWith('● HIGH')) {
    return applyPalette(line, 'high', tokens);
  }
  if (line.startsWith('● MEDIUM')) {
    return applyPalette(line, 'medium', tokens);
  }
  if (line.startsWith('● LOW')) {
    return applyPalette(line, 'low', tokens);
  }
  if (line.startsWith('Pipeline') || line.startsWith('Outputs') || line.startsWith('Top violations:')) {
    return applyPalette(line, 'muted', tokens);
  }
  return line;
};

const wrapLine = (line: string, width: number): string[] => {
  if (visibleLength(line) <= width) {
    return [line];
  }
  const leadingWhitespace = line.match(/^\s*/)?.[0] ?? '';
  const words = line.trim().split(/\s+/);
  if (words.length <= 1) {
    const chunks: string[] = [];
    let index = 0;
    while (index < line.length) {
      chunks.push(line.slice(index, index + width));
      index += width;
    }
    return chunks;
  }

  const wrapped: string[] = [];
  let current = leadingWhitespace;
  for (const word of words) {
    const candidate = current.trim().length === 0
      ? `${leadingWhitespace}${word}`
      : `${current} ${word}`;
    if (visibleLength(candidate) <= width) {
      current = candidate;
      continue;
    }
    if (current.trim().length > 0) {
      wrapped.push(current);
    }
    current = `${leadingWhitespace}${word}`;
  }
  if (current.trim().length > 0) {
    wrapped.push(current);
  }
  return wrapped.length > 0 ? wrapped : [''];
};

const renderPanel = (
  lines: ReadonlyArray<string>,
  options?: { width?: number; color?: boolean }
): string => {
  const tokens = buildLegacyMenuDesignTokens(options);
  const wrappedLines = lines.flatMap((line) =>
    wrapLine(tokens.asciiMode ? toAsciiLine(line) : line, tokens.panelInnerWidth)
  );
  const border = (value: string): string => color(value, tokens.palette.border, tokens.colorEnabled);
  const top = border(
    `${tokens.border.topLeft}${tokens.border.horizontal.repeat(tokens.panelInnerWidth + 2)}${tokens.border.topRight}`
  );
  const bottom = border(
    `${tokens.border.bottomLeft}${tokens.border.horizontal.repeat(tokens.panelInnerWidth + 2)}${tokens.border.bottomRight}`
  );
  const body = wrappedLines
    .map((line) => {
      const content = padRight(styleLegacyLine(line, tokens), tokens.panelInnerWidth);
      return `${border(tokens.border.vertical)} ${content} ${border(tokens.border.vertical)}`;
    })
    .join('\n');
  return [top, body, bottom].join('\n');
};

export const resolveLegacyPanelOuterWidth = (requested?: number): number =>
  resolvePanelOuterWidth(requested);

export const renderLegacyPanel = (
  lines: ReadonlyArray<string>,
  options?: { width?: number; color?: boolean }
): string => renderPanel(lines, options);

const codeHealthLabel = (score: number): string => {
  if (score >= 80) {
    return 'Good';
  }
  if (score >= 60) {
    return 'Moderate';
  }
  return 'Needs attention';
};

export const formatLegacyPatternChecks = (summary: LegacyAuditSummary): string => {
  return [
    '1) PATTERN CHECKS',
    `• TODO / FIXME: ${summary.patternChecks.todoFixme}`,
    `• CONSOLE_LOG: ${summary.patternChecks.consoleLog}`,
    `• ANY_TYPE: ${summary.patternChecks.anyType}`,
    `• SQL_RAW: ${summary.patternChecks.sqlRaw}`,
  ].join('\n');
};

export const formatLegacyEslintAudit = (summary: LegacyAuditSummary): string => {
  return [
    '2) ESLINT AUDIT RESULTS',
    `ESLint: errors=${summary.eslint.errors} warnings=${summary.eslint.warnings}`,
  ].join('\n');
};

export const formatLegacyAstBreakdown = (summary: LegacyAuditSummary): string => {
  const platformText = summary.platforms.length === 0
    ? 'No platform findings.'
    : summary.platforms.map((platform) => formatPlatformBlock(platform)).join('\n\n');
  return [
    '3) AST INTELLIGENCE — SEVERITY BREAKDOWN',
    platformText,
  ].join('\n\n');
};

export const formatLegacyRulesetBreakdown = (summary: LegacyAuditSummary): string => {
  const lines = ['4) RULESET COVERAGE'];
  if (summary.rulesets.length === 0) {
    lines.push('• No ruleset findings.');
    return lines.join('\n');
  }

  for (const ruleset of summary.rulesets) {
    lines.push(
      `• ${ruleset.bundle}: ${ruleset.findings} findings (C:${ruleset.bySeverity.CRITICAL} H:${ruleset.bySeverity.HIGH} M:${ruleset.bySeverity.MEDIUM} L:${ruleset.bySeverity.LOW})`
    );
  }
  return lines.join('\n');
};

export const formatLegacyFileDiagnostics = (summary: LegacyAuditSummary): string => {
  const topFileLocations = summary.topFileLocations ?? [];
  const topFindings = summary.topFindings ?? [];
  const topFileLineByPath = new Map(topFileLocations.map((entry) => [entry.file, entry.line]));
  const lines = [
    'FILE DIAGNOSTICS — TOP VIOLATED FILES',
  ];
  if (summary.topFiles.length === 0) {
    lines.push('• none');
  } else {
    for (const file of summary.topFiles) {
      const line = topFileLineByPath.get(file.file) ?? 1;
      lines.push(`• ${file.file}: ${file.count}`);
      lines.push(`  ↳ ${file.file}:${line}`);
    }
  }
  if (topFindings.length > 0) {
    lines.push('');
    lines.push('VIOLATIONS — CLICKABLE LOCATIONS');
    for (const finding of topFindings) {
      lines.push(`• [${finding.severity}] ${finding.ruleId} -> ${finding.file}:${finding.line}`);
    }
  }
  return lines.join('\n');
};

export const formatLegacyAuditReport = (
  summary: LegacyAuditSummary,
  options?: { panelWidth?: number; color?: boolean }
): string => {
  if (summary.status === 'missing') {
    return 'No .ai_evidence.json found. Run an audit option first.';
  }
  if (summary.status === 'invalid') {
    return '.ai_evidence.json is invalid. Regenerate evidence and retry.';
  }

  const topViolations = summary.topViolations.length === 0
    ? ['• none']
    : summary.topViolations.flatMap((violation) => [
      `• ${violation.ruleId} (${violation.count} violations)`,
      '  → Review and fix violations.',
    ]);
  const topFindings = summary.topFindings ?? [];
  const topFindingLocations = topFindings.length === 0
    ? ['• none']
    : topFindings.map((finding) => (
      `• [${finding.severity}] ${finding.ruleId} → ${finding.file}:${finding.line}`
    ));

  const commitStatus = summary.bySeverity.CRITICAL > 0 || summary.bySeverity.HIGH > 0
    ? 'COMMIT BLOCKED — STRICT REPO+STAGING'
    : 'COMMIT ALLOWED';

  const overviewPanel = renderPanel([
    OVERVIEW_TITLE,
    OVERVIEW_SUBTITLE,
    '',
    '1) Pattern checks',
    '2) ESLint audits',
    '3) AST Intelligence analysis',
    '4) Intelligent Audit Gate (block/allow)',
    '5) Evidence update (.AI_EVIDENCE.json)',
    '',
    'Pipeline',
    'Source files → AST analyzers → violations → severity evaluation → AI Gate verdict',
    '',
    'Outputs',
    '• .audit_tmp/ast-summary.json',
    '• .audit_tmp/ast-summary-enhanced.json',
    '• reports/ (json + text)',
    '• .AI_EVIDENCE.json (ai_gate + metrics)',
    '',
    'Rule: Fail fast, block early',
    'Goal: deterministic governance across iOS / Android / Backend / Frontend',
  ], { width: options?.panelWidth, color: options?.color });

  const quickSummaryPanel = renderPanel([
    'QUICK SUMMARY',
    '',
    `Files scanned: ${summary.filesScanned}`,
    `Files affected: ${summary.filesAffected}`,
    `Total violations: ${summary.totalViolations}`,
    `ESLint errors: ${summary.eslint.errors}`,
    `Critical issues: ${summary.bySeverity.CRITICAL}`,
    `High priority: ${summary.bySeverity.HIGH}`,
    '',
    ...formatStatusLine(summary).split('\n'),
    '',
    ...formatLegacyPatternChecks(summary).split('\n'),
    '',
    ...formatLegacyEslintAudit(summary).split('\n'),
  ], { width: options?.panelWidth, color: options?.color });

  const astPanel = renderPanel(formatLegacyAstBreakdown(summary).split('\n'), {
    width: options?.panelWidth,
    color: options?.color,
  });

  const rulesetPanel = renderPanel(formatLegacyRulesetBreakdown(summary).split('\n'), {
    width: options?.panelWidth,
    color: options?.color,
  });

  const remediationPanel = renderPanel([
    '5) TOP VIOLATIONS & REMEDIATION',
    '',
    ...topViolations,
    '',
    'Clickable locations (file:line)',
    ...topFindingLocations,
    '',
    '6) EXECUTIVE SUMMARY',
  ], { width: options?.panelWidth, color: options?.color });

  const blockedMessage = summary.bySeverity.CRITICAL > 0 || summary.bySeverity.HIGH > 0
    ? 'ACTION REQUIRED: Critical or high-severity issues detected. Please review and fix before proceeding.'
    : 'No blocking violations detected.';
  const actionLine = commitStatus.includes('BLOCKED')
    ? 'Action: clean entire repository before committing.'
    : 'Action: proceed with commit flow.';
  const affectedRatio = summary.filesScanned > 0
    ? Math.round((summary.filesAffected / Math.max(1, summary.filesScanned)) * 100)
    : 0;
  const nextAction = commitStatus.includes('BLOCKED')
    ? 'Next action: fix CRITICAL/HIGH findings and rerun full audit.'
    : summary.bySeverity.MEDIUM > 0 || summary.bySeverity.LOW > 0
      ? 'Next action: schedule MEDIUM/LOW cleanup without blocking delivery.'
      : 'Next action: maintain baseline and continue with regular checks.';

  const metricsPanel = renderPanel([
    'METRICS',
    `Total violations detected: ${summary.totalViolations}`,
    `ESLint errors: ${summary.eslint.errors}`,
    `Critical issues: ${summary.bySeverity.CRITICAL}`,
    `High priority issues: ${summary.bySeverity.HIGH}`,
    `Files scanned: ${summary.filesScanned}`,
    `Affected ratio: ${affectedRatio}%`,
    '',
    `Code Health Score: ${summary.codeHealthScore}% (${codeHealthLabel(summary.codeHealthScore)})`,
    '',
    blockedMessage,
    nextAction,
    '',
    'FINAL SUMMARY — VIOLATIONS BY SEVERITY',
    `● CRITICAL: ${summary.bySeverity.CRITICAL}`,
    `● HIGH: ${summary.bySeverity.HIGH}`,
    `● MEDIUM: ${summary.bySeverity.MEDIUM}`,
    `● LOW: ${summary.bySeverity.LOW}`,
    '',
    commitStatus,
    actionLine,
    `Stage: ${summary.stage} • Outcome: ${summary.outcome}`,
    'Generated by Pumuki — Hook-System',
  ], { width: options?.panelWidth, color: options?.color });

  return [
    overviewPanel,
    quickSummaryPanel,
    astPanel,
    rulesetPanel,
    remediationPanel,
    metricsPanel,
  ].join('\n\n');
};
