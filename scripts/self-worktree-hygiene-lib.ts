import { execFileSync } from 'node:child_process';

export type SelfWorktreeHygieneViolationCode =
  | 'SELF_WORKTREE_TOO_MANY_FILES'
  | 'SELF_WORKTREE_TOO_MANY_SCOPES';

export type SelfWorktreeHygieneViolation = {
  code: SelfWorktreeHygieneViolationCode;
  message: string;
  remediation: string;
};

export type SelfWorktreeHygieneScope = {
  scope: string;
  files: number;
};

export type SelfWorktreeHygieneSlice = {
  scope: string;
  files: ReadonlyArray<string>;
  stagedCommand: string;
};

export type SelfWorktreeHygieneReport = {
  repoRoot: string;
  changedFiles: number;
  changedScopes: number;
  maxFiles: number;
  maxScopes: number;
  blocked: boolean;
  scopes: ReadonlyArray<SelfWorktreeHygieneScope>;
  slices: ReadonlyArray<SelfWorktreeHygieneSlice>;
  violations: ReadonlyArray<SelfWorktreeHygieneViolation>;
};

const DEFAULT_MAX_FILES = 25;
const DEFAULT_MAX_SCOPES = 2;

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

const shellQuote = (value: string): string => {
  const escaped = value.replace(/'/g, `'\\''`);
  return `'${escaped}'`;
};

const toStageCommand = (files: ReadonlyArray<string>): string => {
  if (files.length === 0) {
    return 'git add -p';
  }
  const stagedFiles = files.slice(0, Math.min(files.length, 8));
  const quoted = stagedFiles.map((file) => shellQuote(file)).join(' ');
  return `git add -- ${quoted}`;
};

const buildSlices = (
  grouped: ReadonlyMap<string, ReadonlyArray<string>>,
  maxScopes: number
): ReadonlyArray<SelfWorktreeHygieneSlice> =>
  [...grouped.entries()]
    .sort((left, right) => right[1].length - left[1].length || left[0].localeCompare(right[0]))
    .slice(0, Math.max(1, maxScopes + 1))
    .map(([scope, files]) => {
      const sliceFiles = [...files].sort().slice(0, 8);
      return {
        scope,
        files: sliceFiles,
        stagedCommand: toStageCommand(sliceFiles),
      };
    });

const buildSlicesRemediation = (slices: ReadonlyArray<SelfWorktreeHygieneSlice>): string => {
  if (slices.length === 0) {
    return 'Reduce el worktree a slices atomicos antes de continuar.';
  }
  const rendered = slices
    .map((slice) => `${slice.scope}: ${slice.stagedCommand}`)
    .join(' | ');
  return `Reduce el worktree a slices atomicos. Slices sugeridos: ${rendered}`;
};

export const inspectSelfWorktreeHygieneFromStatus = (params: {
  repoRoot: string;
  statusOutput: string;
  maxFiles?: number;
  maxScopes?: number;
}): SelfWorktreeHygieneReport => {
  const maxFiles = Math.max(1, Math.trunc(params.maxFiles ?? DEFAULT_MAX_FILES));
  const maxScopes = Math.max(1, Math.trunc(params.maxScopes ?? DEFAULT_MAX_SCOPES));
  const changedPaths = [
    ...new Set(
      params.statusOutput
        .split(/\r?\n/)
        .map((line) => parseChangedPath(line))
        .filter((line): line is string => typeof line === 'string' && line.length > 0)
    ),
  ];

  const grouped = new Map<string, string[]>();
  for (const changedPath of changedPaths) {
    const scope = resolveScopeKey(changedPath);
    const current = grouped.get(scope) ?? [];
    current.push(changedPath);
    grouped.set(scope, current);
  }

  const scopes = [...grouped.entries()]
    .map(([scope, files]) => ({
      scope,
      files: files.length,
    }))
    .sort((left, right) => right.files - left.files || left.scope.localeCompare(right.scope));

  const slices = buildSlices(grouped, maxScopes);
  const violations: SelfWorktreeHygieneViolation[] = [];

  if (changedPaths.length > maxFiles) {
    violations.push({
      code: 'SELF_WORKTREE_TOO_MANY_FILES',
      message:
        `Self worktree hygiene blocked: changed_files=${changedPaths.length} exceeds max_files=${maxFiles}.`,
      remediation: buildSlicesRemediation(slices),
    });
  }

  if (grouped.size > maxScopes) {
    violations.push({
      code: 'SELF_WORKTREE_TOO_MANY_SCOPES',
      message:
        `Self worktree hygiene blocked: changed_scopes=${grouped.size} exceeds max_scopes=${maxScopes}.`,
      remediation: buildSlicesRemediation(slices),
    });
  }

  return {
    repoRoot: params.repoRoot,
    changedFiles: changedPaths.length,
    changedScopes: grouped.size,
    maxFiles,
    maxScopes,
    blocked: violations.length > 0,
    scopes,
    slices,
    violations,
  };
};

export const collectSelfWorktreeHygieneReport = (params: {
  repoRoot: string;
  maxFiles?: number;
  maxScopes?: number;
}): SelfWorktreeHygieneReport => {
  const statusOutput = execFileSync('git', ['status', '--short', '--untracked-files=all'], {
    cwd: params.repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return inspectSelfWorktreeHygieneFromStatus({
    repoRoot: params.repoRoot,
    statusOutput,
    maxFiles: params.maxFiles,
    maxScopes: params.maxScopes,
  });
};
