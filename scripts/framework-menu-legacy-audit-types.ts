export type GateSeverity = 'CRITICAL' | 'ERROR' | 'WARN' | 'INFO';
export type LegacySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type PlatformName = 'iOS' | 'Android' | 'Backend' | 'Frontend' | 'Other';

export type PlatformSummary = {
  platform: PlatformName;
  filesAffected: number;
  bySeverity: Record<LegacySeverity, number>;
  topViolations: ReadonlyArray<{ ruleId: string; count: number }>;
};

export type RulesetSummary = {
  bundle: string;
  findings: number;
  bySeverity: Record<LegacySeverity, number>;
};

export type LegacyMenuPaletteRole =
  | 'title'
  | 'subtitle'
  | 'switch'
  | 'sectionTitle'
  | 'statusWarning'
  | 'rule'
  | 'goal'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'muted'
  | 'border';

export type LegacyMenuDesignTokens = {
  colorEnabled: boolean;
  asciiMode: boolean;
  panelOuterWidth: number;
  panelInnerWidth: number;
  border: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
    horizontal: string;
    vertical: string;
  };
  palette: Record<LegacyMenuPaletteRole, string>;
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
  topFileLocations?: ReadonlyArray<{ file: string; line: number }>;
  topFindings?: ReadonlyArray<{ severity: LegacySeverity; ruleId: string; file: string; line: number }>;
  codeHealthScore: number;
};
