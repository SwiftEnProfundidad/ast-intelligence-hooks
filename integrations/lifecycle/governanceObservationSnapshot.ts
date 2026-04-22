import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readEvidenceResult } from '../evidence/readEvidence';
import { readRepoTrackingState } from '../evidence/trackingContract';
import type { RepoTrackingState } from '../evidence/schema';
import { readSddStatus } from '../sdd';
import type { SddStatusPayload } from '../sdd/types';
import type { LifecycleExperimentalFeaturesSnapshot } from './experimentalFeaturesSnapshot';
import type { ILifecycleGitService } from './gitService';
import { LifecycleGitService } from './gitService';
import type { LifecyclePolicyValidationSnapshot } from './policyValidationSnapshot';
import { writeInfo } from './cliOutputs';

const DEFAULT_PROTECTED_BRANCHES = new Set(['main', 'master', 'develop', 'dev']);

export type GovernanceEvidenceSummary = {
  path: string;
  readable: 'missing' | 'invalid' | 'valid';
  snapshot_stage?: string;
  snapshot_outcome?: 'PASS' | 'WARN' | 'BLOCK';
  matched_warn_count?: number;
  matched_blocking_count?: number;
  findings_count?: number;
  ai_gate_status?: 'ALLOWED' | 'BLOCKED';
  human_summary_preview: string[];
};

export type GovernanceContractSurface = {
  agents_md: boolean;
  skills_lock_json: boolean;
  skills_sources_json: boolean;
  vendor_skills_dir: boolean;
  pumuki_adapter_json: boolean;
};

export type GovernanceObservationSnapshot = {
  schema_version: '1';
  platform_bundles_effective?: ReadonlyArray<string>;
  pre_write_effective?: {
    mode: 'off' | 'advisory' | 'strict';
    source: string;
    blocking: boolean;
    strict_policy: boolean;
  };
  sdd: {
    experimental_raw: string | null;
    effective_mode: 'off' | 'advisory' | 'strict';
    experimental_source: string;
  };
  sdd_session: {
    active: boolean;
    valid: boolean;
    change_id: string | null;
    remaining_seconds: number | null;
  };
  policy_strict: {
    pre_write: boolean;
    pre_commit: boolean;
    pre_push: boolean;
    ci: boolean;
  };
  enterprise_warn_as_block_env: boolean;
  evidence: GovernanceEvidenceSummary;
  git: {
    current_branch: string | null;
    on_protected_branch_hint: boolean;
  };
  contract_surface: GovernanceContractSurface;
  tracking: RepoTrackingState;
  attention_codes: ReadonlyArray<string>;
  governance_effective: 'green' | 'attention' | 'blocked';
  agent_bootstrap_hints: ReadonlyArray<string>;
};

