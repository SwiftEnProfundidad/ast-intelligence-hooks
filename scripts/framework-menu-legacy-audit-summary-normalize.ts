import type {
  GateSeverity,
  LegacySeverity,
  PlatformName,
} from './framework-menu-legacy-audit-types';
import type {
  EvidenceFinding,
  EvidenceRulesetState,
  LegacySeverityMetricsPayload,
  NormalizedFinding,
} from './framework-menu-legacy-audit-summary-types';

export const emptyLegacySeverity = (): Record<LegacySeverity, number> => ({
  CRITICAL: 0,
  HIGH: 0,
  MEDIUM: 0,
  LOW: 0,
});

export const asString = (value: unknown, fallback: string): string => {
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

export const normalizeGateSeverity = (value: unknown): GateSeverity => {
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

export const mapLegacySeverity = (severity: GateSeverity): LegacySeverity => {
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

export const asFindings = (value: unknown): EvidenceFinding[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as EvidenceFinding[];
};

export const asRulesets = (value: unknown): EvidenceRulesetState[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as EvidenceRulesetState[];
};

export const asNonNegativeInt = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
};

export const asPlatformName = (value: unknown): PlatformName | null => {
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

export const toNormalizedFindings = (
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

export const computeLegacySeverity = (
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
