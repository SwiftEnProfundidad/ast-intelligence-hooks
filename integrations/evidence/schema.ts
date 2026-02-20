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
  matchedBy?: string;
  source?: string;
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

export type HumanIntentConfidence = 'high' | 'medium' | 'low' | 'unset';

export type HumanIntentState = {
  primary_goal: string | null;
  secondary_goals: string[];
  non_goals: string[];
  constraints: string[];
  confidence_level: HumanIntentConfidence;
  set_by: string | null;
  set_at: string | null;
  expires_at: string | null;
  preserved_at: string;
  preservation_count: number;
  _hint?: string;
};

export type CompatibilityViolation = {
  ruleId: string;
  level: Severity;
  code: string;
  message: string;
  file: string;
  lines?: EvidenceLines;
  matchedBy?: string;
  source?: string;
};

export type SddMetrics = {
  enforced: boolean;
  stage: GateStage;
  decision: {
    allowed: boolean;
    code: string;
    message: string;
  };
};

export type ConsolidationSuppressedFinding = {
  ruleId: string;
  file: string;
  lines?: EvidenceLines;
  replacedByRuleId: string;
  replacementRuleId?: string | null;
  platform?: string;
  reason: string;
};

export type RepoHookState = 'managed' | 'missing' | 'unmanaged';

export type RepoHardModeState = {
  enabled: boolean;
  profile: string | null;
  config_path: string;
};

export type RepoState = {
  repo_root: string;
  git: {
    available: boolean;
    branch: string | null;
    upstream: string | null;
    ahead: number;
    behind: number;
    dirty: boolean;
    staged: number;
    unstaged: number;
  };
  lifecycle: {
    installed: boolean;
    package_version: string | null;
    lifecycle_version: string | null;
    hooks: {
      pre_commit: RepoHookState;
      pre_push: RepoHookState;
    };
    hard_mode?: RepoHardModeState;
  };
};

export type AiEvidenceV2_1 = {
  version: '2.1';
  timestamp: string;
  snapshot: Snapshot;
  ledger: LedgerEntry[];
  platforms: Record<string, PlatformState>;
  rulesets: RulesetState[];
  human_intent: HumanIntentState | null;
  ai_gate: {
    status: 'ALLOWED' | 'BLOCKED';
    violations: CompatibilityViolation[];
    human_intent: HumanIntentState | null;
  };
  severity_metrics: {
    gate_status: 'ALLOWED' | 'BLOCKED';
    total_violations: number;
    by_severity: Record<Severity, number>;
  };
  sdd_metrics?: SddMetrics;
  repo_state?: RepoState;
  consolidation?: {
    suppressed: ConsolidationSuppressedFinding[];
  };
};
