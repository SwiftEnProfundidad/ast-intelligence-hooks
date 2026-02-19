import { existsSync, readFileSync, readdirSync, rmSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
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

type NodePackageManifest = {
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const readManifestDependencyNames = (packageDirectory: string): ReadonlyArray<string> => {
  const packageJsonPath = join(packageDirectory, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return [];
  }

  try {
    const manifest = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as NodePackageManifest;
    const dependencyNames = new Set<string>();
    const sections = [manifest.dependencies, manifest.optionalDependencies, manifest.peerDependencies];
    for (const section of sections) {
      if (!section) {
        continue;
      }
      for (const dependencyName of Object.keys(section)) {
        dependencyNames.add(dependencyName);
      }
    }
    return Array.from(dependencyNames);
  } catch {
    return [];
  }
};

const resolveInstalledDependencyDirectory = (params: {
  dependencyName: string;
  fromPackageDirectory: string;
  nodeModulesPath: string;
}): string | undefined => {
  const repoRoot = dirname(params.nodeModulesPath);
  let currentDirectory = params.fromPackageDirectory;

  while (currentDirectory.startsWith(repoRoot)) {
    const candidate = join(currentDirectory, 'node_modules', params.dependencyName);
    if (existsSync(join(candidate, 'package.json'))) {
      return candidate;
    }

    if (currentDirectory === repoRoot) {
      break;
    }

    const parentDirectory = dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      break;
    }
    currentDirectory = parentDirectory;
  }

  const topLevelCandidate = join(params.nodeModulesPath, params.dependencyName);
  if (existsSync(join(topLevelCandidate, 'package.json'))) {
    return topLevelCandidate;
  }

  return undefined;
};

const collectPumukiTraceDirectories = (params: {
  repoRoot: string;
  packageName: string;
}): ReadonlySet<string> => {
  const nodeModulesPath = join(params.repoRoot, 'node_modules');
  const rootPackageDirectory = join(nodeModulesPath, params.packageName);
  if (!existsSync(join(rootPackageDirectory, 'package.json'))) {
    return new Set<string>();
  }

  const traceDirectories = new Set<string>();
  const pending = [rootPackageDirectory];

  while (pending.length > 0) {
    const packageDirectory = pending.pop();
    if (!packageDirectory || traceDirectories.has(packageDirectory)) {
      continue;
    }
    traceDirectories.add(packageDirectory);

    const dependencyNames = readManifestDependencyNames(packageDirectory);
    for (const dependencyName of dependencyNames) {
      const resolvedDependencyDirectory = resolveInstalledDependencyDirectory({
        dependencyName,
        fromPackageDirectory: packageDirectory,
        nodeModulesPath,
      });
      if (!resolvedDependencyDirectory) {
        continue;
      }
      pending.push(resolvedDependencyDirectory);
    }
  }

  return traceDirectories;
};

type EmptyDirectoryCleanupResult = 'removed' | 'missing' | 'not-empty';

const removeDirectoryIfEmpty = (directoryPath: string): EmptyDirectoryCleanupResult => {
  if (!existsSync(directoryPath)) {
    return 'missing';
  }

  if (readdirSync(directoryPath).length > 0) {
    return 'not-empty';
  }

  rmSync(directoryPath, { recursive: true, force: true });
  return 'removed';
};

const cleanupTraceAncestors = (params: {
  tracePath: string;
  nodeModulesPath: string;
}): void => {
  let currentDirectory = dirname(params.tracePath);
  while (
    currentDirectory.startsWith(params.nodeModulesPath) &&
    currentDirectory !== params.nodeModulesPath
  ) {
    const cleanupResult = removeDirectoryIfEmpty(currentDirectory);
    if (cleanupResult === 'not-empty') {
      break;
    }
    currentDirectory = dirname(currentDirectory);
  }
};

const cleanupNodeModulesIfOnlyLockfile = (repoRoot: string): void => {
  const nodeModulesPath = join(repoRoot, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    return;
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
    if (readdirSync(binPath).length > 0) {
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

const cleanupPumukiTraceDirectories = (params: {
  repoRoot: string;
  traceDirectories: ReadonlySet<string>;
}): void => {
  const nodeModulesPath = join(params.repoRoot, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    return;
  }

  const orderedTraceDirectories = Array.from(params.traceDirectories).sort(
    (left, right) => right.length - left.length
  );

  for (const traceDirectory of orderedTraceDirectories) {
    removeDirectoryIfEmpty(traceDirectory);
    cleanupTraceAncestors({
      tracePath: traceDirectory,
      nodeModulesPath,
    });
  }

  cleanupNodeModulesIfOnlyLockfile(params.repoRoot);
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
  const pumukiTraceDirectories = collectPumukiTraceDirectories({
    repoRoot,
    packageName,
  });

  if (currentDependency.source === 'none') {
    cleanupPumukiTraceDirectories({
      repoRoot,
      traceDirectories: pumukiTraceDirectories,
    });
    return {
      repoRoot,
      packageRemoved: false,
      changedHooks: uninstallResult.changedHooks,
      removedArtifacts: uninstallResult.removedArtifacts,
    };
  }

  npm.runNpm(['uninstall', packageName], repoRoot);
  cleanupPumukiTraceDirectories({
    repoRoot,
    traceDirectories: pumukiTraceDirectories,
  });

  return {
    repoRoot,
    packageRemoved: true,
    changedHooks: uninstallResult.changedHooks,
    removedArtifacts: uninstallResult.removedArtifacts,
  };
};
