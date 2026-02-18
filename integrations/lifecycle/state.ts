import { PUMUKI_CONFIG_KEYS, PUMUKI_MANAGED_HOOKS } from './constants';
import type { ILifecycleGitService } from './gitService';

export type LifecycleState = {
  installed?: string;
  version?: string;
  hooks?: string;
  installedAt?: string;
  openSpecManagedArtifacts?: string;
};

const parseManagedArtifacts = (raw: string | undefined): string[] => {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return [];
  }
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
};

const serializeManagedArtifacts = (artifacts: ReadonlyArray<string>): string | undefined => {
  const unique = Array.from(new Set(artifacts.map((value) => value.trim()).filter((value) => value.length > 0)))
    .sort();
  if (unique.length === 0) {
    return undefined;
  }
  return unique.join(',');
};

export const readLifecycleState = (
  git: ILifecycleGitService,
  repoRoot: string
): LifecycleState => ({
  installed: git.getLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.installed),
  version: git.getLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.version),
  hooks: git.getLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.hooks),
  installedAt: git.getLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.installedAt),
  openSpecManagedArtifacts: git.getLocalConfig(
    repoRoot,
    PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts
  ),
});

export const writeLifecycleState = (params: {
  git: ILifecycleGitService;
  repoRoot: string;
  version: string;
  openSpecManagedArtifacts?: ReadonlyArray<string>;
}): void => {
  const { git, repoRoot, version } = params;
  git.setLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.installed, 'true');
  git.setLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.version, version);
  git.setLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.hooks, PUMUKI_MANAGED_HOOKS.join(','));
  git.setLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.installedAt, new Date().toISOString());
  if (params.openSpecManagedArtifacts) {
    const serialized = serializeManagedArtifacts(params.openSpecManagedArtifacts);
    if (serialized) {
      git.setLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts, serialized);
    } else {
      git.unsetLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts);
    }
  }
};

export const readOpenSpecManagedArtifacts = (
  git: ILifecycleGitService,
  repoRoot: string
): ReadonlyArray<string> =>
  parseManagedArtifacts(git.getLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts));

export const writeOpenSpecManagedArtifacts = (params: {
  git: ILifecycleGitService;
  repoRoot: string;
  artifacts: ReadonlyArray<string>;
}): void => {
  const serialized = serializeManagedArtifacts(params.artifacts);
  if (serialized) {
    params.git.setLocalConfig(
      params.repoRoot,
      PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts,
      serialized
    );
    return;
  }
  params.git.unsetLocalConfig(params.repoRoot, PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts);
};

export const clearLifecycleState = (
  git: ILifecycleGitService,
  repoRoot: string
): void => {
  git.unsetLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.installed);
  git.unsetLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.version);
  git.unsetLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.hooks);
  git.unsetLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.installedAt);
  git.unsetLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts);
};
