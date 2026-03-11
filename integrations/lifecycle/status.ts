import { getPumukiHooksStatus, resolvePumukiHooksDirectory } from './hookManager';
import { LifecycleGitService, type ILifecycleGitService } from './gitService';
import { buildLifecycleVersionReport } from './packageInfo';
import {
  readLifecyclePolicyValidationSnapshot,
  type LifecyclePolicyValidationSnapshot,
} from './policyValidationSnapshot';
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
};

export const readLifecycleStatus = (params?: {
  cwd?: string;
  git?: ILifecycleGitService;
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

  return {
    repoRoot,
    packageVersion: version.effective,
    version,
    lifecycleState,
    hookStatus: getPumukiHooksStatus(repoRoot),
    hooksDirectory: hooksDirectory.path,
    hooksDirectoryResolution: hooksDirectory.source,
    trackedNodeModulesCount,
    policyValidation: readLifecyclePolicyValidationSnapshot(repoRoot),
  };
};
