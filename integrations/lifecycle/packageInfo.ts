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

export const getCurrentPumukiVersion = (params?: { repoRoot?: string }): string => {
  const repoRoot = params?.repoRoot;
  if (typeof repoRoot === 'string' && repoRoot.trim().length > 0) {
    const installedVersion = readConsumerInstalledVersion(repoRoot.trim());
    if (installedVersion) {
      return installedVersion;
    }
  }
  return packageJson.version;
};

export const getCurrentPumukiPackageName = (): string => packageJson.name;
