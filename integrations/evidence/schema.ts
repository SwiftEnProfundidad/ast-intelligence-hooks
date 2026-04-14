import type { GateOutcome } from '../../core/gate/GateOutcome';
import type { GateStage } from '../../core/gate/GateStage';
import type { Severity } from '../../core/rules/Severity';
import type { SnapshotPlatformSummary } from './platformSummary';
import type { TddBddSnapshot } from '../tdd/types';

export type EnterpriseSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type EvidenceLines = string | number | readonly number[];

export type SnapshotFindingNode = {
  kind: 'class' | 'property' | 'call' | 'member';
  name: string;
  lines?: EvidenceLines;
};

export type SnapshotFinding = {
  ruleId: string;
  severity: Severity;
  code: string;
  message: string;
  file: string;
  lines?: EvidenceLines;
  matchedBy?: string;
  source?: string;
  blocking?: boolean;
  primary_node?: SnapshotFindingNode;
  related_nodes?: readonly SnapshotFindingNode[];
  why?: string;
  impact?: string;
  expected_fix?: string;
};

export type SnapshotEvaluationMetrics = {
  facts_total: number;
  rules_total: number;
  baseline_rules: number;
  heuristic_rules: number;
  skills_rules: number;
  project_rules: number;
  matched_rules: number;
  unmatched_rules: number;
  evaluated_rule_ids: string[];
  matched_rule_ids: string[];
  unmatched_rule_ids: string[];
};

export type SnapshotRulesCoverage = {
  stage: GateStage;
  active_rule_ids: string[];
  evaluated_rule_ids: string[];
  matched_rule_ids: string[];
  unevaluated_rule_ids: string[];
  unsupported_auto_rule_ids?: string[];
  counts: {
    active: number;
    evaluated: number;
    matched: number;
    unevaluated: number;
    unsupported_auto?: number;
  };
  coverage_ratio: number;
};

export type Snapshot = {
  stage: GateStage;
  audit_mode?: 'gate' | 'engine';
  outcome: GateOutcome;
  files_scanned?: number;
  files_affected?: number;
  evaluation_metrics?: SnapshotEvaluationMetrics;
  rules_coverage?: SnapshotRulesCoverage;
  tdd_bdd?: TddBddSnapshot;
  memory_shadow?: {
    recommended_outcome: GateOutcome;
    actual_outcome: GateOutcome;
    confidence: number;
    reason_codes: string[];
  };
  findings: SnapshotFinding[];
  platforms?: SnapshotPlatformSummary[];
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
  version?: string;
  signature?: string;
  source?: string;
  validation_status?: 'valid' | 'invalid' | 'expired' | 'unknown-source' | 'unsigned';
  validation_code?: string;
  degraded_mode_enabled?: boolean;
  degraded_mode_action?: 'allow' | 'block';
  degraded_mode_reason?: string;
  degraded_mode_source?: 'env' | 'file:.pumuki/degraded-mode.json';
  degraded_mode_code?: 'DEGRADED_MODE_ALLOWED' | 'DEGRADED_MODE_BLOCKED';
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
  blocking?: boolean;
  primary_node?: SnapshotFindingNode;
  related_nodes?: readonly SnapshotFindingNode[];
  why?: string;
  impact?: string;
  expected_fix?: string;
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

export type RepoTrackingDeclaration = {
  source_file: string;
  declared_path: string;
  resolved_path: string;
};

export type RepoTrackingState = {
  enforced: boolean;
  canonical_path: string | null;
  canonical_present: boolean;
  source_file: string | null;
  in_progress_count: number | null;
  single_in_progress_valid: boolean | null;
  conflict: boolean;
  declarations: ReadonlyArray<RepoTrackingDeclaration>;
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
    pending_changes?: number;
  };
  lifecycle: {
    installed: boolean;
    package_version: string | null;
    lifecycle_version: string | null;
    package_version_source?: 'consumer-node-modules' | 'runtime-package' | 'source-bin';
    package_version_runtime?: string | null;
    package_version_installed?: string | null;
    hooks: {
      pre_commit: RepoHookState;
      pre_push: RepoHookState;
    };
    hard_mode?: RepoHardModeState;
    tracking: RepoTrackingState;
  };
};

export type EvidenceChain = {
  algorithm: 'sha256';
  previous_payload_hash: string | null;
  payload_hash: string;
  sequence: number;
};

export type EvidenceRuleExecutionBreakdown = {
  evaluated_count: number;
  matched_blocking_count: number;
  matched_warn_count: number;
  matched_info_count: number;
  skipped_out_of_scope_count: number;
};

export type EvidenceOperationalHints = {
  requires_second_pass: boolean;
  second_pass_reason: string | null;
  human_summary_lines: string[];
  rule_execution_breakdown?: EvidenceRuleExecutionBreakdown;
};

export type AiEvidenceV2_1 = {
  version: '2.1';
  timestamp: string;
  evidence_chain?: EvidenceChain;
  operational_hints?: EvidenceOperationalHints;
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
    by_enterprise_severity?: Record<EnterpriseSeverity, number>;
  };
  sdd_metrics?: SddMetrics;
  repo_state?: RepoState;
  consolidation?: {
    suppressed: ConsolidationSuppressedFinding[];
  };
};
