export type RawFinding = {
  ruleId?: unknown;
  severity?: unknown;
  file?: unknown;
  filePath?: unknown;
};

export type SeverityBucket = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type FindingRow = {
  ruleId: string;
  platform: 'ios' | 'android' | 'backend' | 'frontend' | 'other';
  severity: SeverityBucket;
};

export type ScopeMetadata = {
  stage: string | null;
  filesScanned: number | null;
  repoRoot: string | null;
};

export type ScopeMatches = {
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

export const SEVERITY_ORDER: ReadonlyArray<SeverityBucket> = [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
];
