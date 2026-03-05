import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import packageJson from '../../package.json';

const readConsumerInstalledVersion = (repoRoot: string): string | null => {
  const packagePath = join(repoRoot, 'node_modules', packageJson.name, 'package.json');
  if (!existsSync(packagePath)) {
    return null;
  }
  try {
    const parsed = JSON.parse(readFileSync(packagePath, 'utf8')) as { version?: unknown };
    return typeof parsed.version === 'string' && parsed.version.trim().length > 0
      ? parsed.version.trim()
      : null;
  } catch {
    return null;
  }
};

export type PumukiVersionMetadata = {
  resolvedVersion: string;
  runtimeVersion: string;
  consumerInstalledVersion: string | null;
  source: 'consumer-node-modules' | 'runtime-package';
};

export const resolvePumukiVersionMetadata = (params?: { repoRoot?: string }): PumukiVersionMetadata => {
  const runtimeVersion = packageJson.version;
  const repoRoot = params?.repoRoot;
  if (typeof repoRoot === 'string' && repoRoot.trim().length > 0) {
    const installedVersion = readConsumerInstalledVersion(repoRoot.trim());
    if (installedVersion) {
      return {
        resolvedVersion: installedVersion,
        runtimeVersion,
        consumerInstalledVersion: installedVersion,
        source: 'consumer-node-modules',
      };
    }
  }
  return {
    resolvedVersion: runtimeVersion,
    runtimeVersion,
    consumerInstalledVersion: null,
    source: 'runtime-package',
  };
};

export const getCurrentPumukiVersion = (params?: { repoRoot?: string }): string => {
  return resolvePumukiVersionMetadata(params).resolvedVersion;
};

export const getCurrentPumukiPackageName = (): string => packageJson.name;
