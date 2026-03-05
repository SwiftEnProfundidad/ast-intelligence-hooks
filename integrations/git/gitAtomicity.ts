import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GitService, type IGitService } from './GitService';

export type GitAtomicityStage = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';

export type GitAtomicityViolation = {
  code:
    | 'GIT_ATOMICITY_TOO_MANY_FILES'
    | 'GIT_ATOMICITY_TOO_MANY_SCOPES'
    | 'GIT_ATOMICITY_COMMIT_MESSAGE_TRACEABILITY';
  message: string;
  remediation: string;
};

export type GitAtomicityEvaluation = {
  enabled: boolean;
  allowed: boolean;
  violations: ReadonlyArray<GitAtomicityViolation>;
};

type GitAtomicityConfig = {
  enabled: boolean;
  maxFiles: number;
  maxScopes: number;
  enforceCommitMessagePattern: boolean;
  commitMessagePattern: string;
};

const ATOMICITY_CONFIG_FILE = '.pumuki/git-atomicity.json';
const DEFAULT_COMMIT_PATTERN =
  '^(feat|fix|chore|refactor|docs|test|perf|build|ci|revert)(\\([^)]+\\))?:\\s.+$';

const defaultConfig: GitAtomicityConfig = {
  enabled: true,
  maxFiles: 25,
  maxScopes: 2,
  enforceCommitMessagePattern: true,
  commitMessagePattern: DEFAULT_COMMIT_PATTERN,
};

const parseBooleanEnv = (value: string | undefined): boolean | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) {
    return undefined;
  }
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false;
  }
  return undefined;
};

const parsePositiveIntegerEnv = (value: string | undefined): number | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const parseFileConfig = (repoRoot: string): Partial<GitAtomicityConfig> | undefined => {
  const filePath = resolve(repoRoot, ATOMICITY_CONFIG_FILE);
  if (!existsSync(filePath)) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
    if (!isRecord(parsed)) {
      return undefined;
    }
    const fromFile: Partial<GitAtomicityConfig> = {};
    if (typeof parsed.enabled === 'boolean') {
      fromFile.enabled = parsed.enabled;
    }
    if (Number.isInteger(parsed.maxFiles) && Number(parsed.maxFiles) > 0) {
      fromFile.maxFiles = Number(parsed.maxFiles);
    }
    if (Number.isInteger(parsed.maxScopes) && Number(parsed.maxScopes) > 0) {
      fromFile.maxScopes = Number(parsed.maxScopes);
    }
    if (typeof parsed.enforceCommitMessagePattern === 'boolean') {
      fromFile.enforceCommitMessagePattern = parsed.enforceCommitMessagePattern;
    }
    if (isNonEmptyString(parsed.commitMessagePattern)) {
      fromFile.commitMessagePattern = parsed.commitMessagePattern;
    }
    return fromFile;
  } catch {
    return undefined;
  }
};

const resolveConfig = (repoRoot: string): GitAtomicityConfig => {
  const fromFile = parseFileConfig(repoRoot) ?? {};

  return {
    enabled:
      parseBooleanEnv(process.env.PUMUKI_GIT_ATOMICITY_ENABLED)
      ?? fromFile.enabled
      ?? defaultConfig.enabled,
    maxFiles:
      parsePositiveIntegerEnv(process.env.PUMUKI_GIT_ATOMICITY_MAX_FILES)
      ?? fromFile.maxFiles
      ?? defaultConfig.maxFiles,
    maxScopes:
      parsePositiveIntegerEnv(process.env.PUMUKI_GIT_ATOMICITY_MAX_SCOPES)
      ?? fromFile.maxScopes
      ?? defaultConfig.maxScopes,
    enforceCommitMessagePattern:
      parseBooleanEnv(process.env.PUMUKI_GIT_ATOMICITY_ENFORCE_COMMIT_PATTERN)
      ?? fromFile.enforceCommitMessagePattern
      ?? defaultConfig.enforceCommitMessagePattern,
    commitMessagePattern:
      process.env.PUMUKI_GIT_ATOMICITY_COMMIT_PATTERN?.trim()
      || fromFile.commitMessagePattern
      || defaultConfig.commitMessagePattern,
  };
};

const parseLines = (value: string): ReadonlyArray<string> =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const isUnresolvableRevisionError = (error: unknown): boolean => {
  const message = toErrorMessage(error).toLowerCase();
  return (
    message.includes('unknown revision') ||
    message.includes('bad revision') ||
    message.includes('ambiguous argument') ||
    message.includes('argumento ambiguo') ||
    message.includes('invalid object name') ||
    message.includes('not a valid object name')
  );
};

