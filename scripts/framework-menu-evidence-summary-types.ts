export type EvidenceSeverity = 'CRITICAL' | 'ERROR' | 'WARN' | 'INFO';
export type EnterpriseEvidenceSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type EvidenceMetricValue = string | number | boolean | null | Date;

export type EvidenceFinding = {
  file?: unknown;
  severity?: unknown;
};

export type EvidenceSnapshot = {
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
  bySeverity: Record<EvidenceSeverity, number>;
  byEnterpriseSeverity?: Record<EnterpriseEvidenceSeverity, number>;
  topFiles: ReadonlyArray<{ file: string; count: number }>;
};
