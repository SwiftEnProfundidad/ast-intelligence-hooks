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
  type GovernanceObservationSnapshot,
} from './governanceObservationSnapshot';
import {
  readGovernanceNextAction,
  type GovernanceNextActionReader,
  type GovernanceNextActionSummary,
} from './governanceNextAction';
import { readLifecycleState, type LifecycleState } from './state';

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
  const governanceNextAction = (params?.governanceNextActionReader ?? readGovernanceNextAction)({
    repoRoot,
    stage: 'PRE_WRITE',
    governanceObservation,
  });

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
  };
};
