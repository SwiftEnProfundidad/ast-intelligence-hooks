import { resolveCurrentPumukiDependency } from './consumerPackage';
import { LifecycleGitService, type ILifecycleGitService } from './gitService';
import { LifecycleNpmService, type ILifecycleNpmService } from './npmService';
import { getCurrentPumukiPackageName } from './packageInfo';
import { runLifecycleUninstall } from './uninstall';

export type LifecycleRemoveResult = {
  repoRoot: string;
  packageRemoved: boolean;
  changedHooks: ReadonlyArray<string>;
  removedArtifacts: ReadonlyArray<string>;
};

export const runLifecycleRemove = (params?: {
  cwd?: string;
  git?: ILifecycleGitService;
  npm?: ILifecycleNpmService;
}): LifecycleRemoveResult => {
  const git = params?.git ?? new LifecycleGitService();
  const npm = params?.npm ?? new LifecycleNpmService();
  const repoRoot = git.resolveRepoRoot(params?.cwd ?? process.cwd());

  const uninstallResult = runLifecycleUninstall({
    cwd: repoRoot,
    purgeArtifacts: true,
    git,
  });

  const currentDependency = resolveCurrentPumukiDependency(repoRoot);
  const packageName = getCurrentPumukiPackageName();

  if (currentDependency.source === 'none') {
    return {
      repoRoot,
      packageRemoved: false,
      changedHooks: uninstallResult.changedHooks,
      removedArtifacts: uninstallResult.removedArtifacts,
    };
  }

  npm.runNpm(['uninstall', packageName], repoRoot);

  return {
    repoRoot,
    packageRemoved: true,
    changedHooks: uninstallResult.changedHooks,
    removedArtifacts: uninstallResult.removedArtifacts,
  };
};
