import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type RawFinding = {
  ruleId?: unknown;
  severity?: unknown;
  file?: unknown;
  filePath?: unknown;
};

type FindingRow = {
  ruleId: string;
  platform: 'ios' | 'android' | 'backend' | 'frontend' | 'other';
};

export type LegacyParityRow = {
  platform: string;
  ruleId: string;
  legacyCount: number;
  enterpriseCount: number;
  dominance: 'PASS' | 'FAIL';
};

export type LegacyParityReport = {
  legacyPath: string;
  enterprisePath: string;
  generatedAt: string;
  dominance: 'PASS' | 'FAIL';
  totals: {
    comparedRules: number;
    passedRules: number;
    failedRules: number;
    legacyFindings: number;
    enterpriseFindings: number;
  };
  rows: LegacyParityRow[];
};

const asString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
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
  if (normalized.endsWith('.kt') || normalized.endsWith('.kts') || /(^|\/)(android)(\/|$)/.test(normalized)) {
    return 'android';
  }
  if (
    /(^|\/)(backend|server|api)(\/|$)/.test(normalized) &&
    !/(^|\/)(frontend|web|client)(\/|$)/.test(normalized)
  ) {
    return 'backend';
  }
  if (
    normalized.endsWith('.tsx') ||
    normalized.endsWith('.jsx') ||
    /(^|\/)(frontend|web|client)(\/|$)/.test(normalized)
  ) {
    return 'frontend';
  }
  return 'other';
};

const normalizeFindings = (payload: unknown): FindingRow[] => {
  if (typeof payload !== 'object' || payload === null) {
    return [];
  }
  const root = payload as {
    snapshot?: { findings?: unknown };
    findings?: unknown;
  };
  const findings = asFindings(root.snapshot?.findings ?? root.findings ?? []);
  return findings
    .map((finding): FindingRow | null => {
      const ruleId = asString(finding.ruleId);
      if (ruleId.length === 0) {
        return null;
      }
      const file = asString(finding.filePath) || asString(finding.file);
      return {
        ruleId,
        platform: detectPlatformFromPath(file),
      };
    })
    .filter((row): row is FindingRow => row !== null);
};

const buildCountMap = (rows: ReadonlyArray<FindingRow>): Map<string, number> => {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.platform}::${row.ruleId}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
};

const parseJson = (path: string): unknown => {
  const content = readFileSync(path, 'utf8');
  return JSON.parse(content) as unknown;
};

export const buildLegacyParityReport = (params: {
  legacyPath: string;
  enterprisePath: string;
}): LegacyParityReport => {
  const legacyPath = resolve(params.legacyPath);
  const enterprisePath = resolve(params.enterprisePath);

  const legacyRows = normalizeFindings(parseJson(legacyPath));
  const enterpriseRows = normalizeFindings(parseJson(enterprisePath));
  const legacyMap = buildCountMap(legacyRows);
  const enterpriseMap = buildCountMap(enterpriseRows);

  const keys = [...legacyMap.keys()].sort((left, right) => left.localeCompare(right));
  const rows: LegacyParityRow[] = keys.map((key) => {
    const [platform, ruleId] = key.split('::');
    const legacyCount = legacyMap.get(key) ?? 0;
    const enterpriseCount = enterpriseMap.get(key) ?? 0;
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

  return {
    legacyPath,
    enterprisePath,
    generatedAt: new Date().toISOString(),
    dominance: failedRules === 0 ? 'PASS' : 'FAIL',
    totals: {
      comparedRules: rows.length,
      passedRules,
      failedRules,
      legacyFindings: legacyRows.length,
      enterpriseFindings: enterpriseRows.length,
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
    '|---|---|---:|---:|---|',
  ];

  for (const row of report.rows) {
    lines.push(
      `| ${row.platform} | ${row.ruleId} | ${row.legacyCount} | ${row.enterpriseCount} | ${row.dominance} |`
    );
  }

  return lines.join('\n');
};
