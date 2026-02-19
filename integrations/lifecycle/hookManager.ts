import { chmodSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

const HOOK_FILE_MODE = 0o755;

const resolveHooksDirectory = (repoRoot: string): string => join(repoRoot, '.git', 'hooks');

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
