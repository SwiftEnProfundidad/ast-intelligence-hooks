import { getPumukiHooksStatus } from './hookManager';
import { LifecycleGitService, type ILifecycleGitService } from './gitService';
import { getCurrentPumukiVersion } from './packageInfo';
import {
  readLifecyclePolicyValidationSnapshot,
  type LifecyclePolicyValidationSnapshot,
} from './policyValidationSnapshot';
import { readLifecycleState, type LifecycleState } from './state';

export type LifecycleStatus = {
  repoRoot: string;
  packageVersion: string;
  lifecycleState: LifecycleState;
  hookStatus: ReturnType<typeof getPumukiHooksStatus>;
  trackedNodeModulesCount: number;
  policyValidation: LifecyclePolicyValidationSnapshot;
};

export const readLifecycleStatus = (params?: {
  cwd?: string;
  git?: ILifecycleGitService;
}): LifecycleStatus => {
  const git = params?.git ?? new LifecycleGitService();
  const cwd = params?.cwd ?? process.cwd();
  const repoRoot = git.resolveRepoRoot(cwd);
  const trackedNodeModulesCount = git.trackedNodeModulesPaths(repoRoot).length;

  return {
    repoRoot,
    packageVersion: getCurrentPumukiVersion(),
    lifecycleState: readLifecycleState(git, repoRoot),
    hookStatus: getPumukiHooksStatus(repoRoot),
    trackedNodeModulesCount,
    policyValidation: readLifecyclePolicyValidationSnapshot(repoRoot),
  };
};
