import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSnapshotPlatformSummaries } from '../integrations/evidence/platformSummary';
import type {
  GateSeverity,
  LegacyAuditSummary,
  LegacySeverity,
  PlatformName,
  PlatformSummary,
  RulesetSummary,
} from './framework-menu-legacy-audit-types';

type LegacyMetricValue = string | number | boolean | null | Date;
type LegacyMetricRecord = Record<string, LegacyMetricValue>;
type LegacySeverityMetricsPayload = {
  by_severity?: LegacyMetricRecord;
};
type EvidenceRulesetState = {
  bundle?: unknown;
};

type EvidenceFinding = {
  ruleId?: unknown;
  severity?: unknown;
  filePath?: unknown;
  file?: unknown;
  lines?: unknown;
};

type NormalizedFinding = {
  ruleId: string;
  severity: GateSeverity;
  file: string;
  line: number;
};

const EVIDENCE_PATH = '.ai_evidence.json';

const emptyLegacySeverity = (): Record<LegacySeverity, number> => ({
  CRITICAL: 0,
  HIGH: 0,
  MEDIUM: 0,
  LOW: 0,
});

const asString = (value: unknown, fallback: string): string => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
};

const normalizePath = (value: string): string => {
  return value.replace(/\\/g, '/');
};

const normalizeRepoRoot = (repoRoot: string): string => {
  const normalized = normalizePath(repoRoot.trim());
  if (normalized.endsWith('/')) {
    return normalized.slice(0, -1);
  }
  return normalized;
};

const toRepoRelativePath = (params: { repoRoot: string; filePath: string }): string => {
  const candidate = normalizePath(params.filePath).replace(/^\.\//, '');
  if (!candidate.startsWith('/')) {
    return candidate;
  }
  const repoRoot = normalizeRepoRoot(params.repoRoot);
  const repoPrefix = `${repoRoot}/`;
  if (candidate === repoRoot) {
    return '.';
  }
  if (candidate.startsWith(repoPrefix)) {
    const relativePath = candidate.slice(repoPrefix.length);
    return relativePath.length > 0 ? relativePath : '.';
  }
  return candidate;
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

const asPositiveLineNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const line = Math.trunc(value);
    return line > 0 ? line : null;
  }
  if (typeof value === 'string') {
    const matches = value.match(/\d+/g);
    if (!matches || matches.length === 0) {
      return null;
    }
    const numbers = matches
      .map((token) => Number.parseInt(token, 10))
      .filter((line) => Number.isFinite(line) && line > 0);
    if (numbers.length === 0) {
      return null;
    }
    return Math.min(...numbers);
  }
  return null;
};

const normalizeFindingAnchorLine = (lines: unknown): number => {
  if (Array.isArray(lines)) {
    const parsed = lines
      .map((line) => asPositiveLineNumber(line))
      .filter((line): line is number => line !== null);
    if (parsed.length > 0) {
      return Math.min(...parsed);
    }
    return 1;
  }
  return asPositiveLineNumber(lines) ?? 1;
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
        ? current.by_severity as LegacyMetricRecord
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

const toNormalizedFindings = (
  findings: ReadonlyArray<EvidenceFinding>,
  repoRoot: string
): NormalizedFinding[] => {
  return findings.map((finding) => {
    const filePath = toRepoRelativePath({
      repoRoot,
      filePath: asString(finding.filePath, asString(finding.file, 'unknown')),
    });
    const ruleId = asString(finding.ruleId, 'unknown.rule');
    return {
      ruleId,
      severity: normalizeGateSeverity(finding.severity),
      file: filePath,
      line: normalizeFindingAnchorLine(finding.lines),
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
): ReadonlyArray<{ file: string; count: number; line: number }> => {
  const buckets = new Map<string, { count: number; line: number }>();
  for (const finding of findings) {
    const current = buckets.get(finding.file);
    if (!current) {
      buckets.set(finding.file, { count: 1, line: finding.line });
      continue;
    }
    buckets.set(finding.file, {
      count: current.count + 1,
      line: Math.min(current.line, finding.line),
    });
  }
  return [...buckets.entries()]
    .sort((left, right) => right[1].count - left[1].count || left[0].localeCompare(right[0]))
    .map(([file, entry]) => ({ file, count: entry.count, line: entry.line }));
};

const findingSeverityRank = (severity: GateSeverity): number => {
  if (severity === 'CRITICAL') {
    return 0;
  }
  if (severity === 'ERROR') {
    return 1;
  }
  if (severity === 'WARN') {
    return 2;
  }
  return 3;
};

const buildTopFindings = (
  findings: ReadonlyArray<NormalizedFinding>,
  maxItems: number
): ReadonlyArray<{ severity: LegacySeverity; ruleId: string; file: string; line: number }> => {
  return [...findings]
    .sort((left, right) => {
      const severityDelta = findingSeverityRank(left.severity) - findingSeverityRank(right.severity);
      if (severityDelta !== 0) {
        return severityDelta;
      }
      const fileDelta = left.file.localeCompare(right.file);
      if (fileDelta !== 0) {
        return fileDelta;
      }
      if (left.line !== right.line) {
        return left.line - right.line;
      }
      return left.ruleId.localeCompare(right.ruleId);
    })
    .slice(0, maxItems)
    .map((finding) => ({
      severity: mapLegacySeverity(finding.severity),
      ruleId: finding.ruleId,
      file: finding.file,
      line: finding.line,
    }));
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
    ? severityMetrics as LegacySeverityMetricsPayload
    : {} as LegacySeverityMetricsPayload;
  const rawBySeverity = typeof metrics.by_severity === 'object' && metrics.by_severity
    ? metrics.by_severity
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

const emptySummary = (status: 'missing' | 'invalid', stage: string, outcome: string, codeHealthScore: number): LegacyAuditSummary => ({
  status,
  stage,
  outcome,
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
  topFileLocations: [],
  topFindings: [],
  codeHealthScore,
});

export const readLegacyAuditSummary = (repoRoot: string = process.cwd()): LegacyAuditSummary => {
  const evidencePath = join(repoRoot, EVIDENCE_PATH);
  if (!existsSync(evidencePath)) {
    return emptySummary('missing', 'unknown', 'unknown', 100);
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
    const normalizedFindings = toNormalizedFindings(
      asFindings(parsed.snapshot?.findings),
      repoRoot
    );
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
    const topFilesWithLocations = countFiles(normalizedFindings).slice(0, 10);
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
      topFiles: topFilesWithLocations.map((entry) => ({ file: entry.file, count: entry.count })),
      topFileLocations: topFilesWithLocations.map((entry) => ({ file: entry.file, line: entry.line })),
      topFindings: buildTopFindings(normalizedFindings, 10),
      codeHealthScore: computeCodeHealthScore(bySeverity, filesScanned, totalViolations),
    };
  } catch {
    return emptySummary('invalid', 'invalid', 'invalid', 0);
  }
};
