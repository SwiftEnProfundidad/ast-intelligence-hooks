import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSnapshotPlatformSummaries } from '../integrations/evidence/platformSummary';

type GateSeverity = 'CRITICAL' | 'ERROR' | 'WARN' | 'INFO';
type LegacySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type PlatformName = 'iOS' | 'Android' | 'Backend' | 'Frontend' | 'Other';
type EvidenceRulesetState = {
  bundle?: unknown;
};

type EvidenceFinding = {
  ruleId?: unknown;
  severity?: unknown;
  filePath?: unknown;
  file?: unknown;
};

type NormalizedFinding = {
  ruleId: string;
  severity: GateSeverity;
  file: string;
};

type PlatformSummary = {
  platform: PlatformName;
  filesAffected: number;
  bySeverity: Record<LegacySeverity, number>;
  topViolations: ReadonlyArray<{ ruleId: string; count: number }>;
};

type RulesetSummary = {
  bundle: string;
  findings: number;
  bySeverity: Record<LegacySeverity, number>;
};

export type LegacyAuditSummary = {
  status: 'ok' | 'missing' | 'invalid';
  stage: string;
  outcome: string;
  totalViolations: number;
  filesScanned: number;
  filesAffected: number;
  bySeverity: Record<LegacySeverity, number>;
  patternChecks: {
    todoFixme: number;
    consoleLog: number;
    anyType: number;
    sqlRaw: number;
  };
  eslint: {
    errors: number;
    warnings: number;
  };
  platforms: ReadonlyArray<PlatformSummary>;
  rulesets: ReadonlyArray<RulesetSummary>;
  topViolations: ReadonlyArray<{ ruleId: string; count: number }>;
  topFiles: ReadonlyArray<{ file: string; count: number }>;
  codeHealthScore: number;
};

const EVIDENCE_PATH = '.ai_evidence.json';
const OVERVIEW_TITLE = 'PUMUKI — Hook-System (run: npx ast-hooks)';
const OVERVIEW_SUBTITLE = 'AST Intelligence System Overview';
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

const emptyLegacySeverity = (): Record<LegacySeverity, number> => ({
  CRITICAL: 0,
  HIGH: 0,
  MEDIUM: 0,
  LOW: 0,
});

const asString = (value: unknown, fallback: string): string => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
};

const normalizeGateSeverity = (value: unknown): GateSeverity => {
  const normalized = asString(value, 'INFO').toUpperCase();
  if (normalized === 'CRITICAL') {
    return 'CRITICAL';
  }
  if (normalized === 'ERROR') {
    return 'ERROR';
  }
  if (normalized === 'WARN' || normalized === 'WARNING') {
    return 'WARN';
  }
  return 'INFO';
};

const mapLegacySeverity = (severity: GateSeverity): LegacySeverity => {
  if (severity === 'CRITICAL') {
    return 'CRITICAL';
  }
  if (severity === 'ERROR') {
    return 'HIGH';
  }
  if (severity === 'WARN') {
    return 'MEDIUM';
  }
  return 'LOW';
};

const asFindings = (value: unknown): EvidenceFinding[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as EvidenceFinding[];
};

const asRulesets = (value: unknown): EvidenceRulesetState[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as EvidenceRulesetState[];
};

const asNonNegativeInt = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
};

const asPlatformName = (value: unknown): PlatformName | null => {
  if (
    value === 'iOS'
    || value === 'Android'
    || value === 'Backend'
    || value === 'Frontend'
    || value === 'Other'
  ) {
    return value;
  }
  return null;
};

