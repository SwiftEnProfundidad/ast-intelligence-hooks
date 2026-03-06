import type { GateSeverity } from './framework-menu-legacy-audit-types';

export type LegacyMetricValue = string | number | boolean | null | Date;
export type LegacyMetricRecord = Record<string, LegacyMetricValue>;

export type LegacySeverityMetricsPayload = {
  by_severity?: LegacyMetricRecord;
};

export type EvidenceRulesetState = {
  bundle?: unknown;
};

export type EvidenceFinding = {
  ruleId?: unknown;
  severity?: unknown;
  filePath?: unknown;
  file?: unknown;
  lines?: unknown;
};

export type LegacyAuditEvidencePayload = {
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

export type NormalizedFinding = {
  ruleId: string;
  severity: GateSeverity;
  file: string;
  line: number;
};
