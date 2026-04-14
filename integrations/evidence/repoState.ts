import { execFileSync as runBinarySync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readLifecycleStatus } from '../lifecycle/status';
import { resolvePumukiVersionMetadata } from '../lifecycle/packageInfo';
import { readPersistedHardModeConfig } from '../policy/policyProfiles';
import type { RepoHardModeState, RepoHookState, RepoState } from './schema';
import { readRepoTrackingState } from './trackingContract';

type HookStateShape = { exists: boolean; managedBlockPresent: boolean };

type LifecycleStatusShape = {
  lifecycleState: {
    installed?: string;
    version?: string;
  };
  packageVersion?: string;
  hookStatus: {
    'pre-commit': HookStateShape;
    'pre-push': HookStateShape;
  };
};

const hasGitRepo = (repoRoot: string): boolean => existsSync(join(repoRoot, '.git'));

const safeRunGit = (repoRoot: string, args: ReadonlyArray<string>) => {
  if (!hasGitRepo(repoRoot)) {
    return undefined;
  }
  try {
    return runBinarySync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
};

const toCount = (value: unknown): number => {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
};

const toHookState = (value: HookStateShape | undefined): RepoHookState => {
  if (!value?.exists) {
    return 'missing';
  }
  return value.managedBlockPresent ? 'managed' : 'unmanaged';
};

const toStatusLines = (statusShort: string): string[] =>
  statusShort
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

const toAheadBehind = (
  repoRoot: string,
  upstream?: string
): { ahead: number; behind: number } => {
  if (!upstream) {
    return { ahead: 0, behind: 0 };
  }
  const aheadBehindRaw = safeRunGit(repoRoot, ['rev-list', '--left-right', '--count', `${upstream}...HEAD`]);
  if (!aheadBehindRaw) {
    return { ahead: 0, behind: 0 };
  }
  const parts = aheadBehindRaw.split(/\s+/).map((value) => Number.parseInt(value, 10));
  return {
    behind: toCount(parts[0]),
    ahead: toCount(parts[1]),
  };
};

const readLifecycleStatusSafe = (repoRoot: string): LifecycleStatusShape => {
  try {
    return readLifecycleStatus({
      cwd: repoRoot,
    });
  } catch {
    return {
      lifecycleState: {},
      packageVersion: undefined,
      hookStatus: {
        'pre-commit': { exists: false, managedBlockPresent: false },
        'pre-push': { exists: false, managedBlockPresent: false },
      },
    };
  }
};

const toNormalizedProfile = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readHardModeState = (repoRoot: string): RepoHardModeState | undefined => {
  const persisted = readPersistedHardModeConfig(repoRoot);
  if (!persisted) {
    return undefined;
  }
  return {
    enabled: persisted.enabled,
    profile: toNormalizedProfile(persisted.profileName),
    config_path: persisted.configPath,
  };
};

export const captureRepoState = (repoRoot: string): RepoState => {
  const gitAvailable = hasGitRepo(repoRoot);
  const branch = safeRunGit(repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const upstream = safeRunGit(repoRoot, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  const statusLines = toStatusLines(safeRunGit(repoRoot, ['status', '--short']) ?? '');
  const staged = statusLines.filter((line) => line[0] && line[0] !== '?' && line[0] !== ' ').length;
  const unstaged = statusLines.filter((line) => line[1] && line[1] !== ' ').length;
  const pendingChanges = statusLines.length;
  const { ahead, behind } = toAheadBehind(repoRoot, upstream);
  const lifecycle = readLifecycleStatusSafe(repoRoot);
  const versionMetadata = resolvePumukiVersionMetadata({ repoRoot });
  const consumerFacingVersion = versionMetadata.resolvedVersion;
  const installedVersion = versionMetadata.consumerInstalledVersion;
  const hardModeState = readHardModeState(repoRoot);
  const trackingState = readRepoTrackingState(repoRoot);

  return {
    repo_root: repoRoot,
    git: {
      available: gitAvailable,
      branch: branch ?? null,
      upstream: upstream ?? null,
      ahead,
      behind,
      dirty: statusLines.length > 0,
      staged: toCount(staged),
      unstaged: toCount(unstaged),
      pending_changes: toCount(pendingChanges),
    },
    lifecycle: {
      installed: lifecycle.lifecycleState.installed === 'true',
      // package/lifecycle version should be stable from consumer perspective.
      package_version: consumerFacingVersion,
      lifecycle_version: consumerFacingVersion,
      package_version_source: versionMetadata.source,
      package_version_runtime: versionMetadata.runtimeVersion,
      package_version_installed: installedVersion,
      hooks: {
        pre_commit: toHookState(lifecycle.hookStatus['pre-commit']),
        pre_push: toHookState(lifecycle.hookStatus['pre-push']),
      },
      hard_mode: hardModeState,
      tracking: trackingState,
    },
  };
};
