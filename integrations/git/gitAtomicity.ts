import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GitService, type IGitService } from './GitService';
import { collectWorktreeAtomicSlices } from './worktreeAtomicSlices';

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
const MANAGED_EVIDENCE_PATHS = new Set(['.ai_evidence.json', '.AI_EVIDENCE.json']);
const BASELINE_BRANCH_REFS = [
  'origin/main',
  'origin/develop',
  'upstream/main',
  'upstream/develop',
  'main',
  'develop',
];

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

const isManagedEvidencePath = (path: string): boolean =>
  MANAGED_EVIDENCE_PATHS.has(path.replace(/\\/g, '/').trim());

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

const collectScopePaths = (
  changedPaths: ReadonlyArray<string>
): ReadonlyMap<string, ReadonlyArray<string>> => {
  const buckets = new Map<string, Array<string>>();
  for (const path of changedPaths) {
    const scope = resolveScopeKey(path);
    if (scope.length === 0) {
      continue;
    }
    const current = buckets.get(scope) ?? [];
    current.push(path.replace(/\\/g, '/'));
    buckets.set(scope, current);
  }
  const normalized = new Map<string, ReadonlyArray<string>>();
  for (const [scope, paths] of buckets.entries()) {
    normalized.set(scope, [...new Set(paths)].sort());
  }
  return normalized;
};

const isSkillsContractCarrierPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/').trim().toLowerCase();
  return (
    normalized === 'agents.md' ||
    normalized === 'skills.lock.json' ||
    normalized === 'skills.sources.json' ||
    normalized.startsWith('vendor/skills/') ||
    normalized.startsWith('docs/codex-skills/') ||
    normalized === '.pumuki/policy-as-code.json'
  );
};

const isSkillsEnforcementImplementationPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/').trim().toLowerCase();
  return (
    normalized.endsWith('.feature') ||
    normalized.startsWith('core/facts/') ||
    normalized.startsWith('core/rules/presets/heuristics/') ||
    normalized.startsWith('integrations/config/') ||
    normalized === 'integrations/git/runplatformgate.ts' ||
    normalized === 'integrations/git/__tests__/runplatformgate.test.ts' ||
    normalized === 'integrations/git/gitatomicity.ts' ||
    normalized === 'integrations/git/__tests__/gitatomicity.test.ts' ||
    isSkillsContractCarrierPath(normalized)
  );
};

const isSkillsEnforcementRemediationDiff = (
  paths: ReadonlyArray<string>
): boolean => {
  if (paths.length === 0) {
    return false;
  }

  const normalizedPaths = paths.map((path) => path.replace(/\\/g, '/').trim().toLowerCase());
  const touchesDetectorSurface = normalizedPaths.some((path) =>
    path.startsWith('core/facts/') ||
    path.startsWith('core/rules/presets/heuristics/') ||
    path.startsWith('integrations/config/') ||
    path === 'integrations/git/runplatformgate.ts' ||
    path === 'integrations/git/__tests__/runplatformgate.test.ts' ||
    path === 'integrations/git/gitatomicity.ts' ||
    path === 'integrations/git/__tests__/gitatomicity.test.ts'
  );
  const touchesLockOrScenario = normalizedPaths.some((path) =>
    path === 'skills.lock.json' || path.endsWith('.feature')
  );
  return (
    touchesDetectorSurface &&
    touchesLockOrScenario &&
    normalizedPaths.every((path) => isSkillsEnforcementImplementationPath(path))
  );
};

const buildAtomicSlicesRemediation = (params: {
  git: IGitService;
  repoRoot: string;
  stage: GitAtomicityStage;
}): string | undefined => {
  if (params.stage !== 'PRE_COMMIT') {
    return undefined;
  }
  const plan = collectWorktreeAtomicSlices({
    repoRoot: params.repoRoot,
    git: params.git,
  });
  if (plan.slices.length === 0) {
    return undefined;
  }
  const entries = plan.slices.map((slice) => `${slice.scope}: ${slice.staged_command}`);
  return `Slices sugeridos: ${entries.join(' | ')}`;
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
  return collectCommitRecords(params)
    .filter((record) => shouldEvaluateCommitRecord({ git: params.git, repoRoot: params.repoRoot, record }))
    .map((record) => record.subject);
};

type CommitRecord = {
  hash: string;
  parents: ReadonlyArray<string>;
  subject: string;
};

const parseCommitRecords = (value: string): ReadonlyArray<CommitRecord> =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [hash = '', parents = '', subject = ''] = line.split('\u0001');
      return {
        hash: hash.trim(),
        parents: parents.split(' ').map((parent) => parent.trim()).filter((parent) => parent.length > 0),
        subject: subject.trim(),
      };
    })
    .filter((record) => record.hash.length > 0);

const isCommitReachableFromRef = (params: {
  git: IGitService;
  repoRoot: string;
  commitHash: string;
  ref: string;
}): boolean => {
  try {
    params.git.runGit(['merge-base', '--is-ancestor', params.commitHash, params.ref], params.repoRoot);
    return true;
  } catch {
    return false;
  }
};

const isInheritedBaselineCommit = (params: {
  git: IGitService;
  repoRoot: string;
  commitHash: string;
}): boolean =>
  BASELINE_BRANCH_REFS.some((ref) =>
    isCommitReachableFromRef({
      git: params.git,
      repoRoot: params.repoRoot,
      commitHash: params.commitHash,
      ref,
    })
  );

