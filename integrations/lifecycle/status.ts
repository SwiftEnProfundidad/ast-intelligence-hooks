import { getPumukiHooksStatus, resolvePumukiHooksDirectory } from './hookManager';
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
  type GovernanceObservationSnapshot,
} from './governanceObservationSnapshot';
import {
  readGovernanceNextAction,
  type GovernanceNextActionReader,
  type GovernanceNextActionSummary,
} from './governanceNextAction';
import type { DoctorIssue } from './doctor';
import { readLifecycleState, type LifecycleState } from './state';
import { resolveRepoTrackingState, type RepoTrackingState } from './trackingState';

export type LifecycleStatus = {
  repoRoot: string;
  packageVersion: string;
  version: ReturnType<typeof buildLifecycleVersionReport>;
  lifecycleState: LifecycleState;
  hookStatus: ReturnType<typeof getPumukiHooksStatus>;
  hooksDirectory: string;
  hooksDirectoryResolution: 'git-rev-parse' | 'git-config' | 'default';
  trackedNodeModulesCount: number;
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
}): ReadonlyArray<DoctorIssue> => {
  const issues: DoctorIssue[] = [];

  if (doctorGovernanceIsBlocking(params.governanceObservation)) {
    issues.push({
      severity: 'error',
      message:
        `Governance is blocked (${params.governanceNextAction.reason_code}). ` +
        params.governanceNextAction.instruction,
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
  const governanceStage = governanceObservation.evidence.snapshot_stage ?? 'PRE_WRITE';
  const governanceNextAction = (params?.governanceNextActionReader ?? readGovernanceNextAction)({
    repoRoot,
    stage: governanceStage,
    governanceObservation,
  });
  const tracking = resolveRepoTrackingState(repoRoot);
  const issues = buildLifecycleIssues({ governanceObservation, governanceNextAction });

  return {
    repoRoot,
    packageVersion: version.effective,
    version,
    lifecycleState,
    hookStatus: getPumukiHooksStatus(repoRoot),
    hooksDirectory: hooksDirectory.path,
    hooksDirectoryResolution: hooksDirectory.source,
    trackedNodeModulesCount,
    policyValidation,
    experimentalFeatures,
    governanceNextAction,
    governanceObservation,
    tracking,
    issues,
  };
};
