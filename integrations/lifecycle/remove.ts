import { existsSync, readdirSync, rmSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import {
  hasDeclaredDependenciesBeyondPumuki,
  resolveCurrentPumukiDependency,
} from './consumerPackage';
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

const pruneEmptyNodeModulesDirectories = (directoryPath: string): boolean => {
  const entries = readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const childPath = join(directoryPath, entry.name);
    const childIsEmpty = pruneEmptyNodeModulesDirectories(childPath);
    if (childIsEmpty) {
      rmSync(childPath, { recursive: true, force: true });
    }
  }

  return readdirSync(directoryPath).length === 0;
};

const cleanupNodeModulesIfOnlyLockfile = (
  repoRoot: string,
  options?: {
    allowPruneEmptyDirectories?: boolean;
  }
): void => {
  const nodeModulesPath = join(repoRoot, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    return;
  }

  if (options?.allowPruneEmptyDirectories === true) {
    pruneEmptyNodeModulesDirectories(nodeModulesPath);
  }

  const entries = readdirSync(nodeModulesPath, { withFileTypes: true });
  if (entries.length === 0) {
    rmSync(nodeModulesPath, { recursive: true, force: true });
    return;
  }

  const allowedNames = new Set(['.package-lock.json', '.bin']);
  const hasOnlyAllowedEntries = entries.every((entry) => allowedNames.has(entry.name));
  if (!hasOnlyAllowedEntries) {
    return;
  }

  const lockfileEntry = entries.find((entry) => entry.name === '.package-lock.json' && entry.isFile());
  if (!lockfileEntry) {
    return;
  }

  const binEntry = entries.find((entry) => entry.name === '.bin' && entry.isDirectory());
  if (binEntry) {
    const binPath = join(nodeModulesPath, '.bin');
    const binEntries = readdirSync(binPath);
    if (binEntries.length > 0) {
      return;
    }
    rmSync(binPath, { recursive: true, force: true });
  }

  if (existsSync(join(nodeModulesPath, '.package-lock.json'))) {
    unlinkSync(join(nodeModulesPath, '.package-lock.json'));
  }

  if (readdirSync(nodeModulesPath).length === 0) {
    rmSync(nodeModulesPath, { recursive: true, force: true });
  }
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
  const hasExternalDependencies = hasDeclaredDependenciesBeyondPumuki(repoRoot);
  const packageName = getCurrentPumukiPackageName();

  if (currentDependency.source === 'none') {
    cleanupNodeModulesIfOnlyLockfile(repoRoot, {
      allowPruneEmptyDirectories: !hasExternalDependencies,
    });
    return {
      repoRoot,
      packageRemoved: false,
      changedHooks: uninstallResult.changedHooks,
      removedArtifacts: uninstallResult.removedArtifacts,
    };
  }

  npm.runNpm(['uninstall', packageName], repoRoot);
  cleanupNodeModulesIfOnlyLockfile(repoRoot, {
    allowPruneEmptyDirectories: !hasExternalDependencies,
  });

  return {
    repoRoot,
    packageRemoved: true,
    changedHooks: uninstallResult.changedHooks,
    removedArtifacts: uninstallResult.removedArtifacts,
  };
};
