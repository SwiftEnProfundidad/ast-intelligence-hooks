import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { PUMUKI_MANAGED_HOOKS, type PumukiManagedHook } from './constants';
import {
  hasPumukiManagedBlock,
  removePumukiManagedBlock,
  upsertPumukiManagedBlock,
} from './hookBlock';

export type HookInstallResult = {
  changedHooks: ReadonlyArray<PumukiManagedHook>;
};

export type HookUninstallResult = {
  changedHooks: ReadonlyArray<PumukiManagedHook>;
};

export type PumukiHooksDirectoryResolutionSource =
  | 'git-rev-parse'
  | 'git-config'
  | 'default';

export type PumukiHooksDirectoryResolution = {
  path: string;
  source: PumukiHooksDirectoryResolutionSource;
};

const HOOK_FILE_MODE = 0o755;

const resolveGitPath = (repoRoot: string, gitPathTarget: string): string | null => {
  try {
    const resolvedPath = execFileSync('git', ['rev-parse', '--git-path', gitPathTarget], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (resolvedPath.length === 0) {
      return null;
    }
    return isAbsolute(resolvedPath) ? resolvedPath : resolve(repoRoot, resolvedPath);
  } catch {
    return null;
  }
};

const readCoreHooksPathFromGitConfig = (repoRoot: string): string | null => {
  const configPath = join(repoRoot, '.git', 'config');
  if (!existsSync(configPath)) {
    return null;
  }

  let contents = '';
  try {
    contents = readFileSync(configPath, 'utf8');
  } catch {
    return null;
  }

  let inCoreSection = false;
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith(';') || line.startsWith('#')) {
      continue;
    }

    if (line.startsWith('[') && line.endsWith(']')) {
      inCoreSection = /^\[core\]$/i.test(line);
      continue;
    }

    if (!inCoreSection) {
      continue;
    }

    const match = /^hookspath\s*=\s*(.+)$/i.exec(line);
    if (!match) {
      continue;
    }

    let hooksPath = match[1]?.trim() ?? '';
    if (hooksPath.startsWith('"') && hooksPath.endsWith('"')) {
      hooksPath = hooksPath.slice(1, -1);
    }
    if (hooksPath.length === 0) {
      continue;
    }
    return hooksPath;
  }

  return null;
};

export const resolvePumukiHooksDirectory = (
  repoRoot: string
): PumukiHooksDirectoryResolution => {
  const gitPathHooks = resolveGitPath(repoRoot, 'hooks');
  if (gitPathHooks) {
    return {
      path: gitPathHooks,
      source: 'git-rev-parse',
    };
  }

  const hooksPathFromConfig = readCoreHooksPathFromGitConfig(repoRoot);
  if (hooksPathFromConfig) {
    return {
      path: isAbsolute(hooksPathFromConfig)
        ? hooksPathFromConfig
        : resolve(repoRoot, hooksPathFromConfig),
      source: 'git-config',
    };
  }

  return {
    path: join(repoRoot, '.git', 'hooks'),
    source: 'default',
  };
};

const resolveHooksDirectory = (repoRoot: string): string =>
  resolvePumukiHooksDirectory(repoRoot).path;

const resolveHookPath = (repoRoot: string, hook: PumukiManagedHook): string =>
  join(resolveHooksDirectory(repoRoot), hook);

const readHookFileOrEmpty = (hookPath: string): string =>
  existsSync(hookPath) ? readFileSync(hookPath, 'utf8') : '';

const writeHookFile = (hookPath: string, contents: string): void => {
  writeFileSync(hookPath, contents, 'utf8');
  chmodSync(hookPath, HOOK_FILE_MODE);
};

const ensureHooksDirectory = (repoRoot: string): void => {
  mkdirSync(resolveHooksDirectory(repoRoot), { recursive: true });
};

export const installPumukiHooks = (repoRoot: string): HookInstallResult => {
  ensureHooksDirectory(repoRoot);
  const changedHooks: PumukiManagedHook[] = [];

  for (const hook of PUMUKI_MANAGED_HOOKS) {
    const hookPath = resolveHookPath(repoRoot, hook);
    const current = readHookFileOrEmpty(hookPath);
    const updated = upsertPumukiManagedBlock({
      contents: current,
      hook,
    });
    if (updated !== current) {
      writeHookFile(hookPath, updated);
      changedHooks.push(hook);
    }
  }

  return { changedHooks };
};

export const uninstallPumukiHooks = (repoRoot: string): HookUninstallResult => {
  const changedHooks: PumukiManagedHook[] = [];

  for (const hook of PUMUKI_MANAGED_HOOKS) {
    const hookPath = resolveHookPath(repoRoot, hook);
    if (!existsSync(hookPath)) {
      continue;
    }

    const current = readHookFileOrEmpty(hookPath);
    const result = removePumukiManagedBlock(current);
    if (!result.removed) {
      continue;
    }

    if (result.updated === '') {
      unlinkSync(hookPath);
    } else {
      writeHookFile(hookPath, result.updated);
    }

    changedHooks.push(hook);
  }

  return { changedHooks };
};

export const getPumukiHooksStatus = (
  repoRoot: string
): Record<PumukiManagedHook, { exists: boolean; managedBlockPresent: boolean }> => {
  const status = {} as Record<PumukiManagedHook, { exists: boolean; managedBlockPresent: boolean }>;

  for (const hook of PUMUKI_MANAGED_HOOKS) {
    const hookPath = resolveHookPath(repoRoot, hook);
    if (!existsSync(hookPath)) {
      status[hook] = {
        exists: false,
        managedBlockPresent: false,
      };
      continue;
    }

    const contents = readHookFileOrEmpty(hookPath);
    status[hook] = {
      exists: true,
      managedBlockPresent: hasPumukiManagedBlock(contents),
    };
  }

  return status;
};
