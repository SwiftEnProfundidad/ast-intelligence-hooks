export type EvidenceSeverity = 'CRITICAL' | 'ERROR' | 'WARN' | 'INFO';
export type EnterpriseEvidenceSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type EvidenceMetricValue = string | number | boolean | null | Date;

export type EvidenceFinding = {
  ruleId?: unknown;
  file?: unknown;
  filePath?: unknown;
  lines?: unknown;
  severity?: unknown;
};

export type EvidenceSnapshot = {
  files_affected?: unknown;
  files_scanned?: unknown;
  filesAffected?: unknown;
  filesScanned?: unknown;
  stage?: unknown;
  outcome?: unknown;
  findings?: unknown;
};

export type EvidenceSeverityMetrics = {
  by_enterprise_severity?: unknown;
};

export type FrameworkMenuEvidenceSummary = {
  status: 'ok' | 'missing' | 'invalid';
  stage: string | null;
  outcome: string | null;
  totalFindings: number;
  filesScanned: number;
  filesAffected: number;
  bySeverity: Record<EvidenceSeverity, number>;
  byEnterpriseSeverity?: Record<EnterpriseEvidenceSeverity, number>;
  topFiles: ReadonlyArray<{ file: string; count: number }>;
  topFileLocations: ReadonlyArray<{ file: string; line: number }>;
  topFindings: ReadonlyArray<{
    severity: EnterpriseEvidenceSeverity;
    ruleId: string;
    file: string;
    line: number;
  }>;
};
