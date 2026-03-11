import { GitService, type IGitService } from './GitService';

export type WorktreeAtomicSlice = {
  scope: string;
  files: ReadonlyArray<string>;
  staged_command: string;
};

export type WorktreeAtomicSlicePlan = {
  total_files: number;
  slices: ReadonlyArray<WorktreeAtomicSlice>;
};

const shellQuote = (value: string): string => {
  const escaped = value.replace(/'/g, `'\\''`);
  return `'${escaped}'`;
};

const normalizePath = (value: string): string =>
  value.replace(/\\/g, '/').replace(/^"+|"+$/g, '').trim();

const parseChangedPath = (line: string): string | null => {
  if (line.length < 4) {
    return null;
  }
  const raw = line.slice(3).trim();
  if (raw.length === 0) {
    return null;
  }
  if (raw.includes(' -> ')) {
    const renamed = raw.split(' -> ').pop();
    if (!renamed) {
      return null;
    }
    const normalizedRenamed = normalizePath(renamed);
    return normalizedRenamed.length > 0 ? normalizedRenamed : null;
  }
  const normalized = normalizePath(raw);
  return normalized.length > 0 ? normalized : null;
};

const resolveScopeKey = (filePath: string): string => {
  const segments = filePath.split('/').filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return 'root';
  }
  if (segments.length === 1) {
    return 'root';
  }
  if (
    (segments[0] === 'apps' || segments[0] === 'packages' || segments[0] === 'services')
    && segments.length >= 2
  ) {
    return `${segments[0]}/${segments[1]}`;
  }
  return segments[0] ?? 'root';
};

const collectChangedPaths = (params: {
  git: IGitService;
  repoRoot: string;
}): ReadonlyArray<string> => {
  try {
    const output = params.git.runGit(['status', '--short', '--untracked-files=all'], params.repoRoot);
    const files = output
      .split('\n')
      .map((line) => parseChangedPath(line))
      .filter((line): line is string => typeof line === 'string' && line.length > 0);
    return [...new Set(files)];
  } catch {
    return [];
  }
};

const toStageCommand = (files: ReadonlyArray<string>): string => {
  if (files.length === 0) {
    return 'git add -p';
  }
  const stagedFiles = files.slice(0, Math.min(files.length, 8));
  const quoted = stagedFiles.map((file) => shellQuote(file)).join(' ');
  return `git add -- ${quoted}`;
};

export const collectWorktreeAtomicSlices = (params: {
  repoRoot: string;
  maxSlices?: number;
  maxFilesPerSlice?: number;
  git?: IGitService;
}): WorktreeAtomicSlicePlan => {
  const maxSlices = Math.max(1, Math.trunc(params.maxSlices ?? 3));
  const maxFilesPerSlice = Math.max(1, Math.trunc(params.maxFilesPerSlice ?? 6));
  const git = params.git ?? new GitService();
  const changedPaths = collectChangedPaths({
    git,
    repoRoot: params.repoRoot,
  });

  if (changedPaths.length === 0) {
    return {
      total_files: 0,
      slices: [],
    };
  }

  const grouped = new Map<string, string[]>();
  for (const filePath of changedPaths) {
    const scope = resolveScopeKey(filePath);
    const current = grouped.get(scope) ?? [];
    current.push(filePath);
    grouped.set(scope, current);
  }

  const orderedScopes = [...grouped.entries()]
    .sort((left, right) => right[1].length - left[1].length || left[0].localeCompare(right[0]))
    .slice(0, maxSlices);

  const slices: WorktreeAtomicSlice[] = orderedScopes.map(([scope, files]) => {
    const sliceFiles = [...files].sort().slice(0, maxFilesPerSlice);
    return {
      scope,
      files: sliceFiles,
      staged_command: toStageCommand(sliceFiles),
    };
  });

  return {
    total_files: changedPaths.length,
    slices,
  };
};
