import { readFileSync } from 'node:fs';
import {
  SEVERITY_ORDER,
  type FindingRow,
  type RawFinding,
  type ScopeMatches,
  type ScopeMetadata,
  type SeverityBucket,
} from './legacy-parity-report-types';

const asString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const asNullableNumber = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  if (value < 0) {
    return null;
  }
  return value;
};

const asFindings = (value: unknown): RawFinding[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as RawFinding[];
};

const detectPlatformFromPath = (path: string): FindingRow['platform'] => {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  if (normalized.endsWith('.swift') || /(^|\/)(ios)(\/|$)/.test(normalized)) {
    return 'ios';
  }
  if (
    normalized.endsWith('.kt')
    || normalized.endsWith('.kts')
    || /(^|\/)(android)(\/|$)/.test(normalized)
  ) {
    return 'android';
  }
  if (
    /(^|\/)(backend|server|api)(\/|$)/.test(normalized)
    && !/(^|\/)(frontend|web|client)(\/|$)/.test(normalized)
  ) {
    return 'backend';
  }
  if (
    normalized.endsWith('.tsx')
    || normalized.endsWith('.jsx')
    || /(^|\/)(frontend|web|client)(\/|$)/.test(normalized)
  ) {
    return 'frontend';
  }
  return 'other';
};

const normalizePath = (value: string): string => value.replace(/\\/g, '/').toLowerCase();

const normalizeSeverity = (value: unknown): SeverityBucket => {
  const severity = asString(value).toUpperCase();
  if (severity === 'CRITICAL') {
    return 'CRITICAL';
  }
  if (severity === 'HIGH' || severity === 'ERROR') {
    return 'HIGH';
  }
  if (severity === 'MEDIUM' || severity === 'WARN') {
    return 'MEDIUM';
  }
  return 'LOW';
};

export const normalizeLegacyParityPayload = (payload: unknown): {
  rows: FindingRow[];
  scope: ScopeMetadata;
} => {
  if (typeof payload !== 'object' || payload === null) {
    return {
      rows: [],
      scope: {
        stage: null,
        filesScanned: null,
        repoRoot: null,
      },
    };
  }
  const root = payload as {
    snapshot?: {
      findings?: unknown;
      stage?: unknown;
      files_scanned?: unknown;
    };
    findings?: unknown;
    repo_state?: {
      repo_root?: unknown;
    };
  };
  const findings = asFindings(root.snapshot?.findings ?? root.findings ?? []);
  const rows = findings
    .map((finding): FindingRow | null => {
      const ruleId = asString(finding.ruleId);
      if (ruleId.length === 0) {
        return null;
      }
      const file = asString(finding.filePath) || asString(finding.file);
      return {
        ruleId,
        platform: detectPlatformFromPath(file),
        severity: normalizeSeverity(finding.severity),
      };
    })
    .filter((row): row is FindingRow => row !== null);
  return {
    rows,
    scope: {
      stage: asString(root.snapshot?.stage) || null,
      filesScanned: asNullableNumber(root.snapshot?.files_scanned),
      repoRoot: asString(root.repo_state?.repo_root) || null,
    },
  };
};

export const buildLegacyParityScopeMatches = (params: {
  legacy: ScopeMetadata;
  enterprise: ScopeMetadata;
}): ScopeMatches => {
  const stageMatch =
    params.legacy.stage !== null
    && params.enterprise.stage !== null
    && params.legacy.stage === params.enterprise.stage;
  const filesScannedMatch =
    params.legacy.filesScanned !== null
    && params.enterprise.filesScanned !== null
    && params.legacy.filesScanned === params.enterprise.filesScanned;
  const repoRootMatch =
    params.legacy.repoRoot !== null
    && params.enterprise.repoRoot !== null
    && normalizePath(params.legacy.repoRoot) === normalizePath(params.enterprise.repoRoot);
  return {
    stage: stageMatch,
    filesScanned: filesScannedMatch,
    repoRoot: repoRootMatch,
  };
};

export const assertLegacyParityStrictScope = (params: {
  legacy: ScopeMetadata;
  enterprise: ScopeMetadata;
  matches: ScopeMatches;
}): void => {
  const reasons: string[] = [];
  if (!params.matches.stage) {
    reasons.push(
      `stage mismatch (legacy=${params.legacy.stage ?? 'missing'} enterprise=${params.enterprise.stage ?? 'missing'})`
    );
  }
  if (!params.matches.filesScanned) {
    reasons.push(
      `files_scanned mismatch (legacy=${params.legacy.filesScanned ?? 'missing'} enterprise=${params.enterprise.filesScanned ?? 'missing'})`
    );
  }
  if (!params.matches.repoRoot) {
    reasons.push(
      `repo_root mismatch (legacy=${params.legacy.repoRoot ?? 'missing'} enterprise=${params.enterprise.repoRoot ?? 'missing'})`
    );
  }
  if (reasons.length > 0) {
    throw new Error(`Scope mismatch: ${reasons.join('; ')}`);
  }
};

export const buildLegacyParityRuleCountMap = (
  rows: ReadonlyArray<FindingRow>
): Map<string, number> => {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.platform}::${row.ruleId}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
};

export const buildLegacyParitySeverityCountMap = (
  rows: ReadonlyArray<FindingRow>
): Map<SeverityBucket, number> => {
  const map = new Map<SeverityBucket, number>();
  for (const severity of SEVERITY_ORDER) {
    map.set(severity, 0);
  }
  for (const row of rows) {
    map.set(row.severity, (map.get(row.severity) ?? 0) + 1);
  }
  return map;
};

export const parseLegacyParityJson = (path: string): unknown => {
  const content = readFileSync(path, 'utf8');
  return JSON.parse(content) as unknown;
};