const parseSnapshotPlatformSummaries = (value: unknown): PlatformSummary[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const order: ReadonlyArray<PlatformName> = ['iOS', 'Android', 'Backend', 'Frontend', 'Other'];
  const byPlatform = new Map<PlatformName, PlatformSummary>();
  for (const platform of order) {
    byPlatform.set(platform, {
      platform,
      filesAffected: 0,
      bySeverity: emptyLegacySeverity(),
      topViolations: [],
    });
  }

  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) {
      continue;
    }
    const current = entry as {
      platform?: unknown;
      files_affected?: unknown;
      by_severity?: unknown;
      top_violations?: unknown;
    };
    const platform = asPlatformName(current.platform);
    if (!platform) {
      continue;
    }
    const bySeverityRaw =
      typeof current.by_severity === 'object' && current.by_severity !== null
        ? current.by_severity as Record<string, unknown>
        : {};
    const topViolations = Array.isArray(current.top_violations)
      ? current.top_violations
        .map((item) => {
          if (typeof item !== 'object' || item === null) {
            return null;
          }
          const row = item as { rule_id?: unknown; count?: unknown };
          const ruleId = typeof row.rule_id === 'string' ? row.rule_id : '';
          if (ruleId.length === 0) {
            return null;
          }
          return {
            ruleId,
            count: asNonNegativeInt(row.count),
          };
        })
        .filter((item): item is { ruleId: string; count: number } => item !== null)
      : [];
    byPlatform.set(platform, {
      platform,
      filesAffected: asNonNegativeInt(current.files_affected),
      bySeverity: {
        CRITICAL: asNonNegativeInt(bySeverityRaw.CRITICAL),
        HIGH: asNonNegativeInt(bySeverityRaw.HIGH),
        MEDIUM: asNonNegativeInt(bySeverityRaw.MEDIUM),
        LOW: asNonNegativeInt(bySeverityRaw.LOW),
      },
      topViolations,
    });
  }

  return order.map((platform) => byPlatform.get(platform) ?? {
    platform,
    filesAffected: 0,
    bySeverity: emptyLegacySeverity(),
    topViolations: [],
  });
};

const toNormalizedFindings = (findings: ReadonlyArray<EvidenceFinding>): NormalizedFinding[] => {
  return findings.map((finding) => {
    const filePath = asString(finding.filePath, asString(finding.file, 'unknown')).replace(/\\/g, '/');
    const ruleId = asString(finding.ruleId, 'unknown.rule');
    return {
      ruleId,
      severity: normalizeGateSeverity(finding.severity),
      file: filePath,
    };
  });
};

const countViolations = (findings: ReadonlyArray<NormalizedFinding>): ReadonlyArray<{ ruleId: string; count: number }> => {
  const buckets = new Map<string, number>();
  for (const finding of findings) {
    buckets.set(finding.ruleId, (buckets.get(finding.ruleId) ?? 0) + 1);
  }
  return [...buckets.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([ruleId, count]) => ({ ruleId, count }));
};

const countFiles = (
  findings: ReadonlyArray<NormalizedFinding>
): ReadonlyArray<{ file: string; count: number }> => {
  const buckets = new Map<string, number>();
  for (const finding of findings) {
    buckets.set(finding.file, (buckets.get(finding.file) ?? 0) + 1);
  }
  return [...buckets.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([file, count]) => ({ file, count }));
};

const inferRulesetBundle = (
  ruleId: string,
  availableBundles: ReadonlyArray<string>
): string => {
  const findBundle = (predicate: (bundle: string) => boolean): string | null => {
    const match = availableBundles.find(predicate);
    return typeof match === 'string' && match.length > 0 ? match : null;
  };

  const normalized = ruleId.toLowerCase();
  if (normalized.startsWith('heuristics.')) {
    return findBundle((bundle) => bundle.startsWith('astHeuristicsRuleSet@'))
      ?? 'astHeuristicsRuleSet (inferred)';
  }
  if (normalized.startsWith('ios.')) {
    return findBundle((bundle) => bundle.startsWith('iosEnterpriseRuleSet@'))
      ?? 'iosEnterpriseRuleSet (inferred)';
  }
  if (normalized.startsWith('android.')) {
    return findBundle((bundle) => bundle.startsWith('androidRuleSet@'))
      ?? 'androidRuleSet (inferred)';
  }
  if (normalized.startsWith('backend.')) {
    return findBundle((bundle) => bundle.startsWith('backendRuleSet@'))
      ?? 'backendRuleSet (inferred)';
  }
  if (normalized.startsWith('frontend.')) {
    return findBundle((bundle) => bundle.startsWith('frontendRuleSet@'))
      ?? 'frontendRuleSet (inferred)';
  }
  if (normalized.startsWith('skills.ios.')) {
    return findBundle((bundle) => bundle.startsWith('ios-') && bundle.includes('guidelines@'))
      ?? 'ios-guidelines (inferred)';
  }
  if (normalized.startsWith('skills.android.')) {
    return findBundle((bundle) => bundle.startsWith('android-guidelines@'))
      ?? 'android-guidelines (inferred)';
  }
  if (normalized.startsWith('skills.backend.')) {
    return findBundle((bundle) => bundle.startsWith('backend-guidelines@'))
      ?? 'backend-guidelines (inferred)';
  }
  if (normalized.startsWith('skills.frontend.')) {
    return findBundle((bundle) => bundle.startsWith('frontend-guidelines@'))
      ?? 'frontend-guidelines (inferred)';
  }
  if (normalized.startsWith('methodology.') || normalized.startsWith('project.')) {
    return findBundle((bundle) => bundle === 'project-rules') ?? 'project-rules (inferred)';
  }
  return 'unknown-ruleset';
};

