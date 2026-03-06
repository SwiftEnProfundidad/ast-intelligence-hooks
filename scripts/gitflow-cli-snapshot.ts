import { execFileSync as runBinarySync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { GitflowSnapshot } from './gitflow-cli-types';

const safeRunGit = (repoRoot: string, args: ReadonlyArray<string>): string | undefined => {
  if (!existsSync(join(repoRoot, '.git'))) {
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

const toStatusLines = (statusShort: string): ReadonlyArray<string> => {
  return statusShort
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
};

const toCount = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
};

const buildUnavailableGitflowSnapshot = (): GitflowSnapshot => {
  return {
    available: false,
    branch: null,
    upstream: null,
    ahead: 0,
    behind: 0,
    dirty: false,
    staged: 0,
    unstaged: 0,
  };
};

export const parseGitflowAheadBehind = (value: string | undefined): { ahead: number; behind: number } => {
  if (!value) {
    return { ahead: 0, behind: 0 };
  }
  const parts = value.split(/\s+/).map((part) => Number.parseInt(part, 10));
  return {
    behind: toCount(parts[0]),
    ahead: toCount(parts[1]),
  };
};

export const parseGitflowStatusShort = (
  statusShort: string
): Pick<GitflowSnapshot, 'dirty' | 'staged' | 'unstaged'> => {
  const statusLines = toStatusLines(statusShort);
  const staged = statusLines.filter((line) => line[0] && line[0] !== '?' && line[0] !== ' ').length;
  const unstaged = statusLines.filter((line) => line[1] && line[1] !== ' ').length;

  return {
    dirty: statusLines.length > 0,
    staged: toCount(staged),
    unstaged: toCount(unstaged),
  };
};

export const readGitflowSnapshot = (repoRoot: string): GitflowSnapshot => {
  if (!existsSync(join(repoRoot, '.git'))) {
    return buildUnavailableGitflowSnapshot();
  }

  const branch = safeRunGit(repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const upstream = safeRunGit(repoRoot, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  const statusShort = safeRunGit(repoRoot, ['status', '--short']) ?? '';
  const worktree = parseGitflowStatusShort(statusShort);
  const aheadBehindRaw = upstream
    ? safeRunGit(repoRoot, ['rev-list', '--left-right', '--count', `${upstream}...HEAD`])
    : undefined;
  const aheadBehind = parseGitflowAheadBehind(aheadBehindRaw);

  return {
    available: true,
    branch: branch ?? null,
    upstream: upstream ?? null,
    ahead: aheadBehind.ahead,
    behind: aheadBehind.behind,
    dirty: worktree.dirty,
    staged: worktree.staged,
    unstaged: worktree.unstaged,
  };
};
