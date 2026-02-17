import { PUMUKI_CONFIG_KEYS, PUMUKI_MANAGED_HOOKS } from './constants';
import type { ILifecycleGitService } from './gitService';

export type LifecycleState = {
  installed?: string;
  version?: string;
  hooks?: string;
  installedAt?: string;
};

export const readLifecycleState = (
  git: ILifecycleGitService,
  repoRoot: string
): LifecycleState => ({
  installed: git.getLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.installed),
  version: git.getLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.version),
  hooks: git.getLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.hooks),
  installedAt: git.getLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.installedAt),
});

export const writeLifecycleState = (params: {
  git: ILifecycleGitService;
  repoRoot: string;
  version: string;
}): void => {
  const { git, repoRoot, version } = params;
  git.setLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.installed, 'true');
  git.setLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.version, version);
  git.setLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.hooks, PUMUKI_MANAGED_HOOKS.join(','));
  git.setLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.installedAt, new Date().toISOString());
};

export const clearLifecycleState = (
  git: ILifecycleGitService,
  repoRoot: string
): void => {
  git.unsetLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.installed);
  git.unsetLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.version);
  git.unsetLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.hooks);
  git.unsetLocalConfig(repoRoot, PUMUKI_CONFIG_KEYS.installedAt);
};