const buildRulesetSummaries = (
  findings: ReadonlyArray<NormalizedFinding>,
  availableBundles: ReadonlyArray<string>
): ReadonlyArray<RulesetSummary> => {
  const bucket = new Map<string, { findings: number; bySeverity: Record<LegacySeverity, number> }>();
  for (const finding of findings) {
    const bundle = inferRulesetBundle(finding.ruleId, availableBundles);
    const current = bucket.get(bundle) ?? {
      findings: 0,
      bySeverity: emptyLegacySeverity(),
    };
    current.findings += 1;
    current.bySeverity[mapLegacySeverity(finding.severity)] += 1;
    bucket.set(bundle, current);
  }
  return [...bucket.entries()]
    .sort((left, right) => right[1].findings - left[1].findings || left[0].localeCompare(right[0]))
    .map(([bundle, entry]) => ({
      bundle,
      findings: entry.findings,
      bySeverity: entry.bySeverity,
    }));
};

const buildPlatformSummaries = (findings: ReadonlyArray<NormalizedFinding>): ReadonlyArray<PlatformSummary> => {
  return buildSnapshotPlatformSummaries(
    findings.map((finding) => ({
      ruleId: finding.ruleId,
      severity: finding.severity,
      file: finding.file,
    }))
  ).map((platform) => ({
    platform: platform.platform,
    filesAffected: platform.files_affected,
    bySeverity: platform.by_severity,
    topViolations: platform.top_violations
      .map((violation) => ({ ruleId: violation.rule_id, count: violation.count }))
      .slice(0, 5),
  }));
};

const computePatternChecks = (findings: ReadonlyArray<NormalizedFinding>) => {
  const contains = (needle: string, finding: NormalizedFinding): boolean =>
    finding.ruleId.toLowerCase().includes(needle);

  return {
    todoFixme: findings.filter((finding) => contains('todo', finding) || contains('fixme', finding)).length,
    consoleLog: findings.filter((finding) => contains('console', finding)).length,
    anyType: findings.filter((finding) => contains('any', finding)).length,
    sqlRaw: findings.filter((finding) => contains('sql', finding)).length,
  };
};

const computeEslintCounts = (findings: ReadonlyArray<NormalizedFinding>) => {
  const eslintFindings = findings.filter((finding) =>
    finding.ruleId.toLowerCase().startsWith('eslint.')
    || finding.ruleId.toLowerCase().includes('.eslint.')
  );
  return {
    errors: eslintFindings.filter((finding) => finding.severity === 'CRITICAL' || finding.severity === 'ERROR').length,
    warnings: eslintFindings.filter((finding) => finding.severity === 'WARN' || finding.severity === 'INFO').length,
  };
};

const computeCodeHealthScore = (
  severity: Record<LegacySeverity, number>,
  filesScanned: number,
  totalViolations: number
): number => {
  const safeFilesScanned = Math.max(1, Math.trunc(filesScanned));
  const weightedSeverity = (
    (severity.CRITICAL * 20) +
    (severity.HIGH * 10) +
    (severity.MEDIUM * 3) +
    severity.LOW
  );
  const severityPenalty = Math.min(100, Math.log10(1 + weightedSeverity) * 22);
  const densityPenalty = Math.min(
    100,
    ((weightedSeverity / safeFilesScanned) * 35) +
      ((totalViolations / safeFilesScanned) * 35)
  );
  const penalty = Math.max(severityPenalty, densityPenalty);
  return Math.max(0, Math.round(100 - penalty));
};