const resolveScopeKey = (filePath: string): string => {
  const normalized = filePath.replace(/\\/g, '/').trim();
  const segments = normalized.split('/').filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return '';
  }
  if (
    (segments[0] === 'apps' || segments[0] === 'packages' || segments[0] === 'services')
    && segments.length >= 2
  ) {
    return `${segments[0]}/${segments[1]}`;
  }
  return segments[0] ?? '';
};

const collectChangedPaths = (params: {
  git: IGitService;
  repoRoot: string;
  stage: GitAtomicityStage;
  fromRef?: string;
  toRef?: string;
}): ReadonlyArray<string> => {
  if (params.stage === 'PRE_COMMIT') {
    return parseLines(
      params.git.runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR'], params.repoRoot)
    );
  }
  if (!params.fromRef || !params.toRef) {
    return [];
  }
  try {
    return parseLines(
      params.git.runGit(
        ['diff', '--name-only', '--diff-filter=ACMR', `${params.fromRef}..${params.toRef}`],
        params.repoRoot
      )
    );
  } catch (error) {
    if (isUnresolvableRevisionError(error)) {
      return [];
    }
    throw error;
  }
};

const collectCommitSubjects = (params: {
  git: IGitService;
  repoRoot: string;
  fromRef?: string;
  toRef?: string;
}): ReadonlyArray<string> => {
  if (!params.fromRef || !params.toRef) {
    return [];
  }
  try {
    return parseLines(
      params.git.runGit(['log', '--format=%s', `${params.fromRef}..${params.toRef}`], params.repoRoot)
    );
  } catch (error) {
    if (isUnresolvableRevisionError(error)) {
      return [];
    }
    throw error;
  }
};

export const evaluateGitAtomicity = (params: {
  git?: IGitService;
  repoRoot?: string;
  stage: GitAtomicityStage;
  fromRef?: string;
  toRef?: string;
}): GitAtomicityEvaluation => {
  const git = params.git ?? new GitService();
  const repoRoot = params.repoRoot ? resolve(params.repoRoot) : git.resolveRepoRoot();
  const config = resolveConfig(repoRoot);
  if (!config.enabled) {
    return {
      enabled: false,
      allowed: true,
      violations: [],
    };
  }

  const violations: GitAtomicityViolation[] = [];
  const changedPaths = collectChangedPaths({
    git,
    repoRoot,
    stage: params.stage,
    fromRef: params.fromRef,
    toRef: params.toRef,
  });

  if (changedPaths.length > config.maxFiles) {
    violations.push({
      code: 'GIT_ATOMICITY_TOO_MANY_FILES',
      message:
        `Git atomicity guard blocked at ${params.stage}: changed_files=${changedPaths.length} exceeds max_files=${config.maxFiles}.`,
      remediation: `Divide los cambios en commits más pequeños (máximo ${config.maxFiles} archivos por commit).`,
    });
  }

  const scopeKeys = new Set(
    changedPaths
      .map((filePath) => resolveScopeKey(filePath))
      .filter((scopeKey) => scopeKey.length > 0)
  );
  if (scopeKeys.size > config.maxScopes) {
    violations.push({
      code: 'GIT_ATOMICITY_TOO_MANY_SCOPES',
      message:
        `Git atomicity guard blocked at ${params.stage}: changed_scopes=${scopeKeys.size} exceeds max_scopes=${config.maxScopes}.`,
      remediation: `Agrupa cambios por ámbito funcional (máximo ${config.maxScopes} scopes por commit).`,
    });
  }

  if (config.enforceCommitMessagePattern && params.stage !== 'PRE_COMMIT') {
    let pattern: RegExp;
    try {
      pattern = new RegExp(config.commitMessagePattern);
    } catch {
      pattern = new RegExp(DEFAULT_COMMIT_PATTERN);
    }
    const subjects = collectCommitSubjects({
      git,
      repoRoot,
      fromRef: params.fromRef,
      toRef: params.toRef,
    });
    const invalidSubjects = subjects.filter((subject) => !pattern.test(subject));
    if (invalidSubjects.length > 0) {
      const sample = invalidSubjects.slice(0, 3).join(' | ');
      violations.push({
        code: 'GIT_ATOMICITY_COMMIT_MESSAGE_TRACEABILITY',
        message:
          `Git atomicity guard blocked at ${params.stage}: commit messages without traceable pattern detected (${invalidSubjects.length}). sample=[${sample}].`,
        remediation:
          'Reescribe los commits para cumplir el patrón de trazabilidad configurado (por ejemplo Conventional Commits).',
      });
    }
  }

  return {
    enabled: true,
    allowed: violations.length === 0,
    violations,
  };
};
