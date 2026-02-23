import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type RawFinding = {
  ruleId?: unknown;
  severity?: unknown;
  file?: unknown;
  filePath?: unknown;
};

type SeverityBucket = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

type FindingRow = {
  ruleId: string;
  platform: 'ios' | 'android' | 'backend' | 'frontend' | 'other';
  severity: SeverityBucket;
};

type ScopeMetadata = {
  stage: string | null;
  filesScanned: number | null;
  repoRoot: string | null;
};

type ScopeMatches = {
  stage: boolean;
  filesScanned: boolean;
  repoRoot: boolean;
};

export type LegacyParityRow = {
  platform: string;
  ruleId: string;
  legacyCount: number;
  enterpriseCount: number;
  dominance: 'PASS' | 'FAIL';
};

export type LegacyParitySeverityRow = {
  severity: SeverityBucket;
  legacyCount: number;
  enterpriseCount: number;
  dominance: 'PASS' | 'FAIL';
};

export type LegacyParityReport = {
  legacyPath: string;
  enterprisePath: string;
  generatedAt: string;
  dominance: 'PASS' | 'FAIL';
  ruleDominance: 'PASS' | 'FAIL';
  totals: {
    comparedRules: number;
    passedRules: number;
    failedRules: number;
    legacyFindings: number;
    enterpriseFindings: number;
  };
  severity: {
    hardBlock: boolean;
    rows: LegacyParitySeverityRow[];
  };
  scope: {
    strict: boolean;
    legacy: ScopeMetadata;
    enterprise: ScopeMetadata;
    matches: ScopeMatches;
  };
  rows: LegacyParityRow[];
};

const SEVERITY_ORDER: ReadonlyArray<SeverityBucket> = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

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

const normalizePayload = (payload: unknown): {
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

const buildRuleCountMap = (rows: ReadonlyArray<FindingRow>): Map<string, number> => {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.platform}::${row.ruleId}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
};

const buildSeverityCountMap = (rows: ReadonlyArray<FindingRow>): Map<SeverityBucket, number> => {
  const map = new Map<SeverityBucket, number>();
  for (const severity of SEVERITY_ORDER) {
    map.set(severity, 0);
  }
  for (const row of rows) {
    map.set(row.severity, (map.get(row.severity) ?? 0) + 1);
  }
  return map;
};

const parseJson = (path: string): unknown => {
  const content = readFileSync(path, 'utf8');
  return JSON.parse(content) as unknown;
};