const computeLegacySeverity = (
  findings: ReadonlyArray<NormalizedFinding>,
  severityMetrics: unknown
): Record<LegacySeverity, number> => {
  const metrics = typeof severityMetrics === 'object' && severityMetrics
    ? severityMetrics as Record<string, unknown>
    : {};
  const rawBySeverity = typeof metrics.by_severity === 'object' && metrics.by_severity
    ? metrics.by_severity as Record<string, unknown>
    : {};
  const critical = Number(rawBySeverity.CRITICAL ?? 0);
  const high = Number(rawBySeverity.ERROR ?? 0);
  const medium = Number(rawBySeverity.WARN ?? 0);
  const low = Number(rawBySeverity.INFO ?? 0);
  if (Number.isFinite(critical + high + medium + low) && (critical + high + medium + low) > 0) {
    return {
      CRITICAL: Math.max(0, critical),
      HIGH: Math.max(0, high),
      MEDIUM: Math.max(0, medium),
      LOW: Math.max(0, low),
    };
  }

  const fallback = emptyLegacySeverity();
  for (const finding of findings) {
    fallback[mapLegacySeverity(finding.severity)] += 1;
  }
  return fallback;
};

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
    return clamp(Math.trunc(forcedWidth), 56, 100);
  }
  const ttyColumns = Number(process.stdout.columns ?? 0);
  const fallback = 88;
  const source = Number.isFinite(requested ?? NaN) && (requested ?? 0) > 0
    ? Number(requested)
    : (ttyColumns > 0 ? ttyColumns : fallback);
  return clamp(source - 8, 56, 100);
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