const shouldEvaluateCommitRecord = (params: {
  git: IGitService;
  repoRoot: string;
  record: CommitRecord;
}): boolean => {
  if (params.record.parents.length > 1) {
    return false;
  }
  return !isInheritedBaselineCommit({
    git: params.git,
    repoRoot: params.repoRoot,
    commitHash: params.record.hash,
  });
};

const collectCommitRecords = (params: {
  git: IGitService;
  repoRoot: string;
  fromRef?: string;
  toRef?: string;
}): ReadonlyArray<CommitRecord> => {
  if (!params.fromRef || !params.toRef) {
    return [];
  }
  try {
    return parseCommitRecords(
      params.git.runGit(
        ['log', '--format=%H%x01%P%x01%s', '--reverse', `${params.fromRef}..${params.toRef}`],
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

const collectCommitChangedPaths = (params: {
  git: IGitService;
  repoRoot: string;
  commitHash: string;
}): ReadonlyArray<string> => {
  try {
    return parseLines(
      params.git.runGit(
        ['diff-tree', '--no-commit-id', '--name-only', '-r', '--diff-filter=ACMR', params.commitHash],
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

const buildPathLimitViolations = (params: {
  changedPaths: ReadonlyArray<string>;
  config: GitAtomicityConfig;
  stage: GitAtomicityStage;
  atomicSlicesRemediation?: string;
  label?: string;
}): GitAtomicityViolation[] => {
  const violations: GitAtomicityViolation[] = [];
  const labelSuffix = params.label ? ` (${params.label})` : '';

  if (params.changedPaths.length > params.config.maxFiles) {
    violations.push({
      code: 'GIT_ATOMICITY_TOO_MANY_FILES',
      message:
        `Git atomicity guard blocked at ${params.stage}${labelSuffix}: changed_files=${params.changedPaths.length} exceeds max_files=${params.config.maxFiles}.`,
      remediation:
        `Divide los cambios en commits más pequeños (máximo ${params.config.maxFiles} archivos por commit).`
        + (params.atomicSlicesRemediation ? ` ${params.atomicSlicesRemediation}` : ''),
    });
  }

  const scopePaths = collectScopePaths(params.changedPaths);
  const scopeKeys = new Set(scopePaths.keys());
  if (scopeKeys.size > params.config.maxScopes) {
    const sortedScopes = [...scopeKeys].sort();
    const suggestedScopeAdds = sortedScopes
      .slice(0, Math.max(1, Math.min(params.config.maxScopes + 1, 3)))
      .map((scope) => `git add ${scope}/`)
      .join(' && ');
    const scopeBreakdown = sortedScopes
      .map((scope) => {
        const paths = scopePaths.get(scope) ?? [];
        const sample = paths.slice(0, 3);
        return `${scope}{count=${paths.length}; sample=[${sample.join(', ')}]}`;
      })
      .join(' | ');
    violations.push({
      code: 'GIT_ATOMICITY_TOO_MANY_SCOPES',
      message:
        `Git atomicity guard blocked at ${params.stage}${labelSuffix}: changed_scopes=${scopeKeys.size} exceeds max_scopes=${params.config.maxScopes}. ` +
        `scope_files=${scopeBreakdown}.`,
      remediation:
        `Agrupa cambios por ámbito funcional (máximo ${params.config.maxScopes} scopes por commit). ` +
        `scopes_detectados=[${sortedScopes.join(', ')}]. ` +
        `Sugerencia split: git restore --staged . && ${suggestedScopeAdds} && git commit -m "<tipo>: <scope>".`
        + (params.atomicSlicesRemediation ? ` ${params.atomicSlicesRemediation}` : ''),
    });
  }

  return violations;
};

const buildPrePushCommitPathLimitViolations = (params: {
  git: IGitService;
  repoRoot: string;
  config: GitAtomicityConfig;
  fromRef?: string;
  toRef?: string;
}): GitAtomicityViolation[] | undefined => {
  const commitRecords = collectCommitRecords({
    git: params.git,
    repoRoot: params.repoRoot,
    fromRef: params.fromRef,
    toRef: params.toRef,
  }).filter((record) => shouldEvaluateCommitRecord({ git: params.git, repoRoot: params.repoRoot, record }));
  if (commitRecords.length === 0) {
    return undefined;
  }

  const violations: GitAtomicityViolation[] = [];
  for (const commitRecord of commitRecords) {
    const changedPaths = collectCommitChangedPaths({
      git: params.git,
      repoRoot: params.repoRoot,
      commitHash: commitRecord.hash,
    }).filter((path) => !isManagedEvidencePath(path));
    violations.push(
      ...buildPathLimitViolations({
        changedPaths,
        config: params.config,
        stage: 'PRE_PUSH',
        label: `commit=${commitRecord.hash.slice(0, 12)}`,
      })
    );
  }

  return violations;
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
  }).filter((path) => !isManagedEvidencePath(path));
  const atomicSlicesRemediation = buildAtomicSlicesRemediation({
    git,
    repoRoot,
    stage: params.stage,
  });
  if (params.stage === 'PRE_COMMIT' && isSkillsEnforcementRemediationDiff(changedPaths)) {
    return {
      enabled: true,
      allowed: true,
      violations: [],
    };
  }

  const prePushCommitViolations =
    params.stage === 'PRE_PUSH'
      ? buildPrePushCommitPathLimitViolations({
          git,
          repoRoot,
          config,
          fromRef: params.fromRef,
          toRef: params.toRef,
        })
      : undefined;

  violations.push(
    ...(prePushCommitViolations
      ?? buildPathLimitViolations({
        changedPaths,
        config,
        stage: params.stage,
        atomicSlicesRemediation,
      }))
  );

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