const truthyEnv = (value: string | undefined): boolean => {
  if (typeof value !== 'string') {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'strict';
};

const readCurrentBranch = (git: ILifecycleGitService, repoRoot: string): string | null => {
  try {
    const branch = git.runGit(['rev-parse', '--abbrev-ref', 'HEAD'], repoRoot).trim();
    return branch.length > 0 ? branch : null;
  } catch {
    return null;
  }
};

const readSddStatusSafe = (repoRoot: string): SddStatusPayload => {
  try {
    return readSddStatus(repoRoot);
  } catch {
    return {
      repoRoot,
      openspec: {
        installed: false,
        projectInitialized: false,
        minimumVersion: '0.0.0',
        recommendedVersion: '0.0.0',
        compatible: false,
      },
      session: {
        repoRoot,
        active: false,
        valid: false,
      },
    };
  }
};

const buildContractSurface = (repoRoot: string): GovernanceContractSurface => ({
  agents_md: existsSync(join(repoRoot, 'AGENTS.md')),
  skills_lock_json: existsSync(join(repoRoot, 'skills.lock.json')),
  skills_sources_json: existsSync(join(repoRoot, 'skills.sources.json')),
  vendor_skills_dir: existsSync(join(repoRoot, 'vendor', 'skills')),
  pumuki_adapter_json: existsSync(join(repoRoot, '.pumuki', 'adapter.json')),
});

const PLATFORM_BUNDLE_ORDER = [
  'android-enterprise-rules',
  'backend-enterprise-rules',
  'frontend-enterprise-rules',
  'ios-enterprise-rules',
] as const;

const PLATFORM_BUNDLE_LABELS: Record<(typeof PLATFORM_BUNDLE_ORDER)[number], string> = {
  'android-enterprise-rules': 'android',
  'backend-enterprise-rules': 'backend',
  'frontend-enterprise-rules': 'frontend',
  'ios-enterprise-rules': 'ios',
};

const resolvePlatformBundlesEffective = (repoRoot: string): ReadonlyArray<string> => {
  const vendorSkillsPath = join(repoRoot, 'vendor', 'skills');
  if (!existsSync(vendorSkillsPath)) {
    return [];
  }
  const present = new Set(
    readdirSync(vendorSkillsPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  );
  return PLATFORM_BUNDLE_ORDER.filter((bundle) => present.has(bundle)).map(
    (bundle) => PLATFORM_BUNDLE_LABELS[bundle]
  );
};

const summarizeEvidence = (repoRoot: string): GovernanceEvidenceSummary => {
  const evidenceResult = readEvidenceResult(repoRoot);
  const path = evidenceResult.source_descriptor.path;
  if (evidenceResult.kind === 'missing') {
    return { path, readable: 'missing', human_summary_preview: [] };
  }
  if (evidenceResult.kind === 'invalid') {
    return {
      path,
      readable: 'invalid',
      human_summary_preview: [evidenceResult.detail ?? evidenceResult.reason],
    };
  }

  const snapshot = evidenceResult.evidence.snapshot;
  const hints = evidenceResult.evidence.operational_hints?.human_summary_lines ?? [];
  const breakdown = evidenceResult.evidence.operational_hints?.rule_execution_breakdown;
  return {
    path,
    readable: 'valid',
    snapshot_stage: snapshot.stage,
    snapshot_outcome: snapshot.outcome,
    matched_warn_count: breakdown?.matched_warn_count,
    matched_blocking_count: breakdown?.matched_blocking_count,
    findings_count: Array.isArray(snapshot.findings) ? snapshot.findings.length : 0,
    ai_gate_status: evidenceResult.evidence.ai_gate.status,
    human_summary_preview: hints.slice(0, 5),
  };
};

const buildHints = (
  surface: GovernanceContractSurface,
  branch: string | null,
  protectedBranchHint: boolean,
  tracking: RepoTrackingState
): string[] => {
  const hints: string[] = [];
  if (surface.agents_md) {
    hints.push('AGENTS.md presente: aplica el contrato del repo antes de dar governance en verde.');
  }
  if (!surface.skills_lock_json) {
    hints.push('Falta skills.lock.json: genera lock canónico de skills antes de cerrar la gobernanza.');
  }
  if (!surface.pumuki_adapter_json) {
    hints.push('Falta .pumuki/adapter.json: instala el adaptador si quieres wiring IDE/MCP explícito.');
  }
  if (protectedBranchHint && branch) {
    hints.push(`La rama "${branch}" cae en el set protegido por defecto: usa feature/* o refactor/*.`);
  }
  if (tracking.conflict) {
    hints.push('Tracking canónico en conflicto: AGENTS.md y los README del repo no apuntan al mismo MD.');
  }
  if (tracking.enforced && !tracking.canonical_present) {
    hints.push(`Falta el tracking canónico declarado (${tracking.canonical_path ?? 'sin resolver'}).`);
  }
  if (tracking.enforced && tracking.single_in_progress_valid === false) {
    hints.push(
      `El tracking canónico debe dejar exactamente una 🚧 (actual=${tracking.in_progress_count ?? 'n/a'}).`
    );
  }
  hints.push('SDD/OpenSpec: usa PUMUKI_EXPERIMENTAL_SDD=advisory|strict cuando el loop SDD esté activo.');
  hints.push('WARN-as-BLOCK: activa PUMUKI_ENTERPRISE_STRICT_WARN_AS_BLOCK=1 si el repo exige promoción dura.');
  return hints;
};

export const readGovernanceObservationSnapshot = (params: {
  repoRoot: string;
  experimentalFeatures: LifecycleExperimentalFeaturesSnapshot;
  policyValidation: LifecyclePolicyValidationSnapshot;
  git?: ILifecycleGitService;
}): GovernanceObservationSnapshot => {
  const git = params.git ?? new LifecycleGitService();
  const { repoRoot, experimentalFeatures, policyValidation } = params;
  const rawSdd = process.env.PUMUKI_EXPERIMENTAL_SDD?.trim();
  const sddStatus = readSddStatusSafe(repoRoot);
  const evidence = summarizeEvidence(repoRoot);
  const branch = readCurrentBranch(git, repoRoot);
  const onProtected = typeof branch === 'string' && DEFAULT_PROTECTED_BRANCHES.has(branch.trim().toLowerCase());
  const surface = buildContractSurface(repoRoot);
  const tracking = readRepoTrackingState(repoRoot);
  const warnAsBlock = truthyEnv(process.env.PUMUKI_ENTERPRISE_STRICT_WARN_AS_BLOCK);

  const attention: string[] = [];
  if (evidence.readable === 'invalid') {
    attention.push('EVIDENCE_INVALID_OR_CHAIN');
  }
  if (evidence.readable === 'valid' && evidence.ai_gate_status === 'BLOCKED') {
    attention.push('AI_GATE_BLOCKED');
  }
  if (evidence.readable === 'valid' && evidence.snapshot_outcome === 'WARN') {
    attention.push('EVIDENCE_SNAPSHOT_WARN');
  }
  if (evidence.readable === 'valid' && evidence.snapshot_outcome === 'BLOCK') {
    attention.push('EVIDENCE_SNAPSHOT_BLOCK');
  }
  if (sddStatus.session.active === true && sddStatus.session.valid !== true) {
    attention.push('SDD_SESSION_INVALID_OR_EXPIRED');
  }
  if (!policyValidation.stages.PRE_WRITE.strict) {
    attention.push('POLICY_PRE_WRITE_NOT_STRICT');
  }
  if (!policyValidation.stages.PRE_COMMIT.strict) {
    attention.push('POLICY_PRE_COMMIT_NOT_STRICT');
  }
  if (!policyValidation.stages.PRE_PUSH.strict) {
    attention.push('POLICY_PRE_PUSH_NOT_STRICT');
  }
  if (!policyValidation.stages.CI.strict) {
    attention.push('POLICY_CI_NOT_STRICT');
  }
  if (onProtected) {
    attention.push('GITFLOW_PROTECTED_BRANCH_CONTEXT');
  }
  if (tracking.conflict) {
    attention.push('TRACKING_CANONICAL_SOURCE_CONFLICT');
  }
  if (tracking.enforced && !tracking.canonical_present) {
    attention.push('TRACKING_CANONICAL_FILE_MISSING');
  }
  if (tracking.enforced && tracking.single_in_progress_valid === false) {
    attention.push('TRACKING_CANONICAL_IN_PROGRESS_INVALID');
  }

  let governanceEffective: GovernanceObservationSnapshot['governance_effective'] = 'green';
  if (
    evidence.readable === 'invalid'
    || (evidence.readable === 'valid' && evidence.ai_gate_status === 'BLOCKED')
    || (evidence.readable === 'valid' && evidence.snapshot_outcome === 'BLOCK')
  ) {
    governanceEffective = 'blocked';
  } else if (attention.length > 0) {
    governanceEffective = 'attention';
  }

  return {
    schema_version: '1',
    platform_bundles_effective: resolvePlatformBundlesEffective(repoRoot),
    pre_write_effective: {
      mode: experimentalFeatures.features.pre_write.mode,
      source: experimentalFeatures.features.pre_write.source,
      blocking: experimentalFeatures.features.pre_write.blocking,
      strict_policy: policyValidation.stages.PRE_WRITE.strict,
    },
    sdd: {
      experimental_raw: rawSdd && rawSdd.length > 0 ? rawSdd : null,
      effective_mode: experimentalFeatures.features.sdd.mode,
      experimental_source: experimentalFeatures.features.sdd.source,
    },
    sdd_session: {
      active: sddStatus.session.active,
      valid: sddStatus.session.valid,
      change_id: sddStatus.session.changeId ?? null,
      remaining_seconds:
        typeof sddStatus.session.remainingSeconds === 'number' ? sddStatus.session.remainingSeconds : null,
    },
    policy_strict: {
      pre_write: policyValidation.stages.PRE_WRITE.strict,
      pre_commit: policyValidation.stages.PRE_COMMIT.strict,
      pre_push: policyValidation.stages.PRE_PUSH.strict,
      ci: policyValidation.stages.CI.strict,
    },
    enterprise_warn_as_block_env: warnAsBlock,
    evidence,
    git: {
      current_branch: branch,
      on_protected_branch_hint: onProtected,
    },
    contract_surface: surface,
    tracking,
    attention_codes: attention,
    governance_effective: governanceEffective,
    agent_bootstrap_hints: buildHints(surface, branch, onProtected, tracking),
  };
};

export const buildGovernanceObservationSummaryLines = (
  snapshot: GovernanceObservationSnapshot
): string[] => {
  const lines = [
    `Contract: AGENTS=${snapshot.contract_surface.agents_md ? 'yes' : 'no'} skills.lock=${snapshot.contract_surface.skills_lock_json ? 'yes' : 'no'} skills.sources=${snapshot.contract_surface.skills_sources_json ? 'yes' : 'no'} vendor/skills=${snapshot.contract_surface.vendor_skills_dir ? 'yes' : 'no'} adapter=${snapshot.contract_surface.pumuki_adapter_json ? 'yes' : 'no'}`,
    `Governance: ${snapshot.governance_effective.toUpperCase()}`,
    `Platforms: ${snapshot.platform_bundles_effective?.join(', ') || 'none-detected'}`,
    `GitFlow: branch=${snapshot.git.current_branch ?? 'unknown'} protected_hint=${snapshot.git.on_protected_branch_hint ? 'yes' : 'no'}`,
    `SDD: env=${snapshot.sdd.experimental_raw ?? '(unset)'} effective=${snapshot.sdd.effective_mode} session_active=${snapshot.sdd_session.active} session_valid=${snapshot.sdd_session.valid} change=${snapshot.sdd_session.change_id ?? 'none'}`,
    `Evidence: readable=${snapshot.evidence.readable} stage=${snapshot.evidence.snapshot_stage ?? 'n/a'} outcome=${snapshot.evidence.snapshot_outcome ?? 'n/a'} ai_gate=${snapshot.evidence.ai_gate_status ?? 'n/a'} findings=${snapshot.evidence.findings_count ?? 'n/a'}`,
    `Pre-write: mode=${snapshot.pre_write_effective?.mode ?? 'unknown'} blocking=${snapshot.pre_write_effective?.blocking ? 'yes' : 'no'} strict_policy=${snapshot.pre_write_effective?.strict_policy ? 'yes' : 'no'} source=${snapshot.pre_write_effective?.source ?? 'unknown'}`,
  ];
  if (snapshot.attention_codes.length > 0) {
    lines.push(`Attention: ${snapshot.attention_codes.join(', ')}`);
  }
  return lines;
};

export const printGovernanceObservationHuman = (snapshot: GovernanceObservationSnapshot): void => {
  writeInfo('[pumuki] governance truth (S1 / governance console baseline):');
  for (const line of buildGovernanceObservationSummaryLines(snapshot)) {
    writeInfo(`[pumuki]   ${line}`);
  }
  for (const hint of snapshot.evidence.human_summary_preview) {
    writeInfo(`[pumuki]   evidence hint: ${hint}`);
  }
};

export const doctorGovernanceIsBlocking = (snapshot: GovernanceObservationSnapshot): boolean =>
  snapshot.governance_effective === 'blocked';

export const doctorGovernanceNeedsAttention = (snapshot: GovernanceObservationSnapshot): boolean =>
  snapshot.governance_effective !== 'green';
