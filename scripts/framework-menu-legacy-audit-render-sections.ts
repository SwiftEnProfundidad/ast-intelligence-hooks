import type {
  LegacyAuditSummary,
  PlatformSummary,
} from './framework-menu-legacy-audit-types';

export const formatLegacyStatusLine = (summary: LegacyAuditSummary): string => {
  return [
    'ℹ READ-ONLY SNAPSHOT',
    `Evidence stage/outcome: ${summary.stage} / ${summary.outcome}`,
    'Canonical verdict: use pumuki status --json or doctor --deep --json',
  ].join('\n');
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
  const lines = ['FILE DIAGNOSTICS — TOP VIOLATED FILES'];
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
