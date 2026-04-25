import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import packageJson from '../../package.json';

export type LifecycleDependencyInventory = {
  nodeModulesPresent: boolean;
  packageJsonPresent: boolean;
  lockfilePresent: boolean;
  pumuki: {
    declared: boolean;
    declaredRange: string | null;
    installed: boolean;
    installedVersion: string | null;
    packageJsonPath: string | null;
    binPath: string | null;
    binPresent: boolean;
  };
};

const readJsonRecord = (path: string): Record<string, unknown> | null => {
  if (!existsSync(path)) {
    return null;
  }

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const readDependencyRange = (
  manifest: Record<string, unknown> | null,
  dependencyName: string
): string | null => {
  if (!manifest) {
    return null;
  }

  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies'] as const) {
    const dependencies = manifest[section];
    if (typeof dependencies !== 'object' || dependencies === null || Array.isArray(dependencies)) {
      continue;
    }

    const value = (dependencies as Record<string, unknown>)[dependencyName];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
};

const readInstalledVersion = (installedManifest: Record<string, unknown> | null): string | null => {
  const version = installedManifest?.version;
  return typeof version === 'string' && version.trim().length > 0 ? version.trim() : null;
};

export const readLifecycleDependencyInventory = (
  repoRoot: string
): LifecycleDependencyInventory => {
  const manifestPath = join(repoRoot, 'package.json');
  const nodeModulesPath = join(repoRoot, 'node_modules');
  const lockfilePath = join(repoRoot, 'package-lock.json');
  const installedPackageJsonPath = join(nodeModulesPath, packageJson.name, 'package.json');
  const binName = process.platform === 'win32' ? `${packageJson.name}.cmd` : packageJson.name;
  const binPath = join(nodeModulesPath, '.bin', binName);
  const manifest = readJsonRecord(manifestPath);
  const installedManifest = readJsonRecord(installedPackageJsonPath);
  const declaredRange = readDependencyRange(manifest, packageJson.name);
  const installedVersion = readInstalledVersion(installedManifest);
  const binPresent = existsSync(binPath);

  return {
    nodeModulesPresent: existsSync(nodeModulesPath),
    packageJsonPresent: existsSync(manifestPath),
    lockfilePresent: existsSync(lockfilePath),
    pumuki: {
      declared: declaredRange !== null,
      declaredRange,
      installed: installedVersion !== null,
      installedVersion,
      packageJsonPath: installedVersion !== null ? `node_modules/${packageJson.name}/package.json` : null,
      binPath: binPresent ? `node_modules/.bin/${binName}` : null,
      binPresent,
    },
  };
};