const buildScopeMatches = (params: {
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

const assertStrictScope = (params: {
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

export const buildLegacyParityReport = (params: {
  legacyPath: string;
  enterprisePath: string;
  strictScope?: boolean;
}): LegacyParityReport => {
  const legacyPath = resolve(params.legacyPath);
  const enterprisePath = resolve(params.enterprisePath);
  const strictScope = params.strictScope ?? true;

  const legacyPayload = normalizePayload(parseJson(legacyPath));
  const enterprisePayload = normalizePayload(parseJson(enterprisePath));
  const scopeMatches = buildScopeMatches({
    legacy: legacyPayload.scope,
    enterprise: enterprisePayload.scope,
  });
  if (strictScope) {
    assertStrictScope({
      legacy: legacyPayload.scope,
      enterprise: enterprisePayload.scope,
      matches: scopeMatches,
    });
  }

  const legacyRows = legacyPayload.rows;
  const enterpriseRows = enterprisePayload.rows;
  const legacyRuleMap = buildRuleCountMap(legacyRows);
  const enterpriseRuleMap = buildRuleCountMap(enterpriseRows);
  const legacySeverityMap = buildSeverityCountMap(legacyRows);
  const enterpriseSeverityMap = buildSeverityCountMap(enterpriseRows);

  const keys = [...legacyRuleMap.keys()].sort((left, right) => left.localeCompare(right));
  const rows: LegacyParityRow[] = keys.map((key) => {
    const [platform, ruleId] = key.split('::');
    const legacyCount = legacyRuleMap.get(key) ?? 0;
    const enterpriseCount = enterpriseRuleMap.get(key) ?? 0;
    return {
      platform: platform ?? 'other',
      ruleId: ruleId ?? 'unknown',
      legacyCount,
      enterpriseCount,
      dominance: enterpriseCount >= legacyCount ? 'PASS' : 'FAIL',
    };
  });
  const failedRules = rows.filter((row) => row.dominance === 'FAIL').length;
  const passedRules = rows.length - failedRules;
  const ruleDominance: LegacyParityReport['ruleDominance'] = failedRules === 0 ? 'PASS' : 'FAIL';

  const severityRows: LegacyParitySeverityRow[] = SEVERITY_ORDER.map((severity) => {
    const legacyCount = legacySeverityMap.get(severity) ?? 0;
    const enterpriseCount = enterpriseSeverityMap.get(severity) ?? 0;
    return {
      severity,
      legacyCount,
      enterpriseCount,
      dominance: enterpriseCount >= legacyCount ? 'PASS' : 'FAIL',
    };
  });
  const severityHardBlock = severityRows.some((row) => row.dominance === 'FAIL');

  return {
    legacyPath,
    enterprisePath,
    generatedAt: new Date().toISOString(),
    dominance: severityHardBlock ? 'FAIL' : 'PASS',
    ruleDominance,
    totals: {
      comparedRules: rows.length,
      passedRules,
      failedRules,
      legacyFindings: legacyRows.length,
      enterpriseFindings: enterpriseRows.length,
    },
    severity: {
      hardBlock: severityHardBlock,
      rows: severityRows,
    },
    scope: {
      strict: strictScope,
      legacy: legacyPayload.scope,
      enterprise: enterprisePayload.scope,
      matches: scopeMatches,
    },
    rows,
  };
};

export const formatLegacyParityReportMarkdown = (report: LegacyParityReport): string => {
  const lines: string[] = [
    '# Legacy Parity Dominance Report',
    '',
    `- generated_at: ${report.generatedAt}`,
    `- legacy_path: ${report.legacyPath}`,
    `- enterprise_path: ${report.enterprisePath}`,
    `- dominance: ${report.dominance}`,
    `- rule_dominance: ${report.ruleDominance}`,
    `- hard_block_by_severity: ${report.severity.hardBlock ? 'YES' : 'NO'}`,
    '',
    '## Scope Validation',
    '',
    `- strict_scope: ${report.scope.strict ? 'ENABLED' : 'DISABLED'}`,
    `- stage_match: ${report.scope.matches.stage ? 'YES' : 'NO'}`,
    `- files_scanned_match: ${report.scope.matches.filesScanned ? 'YES' : 'NO'}`,
    `- repo_root_match: ${report.scope.matches.repoRoot ? 'YES' : 'NO'}`,
    `- legacy_stage: ${report.scope.legacy.stage ?? 'missing'}`,
    `- enterprise_stage: ${report.scope.enterprise.stage ?? 'missing'}`,
    `- legacy_files_scanned: ${report.scope.legacy.filesScanned ?? 'missing'}`,
    `- enterprise_files_scanned: ${report.scope.enterprise.filesScanned ?? 'missing'}`,
    `- legacy_repo_root: ${report.scope.legacy.repoRoot ?? 'missing'}`,
    `- enterprise_repo_root: ${report.scope.enterprise.repoRoot ?? 'missing'}`,
    '',
    '## Severity Matrix',
    '',
    '| severity | legacy | enterprise | dominance |',
    '|---|---:|---:|---|',
  ];
  for (const row of report.severity.rows) {
    lines.push(
      `| ${row.severity} | ${row.legacyCount} | ${row.enterpriseCount} | ${row.dominance} |`
    );
  }
  lines.push(
    '',
    '## Totals',
    '',
    `- compared_rules: ${report.totals.comparedRules}`,
    `- passed_rules: ${report.totals.passedRules}`,
    `- failed_rules: ${report.totals.failedRules}`,
    `- legacy_findings: ${report.totals.legacyFindings}`,
    `- enterprise_findings: ${report.totals.enterpriseFindings}`,
    '',
    '## Rule Matrix',
    '',
    '| platform | rule_id | legacy | enterprise | dominance |',
    '|---|---|---:|---:|---|'
  );

  for (const row of report.rows) {
    lines.push(
      `| ${row.platform} | ${row.ruleId} | ${row.legacyCount} | ${row.enterpriseCount} | ${row.dominance} |`
    );
  }

  return lines.join('\n');
};
