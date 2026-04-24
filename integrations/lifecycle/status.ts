import { getPumukiHooksStatus, resolvePumukiHooksDirectory } from './hookManager';
import type { AiGateStage } from '../gate/evaluateAiGate';
import { LifecycleGitService, type ILifecycleGitService } from './gitService';
import { buildLifecycleVersionReport } from './packageInfo';
import {
  readLifecycleExperimentalFeaturesSnapshot,
  type LifecycleExperimentalFeaturesSnapshot,
} from './experimentalFeaturesSnapshot';
import {
  readLifecyclePolicyValidationSnapshot,
  type LifecyclePolicyValidationSnapshot,
} from './policyValidationSnapshot';
import {
  readGovernanceObservationSnapshot,
  doctorGovernanceIsBlocking,
  doctorGovernanceNeedsAttention,
  type GovernanceObservationSnapshot,
} from './governanceObservationSnapshot';
import {
  readGovernanceNextAction,
  type GovernanceNextActionReader,
  type GovernanceNextActionSummary,
} from './governanceNextAction';
import type { DoctorIssue } from './doctor';
import { readLifecycleState, type LifecycleState } from './state';
import {
  formatTrackingActionableContext,
  resolveRepoTrackingState,
  type RepoTrackingState,
} from './trackingState';
import {
  readLifecycleDependencyInventory,
  type LifecycleDependencyInventory,
} from './dependencyInventory';

const resolveGovernanceStage = (stage: string | null | undefined): AiGateStage => {
  if (
    stage === 'PRE_WRITE' ||
    stage === 'PRE_COMMIT' ||
    stage === 'PRE_PUSH' ||
    stage === 'CI'
  ) {
    return stage;
  }
  return 'PRE_WRITE';
};

export type LifecycleStatus = {
  repoRoot: string;
  packageVersion: string;
  version: ReturnType<typeof buildLifecycleVersionReport>;
  lifecycleState: LifecycleState;
  hookStatus: ReturnType<typeof getPumukiHooksStatus>;
  hooksDirectory: string;
  hooksDirectoryResolution: 'git-rev-parse' | 'git-config' | 'default';
  trackedNodeModulesCount: number;
  dependencyInventory: LifecycleDependencyInventory;
  policyValidation: LifecyclePolicyValidationSnapshot;
  experimentalFeatures: LifecycleExperimentalFeaturesSnapshot;
  governanceObservation: GovernanceObservationSnapshot;
  governanceNextAction: GovernanceNextActionSummary;
  tracking: RepoTrackingState;
  issues: ReadonlyArray<DoctorIssue>;
};

const buildLifecycleIssues = (params: {
  governanceObservation: GovernanceObservationSnapshot;
  governanceNextAction: GovernanceNextActionSummary;
  tracking: RepoTrackingState;
}): ReadonlyArray<DoctorIssue> => {
  const issues: DoctorIssue[] = [];
  const hasOperationalAttention =
    params.governanceObservation.attention_codes.includes('EVIDENCE_SNAPSHOT_WARN')
    || params.governanceObservation.attention_codes.includes('SDD_SESSION_INVALID_OR_EXPIRED');

  if (doctorGovernanceIsBlocking(params.governanceObservation)) {
    issues.push({
      severity: 'error',
      message:
        `Governance is blocked (${params.governanceNextAction.reason_code}). ` +
        params.governanceNextAction.instruction,
    });
  } else if (
    doctorGovernanceNeedsAttention(params.governanceObservation)
    && hasOperationalAttention
  ) {
    issues.push({
      severity: 'warning',
      message:
        `Governance requires attention (${params.governanceNextAction.reason_code}). ` +
        params.governanceNextAction.instruction,
    });
  }

  if (params.tracking.enforced && params.tracking.single_in_progress_valid === false) {
    const actionableContext = formatTrackingActionableContext(params.tracking);
    issues.push({
      severity: 'warning',
      message:
        `Canonical tracking is inconsistent for ${params.tracking.canonical_path ?? 'unknown'} (in_progress_count=${params.tracking.in_progress_count}, active_task=${params.tracking.active_task_id ?? 'unknown'}, last_run_status=${params.tracking.last_run_status ?? 'absent'}).${actionableContext ? ` ${actionableContext}` : ''}`,
    });
  }

  return issues;
};

export const readLifecycleStatus = (params?: {
  cwd?: string;
  git?: ILifecycleGitService;
  governanceNextActionReader?: GovernanceNextActionReader;
}): LifecycleStatus => {
  const git = params?.git ?? new LifecycleGitService();
  const cwd = params?.cwd ?? process.cwd();
  const repoRoot = git.resolveRepoRoot(cwd);
  const hooksDirectory = resolvePumukiHooksDirectory(repoRoot);
  const trackedNodeModulesCount = git.trackedNodeModulesPaths(repoRoot).length;
  const dependencyInventory = readLifecycleDependencyInventory(repoRoot);
  const lifecycleState = readLifecycleState(git, repoRoot);
  const version = buildLifecycleVersionReport({
    repoRoot,
    lifecycleVersion: lifecycleState.version,
  });
  const policyValidation = readLifecyclePolicyValidationSnapshot(repoRoot);
  const experimentalFeatures = readLifecycleExperimentalFeaturesSnapshot();
  const governanceObservation = readGovernanceObservationSnapshot({
    repoRoot,
    experimentalFeatures,
    policyValidation,
    git,
  });
  const governanceStage = resolveGovernanceStage(governanceObservation.evidence.snapshot_stage);
  const governanceNextAction = (params?.governanceNextActionReader ?? readGovernanceNextAction)({
    repoRoot,
    stage: governanceStage,
    governanceObservation,
  });
  const tracking = resolveRepoTrackingState(repoRoot);
  const issues = buildLifecycleIssues({ governanceObservation, governanceNextAction, tracking });

  return {
    repoRoot,
    packageVersion: version.effective,
    version,
    lifecycleState,
    hookStatus: getPumukiHooksStatus(repoRoot),
    hooksDirectory: hooksDirectory.path,
    hooksDirectoryResolution: hooksDirectory.source,
    trackedNodeModulesCount,
    dependencyInventory,
    policyValidation,
    experimentalFeatures,
    governanceNextAction,
    governanceObservation,
    tracking,
    issues,
  };
};
