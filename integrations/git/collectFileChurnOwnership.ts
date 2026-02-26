import { resolve } from 'node:path';
import type { IGitService } from './GitService';
import { GitService } from './GitService';
import { hasAllowedExtension } from './gitDiffUtils';

export type FileChurnOwnershipSignal = {
  path: string;
  commits: number;
  distinctAuthors: number;
  churnAddedLines: number;
  churnDeletedLines: number;
  churnTotalLines: number;
  lastTouchedAt: string | null;
};

type MutableFileChurnOwnershipSignal = {
  path: string;
  commits: Set<string>;
  authors: Set<string>;
  churnAddedLines: number;
  churnDeletedLines: number;
  lastTouchedAt: string | null;
};

const COMMIT_MARKER = '__PUMUKI_COMMIT__';
const DEFAULT_SINCE_DAYS = 90;
const defaultGit: IGitService = new GitService();

const parsePositiveIntegerOrZero = (value: string): number => {
  if (value === '-') {
    return 0;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
};

const normalizeNumstatPath = (value: string): string => {
  const braceRename = value.match(/^(.*)\{(.+?) => (.+?)\}(.*)$/);
  if (braceRename) {
    return `${braceRename[1]}${braceRename[3]}${braceRename[4]}`.trim();
  }
  const renameSeparator = ' => ';
  const renameIndex = value.lastIndexOf(renameSeparator);
  if (renameIndex >= 0) {
    return value.slice(renameIndex + renameSeparator.length).trim();
  }
  return value.trim();
};

const parseCommitMetadata = (
  line: string
): { commitHash: string; authorKey: string; authoredAt: string | null } | null => {
  const parts = line.split('|');
  if (parts.length < 4) {
    return null;
  }
  const commitHash = parts[0]?.trim() ?? '';
  const authorName = parts[1]?.trim() ?? '';
  const authorEmail = parts[2]?.trim().toLowerCase() ?? '';
  const authoredAtRaw = parts.slice(3).join('|').trim();
  if (!commitHash) {
    return null;
  }
  const authorKey = authorEmail || authorName || 'unknown-author';
  const parsedAuthoredAt = Date.parse(authoredAtRaw);
  const authoredAt = Number.isFinite(parsedAuthoredAt) ? authoredAtRaw : null;
  return { commitHash, authorKey, authoredAt };
};

const getMostRecentTimestamp = (a: string | null, b: string | null): string | null => {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  const parsedA = Date.parse(a);
  const parsedB = Date.parse(b);
  if (!Number.isFinite(parsedA)) {
    return b;
  }
  if (!Number.isFinite(parsedB)) {
    return a;
  }
  return parsedB > parsedA ? b : a;
};

const shouldIncludePath = (path: string, extensions: ReadonlyArray<string>): boolean => {
  if (extensions.length === 0) {
    return true;
  }
  return hasAllowedExtension(path, extensions);
};

export const collectFileChurnOwnership = (params?: {
  git?: IGitService;
  repoRoot?: string;
  sinceDays?: number;
  extensions?: ReadonlyArray<string>;
}): ReadonlyArray<FileChurnOwnershipSignal> => {
  const git = params?.git ?? defaultGit;
  const sinceDays = params?.sinceDays ?? DEFAULT_SINCE_DAYS;
  if (!Number.isInteger(sinceDays) || sinceDays <= 0) {
    throw new Error('sinceDays must be a positive integer');
  }
  const extensions = params?.extensions ?? [];
  const repoRoot = params?.repoRoot ? resolve(params.repoRoot) : git.resolveRepoRoot();
  const logOutput = git.runGit(
    [
      'log',
      '--no-merges',
      '--numstat',
      '--date=iso-strict',
      `--pretty=format:${COMMIT_MARKER}%n%H|%aN|%aE|%aI`,
      `--since=${sinceDays}.days`,
    ],
    repoRoot
  );

  const byPath = new Map<string, MutableFileChurnOwnershipSignal>();
  let expectsMetadata = false;
  let currentCommitHash = '';
  let currentAuthorKey = '';
  let currentAuthoredAt: string | null = null;

  for (const line of logOutput.split('\n')) {
    if (line.trim() === COMMIT_MARKER) {
      expectsMetadata = true;
      currentCommitHash = '';
      currentAuthorKey = '';
      currentAuthoredAt = null;
      continue;
    }

    if (expectsMetadata) {
      expectsMetadata = false;
      const metadata = parseCommitMetadata(line);
      if (!metadata) {
        continue;
      }
      currentCommitHash = metadata.commitHash;
      currentAuthorKey = metadata.authorKey;
      currentAuthoredAt = metadata.authoredAt;
      continue;
    }

    if (!currentCommitHash) {
      continue;
    }

    const columns = line.split('\t');
    if (columns.length < 3) {
      continue;
    }

    const normalizedPath = normalizeNumstatPath(columns.slice(2).join('\t'));
    if (!normalizedPath || !shouldIncludePath(normalizedPath, extensions)) {
      continue;
    }

    const added = parsePositiveIntegerOrZero(columns[0] ?? '');
    const deleted = parsePositiveIntegerOrZero(columns[1] ?? '');
    const previous = byPath.get(normalizedPath);
    const next =
      previous ??
      ({
        path: normalizedPath,
        commits: new Set<string>(),
        authors: new Set<string>(),
        churnAddedLines: 0,
        churnDeletedLines: 0,
        lastTouchedAt: null,
      } satisfies MutableFileChurnOwnershipSignal);

    next.commits.add(currentCommitHash);
    next.authors.add(currentAuthorKey);
    next.churnAddedLines += added;
    next.churnDeletedLines += deleted;
    next.lastTouchedAt = getMostRecentTimestamp(next.lastTouchedAt, currentAuthoredAt);
    byPath.set(normalizedPath, next);
  }

  return [...byPath.values()]
    .map((item) => {
      const churnTotalLines = item.churnAddedLines + item.churnDeletedLines;
      return {
        path: item.path,
        commits: item.commits.size,
        distinctAuthors: item.authors.size,
        churnAddedLines: item.churnAddedLines,
        churnDeletedLines: item.churnDeletedLines,
        churnTotalLines,
        lastTouchedAt: item.lastTouchedAt,
      } satisfies FileChurnOwnershipSignal;
    })
    .sort(
      (a, b) =>
        b.churnTotalLines - a.churnTotalLines ||
        b.commits - a.commits ||
        b.distinctAuthors - a.distinctAuthors ||
        a.path.localeCompare(b.path)
    );
};
