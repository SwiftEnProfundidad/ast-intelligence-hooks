import { existsSync, readdirSync, rmSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
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

const collectEmptyNodeModulesDirectories = (
  directoryPath: string,
  relativePath = ''
): Set<string> => {
  const emptyDirectories = new Set<string>();
  const entries = readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const childRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    const childPath = join(directoryPath, entry.name);
    const childEmptyDirectories = collectEmptyNodeModulesDirectories(
      childPath,
      childRelativePath
    );

    for (const childEmptyDirectory of childEmptyDirectories) {
      emptyDirectories.add(childEmptyDirectory);
    }

    if (readdirSync(childPath).length === 0) {
      emptyDirectories.add(childRelativePath);
    }
  }

  return emptyDirectories;
};

const cleanupNodeModulesIfOnlyLockfile = (
  repoRoot: string,
  preservedEmptyDirectories: ReadonlySet<string>
): void => {
  const nodeModulesPath = join(repoRoot, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    return;
  }

  const pruneEmptyNodeModulesDirectories = (
    directoryPath: string,
    relativePath = ''
  ): boolean => {
    const entries = readdirSync(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const childPath = join(directoryPath, entry.name);
      const childRelativePath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;

      const childIsEmpty = pruneEmptyNodeModulesDirectories(
        childPath,
        childRelativePath
      );
      if (!childIsEmpty) {
        continue;
      }
      if (preservedEmptyDirectories.has(childRelativePath)) {
        continue;
      }
      rmSync(childPath, { recursive: true, force: true });
    }

    return readdirSync(directoryPath).length === 0;
  };

  pruneEmptyNodeModulesDirectories(nodeModulesPath);

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
    if (preservedEmptyDirectories.has('.bin')) {
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
  const nodeModulesPath = join(repoRoot, 'node_modules');
  const preservedEmptyDirectories =
    currentDependency.source !== 'none' && existsSync(nodeModulesPath)
      ? collectEmptyNodeModulesDirectories(nodeModulesPath)
      : new Set<string>();
  const packageName = getCurrentPumukiPackageName();

  if (currentDependency.source === 'none') {
    cleanupNodeModulesIfOnlyLockfile(repoRoot, preservedEmptyDirectories);
    return {
      repoRoot,
      packageRemoved: false,
      changedHooks: uninstallResult.changedHooks,
      removedArtifacts: uninstallResult.removedArtifacts,
    };
  }

  npm.runNpm(['uninstall', packageName], repoRoot);
  cleanupNodeModulesIfOnlyLockfile(repoRoot, preservedEmptyDirectories);

  return {
    repoRoot,
    packageRemoved: true,
    changedHooks: uninstallResult.changedHooks,
    removedArtifacts: uninstallResult.removedArtifacts,
  };
};
