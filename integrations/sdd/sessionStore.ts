import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  LifecycleGitService,
  type ILifecycleGitService,
} from '../lifecycle/gitService';
import type { SddSessionState } from './types';

const SDD_KEYS = {
  active: 'pumuki.sdd.session.active',
  change: 'pumuki.sdd.session.change',
  updatedAt: 'pumuki.sdd.session.updatedAt',
  expiresAt: 'pumuki.sdd.session.expiresAt',
  ttlMinutes: 'pumuki.sdd.session.ttlMinutes',
} as const;

const DEFAULT_TTL_MINUTES = 45;

const resolveRepoRoot = (cwd: string, git: ILifecycleGitService): string =>
  git.resolveRepoRoot(cwd);

const nowIso = (): string => new Date().toISOString();

const addMinutesIso = (minutes: number): string =>
  new Date(Date.now() + minutes * 60_000).toISOString();

const parsePositiveMinutes = (value?: number): number =>
  Number.isFinite(value) && (value as number) > 0
    ? Math.floor(value as number)
    : DEFAULT_TTL_MINUTES;

const computeValidity = (expiresAt?: string): {
  valid: boolean;
  remainingSeconds?: number;
} => {
  if (!expiresAt) {
    return { valid: false };
  }
  const target = new Date(expiresAt).getTime();
  if (!Number.isFinite(target)) {
    return { valid: false };
  }
  const remaining = Math.floor((target - Date.now()) / 1000);
  if (remaining <= 0) {
    return { valid: false, remainingSeconds: 0 };
  }
  return { valid: true, remainingSeconds: remaining };
};

const readConfig = (
  repoRoot: string,
  git: ILifecycleGitService
): SddSessionState => {
  const active = git.localConfig(repoRoot, SDD_KEYS.active) === 'true';
  const changeId = git.localConfig(repoRoot, SDD_KEYS.change) ?? undefined;
  const updatedAt = git.localConfig(repoRoot, SDD_KEYS.updatedAt) ?? undefined;
  const expiresAt = git.localConfig(repoRoot, SDD_KEYS.expiresAt) ?? undefined;
  const ttlRaw = git.localConfig(repoRoot, SDD_KEYS.ttlMinutes);
  const ttlMinutes =
    typeof ttlRaw === 'string' && ttlRaw.trim().length > 0
      ? Number.parseInt(ttlRaw, 10)
      : undefined;

  const validity = computeValidity(expiresAt);
  return {
    repoRoot,
    active,
    changeId,
    updatedAt,
    expiresAt,
    ttlMinutes,
    valid: active && !!changeId && validity.valid,
    remainingSeconds: validity.remainingSeconds,
  };
};

const ensureChangePath = (repoRoot: string, changeId: string): {
  exists: boolean;
  archived: boolean;
} => {
  const activePath = resolve(repoRoot, 'openspec', 'changes', changeId);
  const archivedPath = resolve(repoRoot, 'openspec', 'changes', 'archive', changeId);
  return {
    exists: existsSync(activePath),
    archived: existsSync(archivedPath),
  };
};

export const readSddSession = (
  cwd = process.cwd(),
  git: ILifecycleGitService = new LifecycleGitService()
): SddSessionState => {
  const repoRoot = resolveRepoRoot(cwd, git);
  return readConfig(repoRoot, git);
};

export const openSddSession = (params: {
  changeId: string;
  ttlMinutes?: number;
  cwd?: string;
  git?: ILifecycleGitService;
}): SddSessionState => {
  const git = params.git ?? new LifecycleGitService();
  const repoRoot = resolveRepoRoot(params.cwd ?? process.cwd(), git);
  const changeId = params.changeId.trim();
  const changeState = ensureChangePath(repoRoot, changeId);
  if (!changeState.exists) {
    throw new Error(`OpenSpec change "${changeId}" not found in openspec/changes.`);
  }
  if (changeState.archived) {
    throw new Error(`OpenSpec change "${changeId}" is archived and cannot be used as active SDD session.`);
  }

  const ttlMinutes = parsePositiveMinutes(params.ttlMinutes);
  git.applyLocalConfig(repoRoot, SDD_KEYS.active, 'true');
  git.applyLocalConfig(repoRoot, SDD_KEYS.change, changeId);
  git.applyLocalConfig(repoRoot, SDD_KEYS.updatedAt, nowIso());
  git.applyLocalConfig(repoRoot, SDD_KEYS.expiresAt, addMinutesIso(ttlMinutes));
  git.applyLocalConfig(repoRoot, SDD_KEYS.ttlMinutes, String(ttlMinutes));
  return readConfig(repoRoot, git);
};

export const refreshSddSession = (params?: {
  ttlMinutes?: number;
  cwd?: string;
  git?: ILifecycleGitService;
}): SddSessionState => {
  const git = params?.git ?? new LifecycleGitService();
  const repoRoot = resolveRepoRoot(params?.cwd ?? process.cwd(), git);
  const current = readConfig(repoRoot, git);
  if (!current.active || !current.changeId) {
    throw new Error('No active SDD session to refresh. Run `pumuki sdd session --open --change=<id>` first.');
  }
  const ttlMinutes = parsePositiveMinutes(params?.ttlMinutes ?? current.ttlMinutes);
  git.applyLocalConfig(repoRoot, SDD_KEYS.updatedAt, nowIso());
  git.applyLocalConfig(repoRoot, SDD_KEYS.expiresAt, addMinutesIso(ttlMinutes));
  git.applyLocalConfig(repoRoot, SDD_KEYS.ttlMinutes, String(ttlMinutes));
  return readConfig(repoRoot, git);
};

export const closeSddSession = (
  cwd = process.cwd(),
  git: ILifecycleGitService = new LifecycleGitService()
): SddSessionState => {
  const repoRoot = resolveRepoRoot(cwd, git);
  git.clearLocalConfig(repoRoot, SDD_KEYS.active);
  git.clearLocalConfig(repoRoot, SDD_KEYS.change);
  git.clearLocalConfig(repoRoot, SDD_KEYS.updatedAt);
  git.clearLocalConfig(repoRoot, SDD_KEYS.expiresAt);
  git.clearLocalConfig(repoRoot, SDD_KEYS.ttlMinutes);
  return readConfig(repoRoot, git);
};