const styleLegacyLine = (line: string, enabled: boolean): string => {
  if (!enabled || line.length === 0) {
    return line;
  }
  if (line.startsWith('PUMUKI — Hook-System')) {
    return color(line, '96;1', true);
  }
  if (line === OVERVIEW_SUBTITLE) {
    return color(line, '92;1', true);
  }
  if (line.startsWith('A. Switch')) {
    return color(line, '90', true);
  }
  if (line === 'QUICK SUMMARY' || line === 'METRICS' || line.startsWith('FINAL SUMMARY')) {
    return color(line, '96;1', true);
  }
  if (/^(\d\)|5\)|6\))\s/.test(line)) {
    return color(line, '96;1', true);
  }
  if (line.includes('ACTION REQUIRED')) {
    return color(line, '93;1', true);
  }
  if (line.startsWith('Rule:')) {
    return color(line, '93', true);
  }
  if (line.startsWith('Goal:')) {
    return color(line, '92', true);
  }
  if (line.startsWith('● CRITICAL')) {
    return color(line, '91', true);
  }
  if (line.startsWith('● HIGH')) {
    return color(line, '93', true);
  }
  if (line.startsWith('● MEDIUM')) {
    return color(line, '33', true);
  }
  if (line.startsWith('● LOW')) {
    return color(line, '94', true);
  }
  if (line.startsWith('Pipeline') || line.startsWith('Outputs') || line.startsWith('Top violations:')) {
    return color(line, '90', true);
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
  const outerWidth = resolvePanelOuterWidth(options?.width);
  const innerWidth = outerWidth - 4;
  const colorEnabled = useColor(options?.color);
  const wrappedLines = lines.flatMap((line) => wrapLine(line, innerWidth));
  const border = (value: string): string => color(value, '94', colorEnabled);
  const top = border(`╭${'─'.repeat(innerWidth + 2)}╮`);
  const bottom = border(`╰${'─'.repeat(innerWidth + 2)}╯`);
  const body = wrappedLines
    .map((line) => {
      const content = padRight(styleLegacyLine(line, colorEnabled), innerWidth);
      return `${border('│')} ${content} ${border('│')}`;
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

export const readLegacyAuditSummary = (repoRoot: string = process.cwd()): LegacyAuditSummary => {
  const evidencePath = join(repoRoot, EVIDENCE_PATH);
  if (!existsSync(evidencePath)) {
    return {
      status: 'missing',
      stage: 'unknown',
      outcome: 'unknown',
      totalViolations: 0,
      filesScanned: 0,
      filesAffected: 0,
      bySeverity: emptyLegacySeverity(),
      patternChecks: { todoFixme: 0, consoleLog: 0, anyType: 0, sqlRaw: 0 },
      eslint: { errors: 0, warnings: 0 },
      platforms: [],
      rulesets: [],
      topViolations: [],
      topFiles: [],
      codeHealthScore: 100,
    };
  }

  try {
    const parsed = JSON.parse(readFileSync(evidencePath, 'utf8')) as {
      snapshot?: {
        stage?: unknown;
        outcome?: unknown;
        findings?: unknown;
        platforms?: unknown;
        files_scanned?: unknown;
        files_affected?: unknown;
        filesScanned?: unknown;
        filesAffected?: unknown;
      };
      rulesets?: unknown;
      severity_metrics?: unknown;
    };
    const normalizedFindings = toNormalizedFindings(asFindings(parsed.snapshot?.findings));
    const availableBundles = asRulesets(parsed.rulesets)
      .map((ruleset) => asString(ruleset.bundle, ''))
      .filter((bundle) => bundle.length > 0);
    const files = new Set(normalizedFindings.map((finding) => finding.file));
    const declaredFilesScanned = Number(parsed.snapshot?.files_scanned ?? parsed.snapshot?.filesScanned);
    const filesScanned = Number.isFinite(declaredFilesScanned)
      ? Math.max(0, Math.trunc(declaredFilesScanned))
      : files.size;
    const declaredFilesAffected = Number(
      parsed.snapshot?.files_affected ?? parsed.snapshot?.filesAffected
    );
    const filesAffected = Number.isFinite(declaredFilesAffected)
      ? Math.max(0, Math.trunc(declaredFilesAffected))
      : files.size;
    const bySeverity = computeLegacySeverity(normalizedFindings, parsed.severity_metrics);
    const totalViolations = normalizedFindings.length;
    const snapshotPlatforms = parseSnapshotPlatformSummaries(parsed.snapshot?.platforms);
    return {
      status: 'ok',
      stage: asString(parsed.snapshot?.stage, 'unknown'),
      outcome: asString(parsed.snapshot?.outcome, 'unknown'),
      totalViolations,
      filesScanned,
      filesAffected,
      bySeverity,
      patternChecks: computePatternChecks(normalizedFindings),
      eslint: computeEslintCounts(normalizedFindings),
      platforms: snapshotPlatforms.length > 0
        ? snapshotPlatforms
        : buildPlatformSummaries(normalizedFindings),
      rulesets: buildRulesetSummaries(normalizedFindings, availableBundles),
      topViolations: countViolations(normalizedFindings).slice(0, 7),
      topFiles: countFiles(normalizedFindings).slice(0, 10),
      codeHealthScore: computeCodeHealthScore(bySeverity, filesScanned, totalViolations),
    };
  } catch {
    return {
      status: 'invalid',
      stage: 'invalid',
      outcome: 'invalid',
      totalViolations: 0,
      filesScanned: 0,
      filesAffected: 0,
      bySeverity: emptyLegacySeverity(),
      patternChecks: { todoFixme: 0, consoleLog: 0, anyType: 0, sqlRaw: 0 },
      eslint: { errors: 0, warnings: 0 },
      platforms: [],
      rulesets: [],
      topViolations: [],
      topFiles: [],
      codeHealthScore: 0,
    };
  }
};

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
  const lines = [
    'FILE DIAGNOSTICS — TOP VIOLATED FILES',
  ];
  if (summary.topFiles.length === 0) {
    lines.push('• none');
  } else {
    for (const file of summary.topFiles) {
      lines.push(`• ${file.file}: ${file.count}`);
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
    '6) EXECUTIVE SUMMARY',
  ], { width: options?.panelWidth, color: options?.color });

  const blockedMessage = summary.bySeverity.CRITICAL > 0 || summary.bySeverity.HIGH > 0
    ? 'ACTION REQUIRED: Critical or high-severity issues detected. Please review and fix before proceeding.'
    : 'No blocking violations detected.';
  const actionLine = commitStatus.includes('BLOCKED')
    ? 'Action: clean entire repository before committing.'
    : 'Action: proceed with commit flow.';

  const metricsPanel = renderPanel([
    'METRICS',
    `Total violations detected: ${summary.totalViolations}`,
    `ESLint errors: ${summary.eslint.errors}`,
    `Critical issues: ${summary.bySeverity.CRITICAL}`,
    `High priority issues: ${summary.bySeverity.HIGH}`,
    `Files scanned: ${summary.filesScanned}`,
    '',
    `Code Health Score: ${summary.codeHealthScore}% (${codeHealthLabel(summary.codeHealthScore)})`,
    '',
    blockedMessage,
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
  const markdown = `# PUMUKI Audit Report\n\n\`\`\`text\n${report}\n\`\`\`\n`;
  writeFileSync(outputPath, markdown, 'utf8');
  return outputPath;
};
