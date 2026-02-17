import { purgeUntrackedPumukiArtifacts } from './artifacts';
import { LifecycleGitService, type ILifecycleGitService } from './gitService';
import { uninstallPumukiHooks } from './hookManager';
import { clearLifecycleState } from './state';

export type LifecycleUninstallResult = {
  repoRoot: string;
  changedHooks: ReadonlyArray<string>;
  removedArtifacts: ReadonlyArray<string>;
};

export const runLifecycleUninstall = (params?: {
  cwd?: string;
  purgeArtifacts?: boolean;
  git?: ILifecycleGitService;
}): LifecycleUninstallResult => {
  const git = params?.git ?? new LifecycleGitService();
  const cwd = params?.cwd ?? process.cwd();
  const repoRoot = git.resolveRepoRoot(cwd);

  const hookResult = uninstallPumukiHooks(repoRoot);
  clearLifecycleState(git, repoRoot);

  const removedArtifacts = params?.purgeArtifacts
    ? purgeUntrackedPumukiArtifacts({
      git,
      repoRoot,
    })
    : [];

  return {
    repoRoot,
    changedHooks: hookResult.changedHooks,
    removedArtifacts,
  };
};
