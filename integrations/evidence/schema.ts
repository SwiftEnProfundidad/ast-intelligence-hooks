import type { GateOutcome } from '../../core/gate/GateOutcome';
import type { GateStage } from '../../core/gate/GateStage';
import type { Severity } from '../../core/rules/Severity';

export type EvidenceLines = string | number | readonly number[];

export type SnapshotFinding = {
  ruleId: string;
  severity: Severity;
  code: string;
  message: string;
  file: string;
  lines?: EvidenceLines;
};

export type Snapshot = {
  stage: GateStage;
  outcome: GateOutcome;
  findings: SnapshotFinding[];
};

export type LedgerEntry = {
  ruleId: string;
  file: string;
  lines?: EvidenceLines;
  firstSeen: string;
  lastSeen: string;
};

export type PlatformState = {
  detected: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
};

export type RulesetState = {
  platform: string;
  bundle: string;
  hash: string;
};

export type CompatibilityViolation = {
  ruleId: string;
  level: Severity;
  code: string;
  message: string;
  file: string;
  lines?: EvidenceLines;
};

export type AiEvidenceV2_1 = {
  version: '2.1';
  timestamp: string;
  snapshot: Snapshot;
  ledger: LedgerEntry[];
  platforms: Record<string, PlatformState>;
  rulesets: RulesetState[];
  ai_gate: {
    status: 'ALLOWED' | 'BLOCKED';
    violations: CompatibilityViolation[];
  };
  severity_metrics: {
    gate_status: 'ALLOWED' | 'BLOCKED';
    total_violations: number;
    by_severity: Record<Severity, number>;
  };
};
