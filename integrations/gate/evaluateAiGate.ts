import type { EvidenceReadResult } from '../evidence/readEvidence';
import { readEvidenceResult } from '../evidence/readEvidence';
import { captureRepoState } from '../evidence/repoState';
import type { RepoState, RepoTrackingState } from '../evidence/schema';
import { resolvePolicyForStage } from './stagePolicies';
import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { isSeverityAtLeast } from '../../core/rules/Severity';
import type { SkillsLockV1, SkillsStage } from '../config/skillsLock';
import {
  loadEffectiveSkillsLock,
  loadRequiredSkillsLock,
} from '../config/skillsEffectiveLock';
import {
  resolveSkillsEnforcement,
  type SkillsEnforcementResolution,
} from '../policy/skillsEnforcement';
import {
  readMcpAiGateReceipt,
  resolveMcpAiGateReceiptPath,
  type McpAiGateReceiptReadResult,
} from '../mcp/aiGateReceipt';

export type AiGateStage = 'PRE_WRITE' | 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';

export type AiGateViolation = {
  code: string;
  message: string;
  severity: 'ERROR' | 'WARN';
};

type PreWriteWorktreeHygienePolicy = {
  enabled: boolean;
  warnThreshold: number;
  blockThreshold: number;
};

export type AiGateSkillsContractPlatformRequirement = {
  platform: PreWriteSkillsPlatform;
  required_rule_prefix: string;
  required_bundles: ReadonlyArray<string>;
  required_critical_rule_ids: ReadonlyArray<string>;
  required_any_transversal_critical_rule_ids: ReadonlyArray<string>;
  active_prefix_covered: boolean;
  evaluated_prefix_covered: boolean;
  missing_bundles: ReadonlyArray<string>;
  missing_critical_rule_ids: ReadonlyArray<string>;
  transversal_critical_covered: boolean;
  missing_any_transversal_critical_rule_ids: ReadonlyArray<string>;
};

export type AiGateSkillsContractAssessment = {
  stage: AiGateStage;
  enforced: boolean;
  status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE';
  detected_platforms: ReadonlyArray<PreWriteSkillsPlatform>;
  requirements: ReadonlyArray<AiGateSkillsContractPlatformRequirement>;
  violations: ReadonlyArray<AiGateViolation>;
};

export type AiGateCheckResult = {
  stage: AiGateStage;
  status: 'ALLOWED' | 'BLOCKED';
  allowed: boolean;
  policy: {
    stage: AiGateStage;
    resolved_stage: SkillsStage;
    block_on_or_above: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
    warn_on_or_above: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
    trace: {
      source: 'default' | 'skills.policy' | 'hard-mode';
      bundle: string;
      hash: string;
    };
  };
  evidence: {
    kind: EvidenceReadResult['kind'];
    max_age_seconds: number;
    age_seconds: number | null;
    source: {
      source: string;
      path: string;
      digest: string | null;
      generated_at: string | null;
    };
  };
  mcp_receipt: {
    required: boolean;
    kind: 'disabled' | McpAiGateReceiptReadResult['kind'];
    path: string;
    max_age_seconds: number | null;
    age_seconds: number | null;
  };
  skills_contract: AiGateSkillsContractAssessment;
  repo_state: RepoState;
  violations: AiGateViolation[];
};

type AiGateDependencies = {
  now: () => number;
  readEvidenceResult: (repoRoot: string) => EvidenceReadResult;
  readMcpAiGateReceipt: (repoRoot: string) => McpAiGateReceiptReadResult;
  captureRepoState: (repoRoot: string) => RepoState;
  resolvePolicyForStage: (stage: SkillsStage, repoRoot: string) => ReturnType<typeof resolvePolicyForStage>;
  loadEffectiveSkillsLock: (repoRoot: string) => SkillsLockV1 | undefined;
  loadRequiredSkillsLock: (repoRoot: string) => SkillsLockV1 | undefined;
};

const defaultDependencies: AiGateDependencies = {
  now: () => Date.now(),
  readEvidenceResult,
  readMcpAiGateReceipt,
  captureRepoState,
  resolvePolicyForStage,
  loadEffectiveSkillsLock,
  loadRequiredSkillsLock,
};

const DEFAULT_MAX_AGE_SECONDS: Readonly<Record<AiGateStage, number>> = {
  PRE_WRITE: 300,
  PRE_COMMIT: 900,
  PRE_PUSH: 1800,
  CI: 7200,
};
const DEFAULT_PREWRITE_WORKTREE_HYGIENE: PreWriteWorktreeHygienePolicy = {
  enabled: true,
  warnThreshold: 12,
  blockThreshold: 24,
};
const PREWRITE_WORKTREE_HYGIENE_ENABLED_ENV = 'PUMUKI_PREWRITE_WORKTREE_HYGIENE_ENABLED';
const PREWRITE_WORKTREE_HYGIENE_WARN_THRESHOLD_ENV = 'PUMUKI_PREWRITE_WORKTREE_WARN_THRESHOLD';
const PREWRITE_WORKTREE_HYGIENE_BLOCK_THRESHOLD_ENV = 'PUMUKI_PREWRITE_WORKTREE_BLOCK_THRESHOLD';

const DEFAULT_PROTECTED_BRANCHES = new Set(['main', 'master', 'develop', 'dev']);
const DEFAULT_GITFLOW_BRANCH_PATTERNS = [
  /^(?:feature|bugfix|hotfix|chore|refactor|docs)\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
  /^release\/\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/,
] as const;
const PREWRITE_SKILLS_PLATFORMS = ['ios', 'android', 'backend', 'frontend'] as const;
type PreWriteSkillsPlatform = (typeof PREWRITE_SKILLS_PLATFORMS)[number];
const PLATFORM_SKILLS_RULE_PREFIXES: Readonly<Record<PreWriteSkillsPlatform, string>> = {
  ios: 'skills.ios.',
  android: 'skills.android.',
  backend: 'skills.backend.',
  frontend: 'skills.frontend.',
};
const PLATFORM_REQUIRED_SKILLS_BUNDLES: Readonly<Record<PreWriteSkillsPlatform, ReadonlyArray<string>>> = {
  ios: [
    'ios-guidelines',
    'ios-concurrency-guidelines',
    'ios-swiftui-expert-guidelines',
  ],
  android: ['android-guidelines'],
  backend: ['backend-guidelines'],
  frontend: ['frontend-guidelines'],
};
const PREWRITE_CRITICAL_SKILLS_RULES: Readonly<Record<PreWriteSkillsPlatform, ReadonlyArray<string>>> = {
  ios: ['skills.ios.critical-test-quality'],
  android: [],
  backend: [],
  frontend: [],
};
const PREWRITE_TRANSVERSAL_CRITICAL_SKILLS_RULES: Readonly<Record<PreWriteSkillsPlatform, ReadonlyArray<string>>> = {
  ios: [],
  android: ['skills.android.no-runblocking', 'skills.android.no-thread-sleep'],
  backend: ['skills.backend.no-empty-catch', 'skills.backend.avoid-explicit-any'],
  frontend: ['skills.frontend.no-empty-catch', 'skills.frontend.avoid-explicit-any'],
};
const PREWRITE_PLATFORM_REPO_TREE_PREFIXES: Readonly<Record<PreWriteSkillsPlatform, ReadonlyArray<string>>> = {
  ios: ['apps/ios/', 'ios/'],
  android: ['apps/android/', 'android/'],
  backend: ['apps/backend/'],
  frontend: ['apps/frontend/', 'apps/web/'],
};
const MCP_RECEIPT_STAGE_ORDER: Readonly<Record<AiGateStage, number>> = {
  PRE_WRITE: 0,
  PRE_COMMIT: 1,
  PRE_PUSH: 2,
  CI: 3,
};
const SKILLS_CONTRACT_SUPPRESSED_EVIDENCE_CODES = new Set([
  'EVIDENCE_MISSING',
  'EVIDENCE_INVALID',
  'EVIDENCE_CHAIN_INVALID',
  'EVIDENCE_TIMESTAMP_INVALID',
  'EVIDENCE_STALE',
]);

const toErrorViolation = (code: string, message: string): AiGateViolation => ({
  code,
  severity: 'ERROR',
  message,
});

const toWarnViolation = (code: string, message: string): AiGateViolation => ({
  code,
  severity: 'WARN',
  message,
});

const toSkillsViolation = (
  resolution: SkillsEnforcementResolution,
  code: string,
  message: string
): AiGateViolation => (
  resolution.blocking
    ? toErrorViolation(code, message)
    : toWarnViolation(code, message)
);

const normalizeRepoStateLifecycleVersions = (repoState: RepoState): RepoState => {
  const packageVersion = repoState.lifecycle.package_version;
  const lifecycleVersion = repoState.lifecycle.lifecycle_version;
  if (packageVersion === lifecycleVersion) {
    return repoState;
  }
  const canonicalVersion = packageVersion ?? lifecycleVersion ?? null;
  return {
    ...repoState,
    lifecycle: {
      ...repoState.lifecycle,
      package_version: canonicalVersion,
      lifecycle_version: canonicalVersion,
    },
  };
};

const toPositiveInteger = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  const normalized = Math.trunc(value);
  return normalized > 0 ? normalized : fallback;
};

const toBooleanFromEnv = (value: string | undefined, fallback: boolean): boolean => {
  if (typeof value !== 'string') {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false;
  }
  return fallback;
};

const resolvePreWriteWorktreeHygienePolicy = (
  input?: Partial<PreWriteWorktreeHygienePolicy>
): PreWriteWorktreeHygienePolicy => {
  const enabled = input?.enabled
    ?? toBooleanFromEnv(
      process.env[PREWRITE_WORKTREE_HYGIENE_ENABLED_ENV],
      DEFAULT_PREWRITE_WORKTREE_HYGIENE.enabled
    );
  const warnThreshold = toPositiveInteger(
    input?.warnThreshold
      ?? (process.env[PREWRITE_WORKTREE_HYGIENE_WARN_THRESHOLD_ENV]
        ? Number(process.env[PREWRITE_WORKTREE_HYGIENE_WARN_THRESHOLD_ENV])
        : undefined),
    DEFAULT_PREWRITE_WORKTREE_HYGIENE.warnThreshold
  );
  const requestedBlockThreshold = toPositiveInteger(
    input?.blockThreshold
      ?? (process.env[PREWRITE_WORKTREE_HYGIENE_BLOCK_THRESHOLD_ENV]
        ? Number(process.env[PREWRITE_WORKTREE_HYGIENE_BLOCK_THRESHOLD_ENV])
        : undefined),
    DEFAULT_PREWRITE_WORKTREE_HYGIENE.blockThreshold
  );
  const blockThreshold =
    requestedBlockThreshold >= warnThreshold ? requestedBlockThreshold : warnThreshold;

  return {
    enabled,
    warnThreshold,
    blockThreshold,
  };
};

const toTimestampAgeSeconds = (
  timestamp: string,
  nowMs: number
): number | null => {
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  const raw = Math.floor((nowMs - parsed) / 1000);
  return raw >= 0 ? raw : 0;
};

const isTimestampFuture = (timestamp: string, nowMs: number): boolean => {
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) {
    return false;
  }
  return parsed > nowMs;
};

const toCanonicalPath = (value: string): string => {
  const normalized = value.replace(/\\/g, '/').toLowerCase();
  try {
    return realpathSync(value).replace(/\\/g, '/').toLowerCase();
  } catch {
    return normalized;
  }
};

const toNormalizedSkillsBundleName = (bundle: string): string => {
  const separatorIndex = bundle.lastIndexOf('@');
  if (separatorIndex <= 0) {
    return bundle.trim();
  }
  return bundle.slice(0, separatorIndex).trim();
};

const toDetectedSkillsPlatforms = (
  platforms: Extract<EvidenceReadResult, { kind: 'valid' }>['evidence']['platforms'] | undefined
): ReadonlyArray<PreWriteSkillsPlatform> => {
  const platformsState = platforms ?? {};
  const detected: PreWriteSkillsPlatform[] = [];
  for (const platform of PREWRITE_SKILLS_PLATFORMS) {
    if (platformsState[platform]?.detected === true) {
      detected.push(platform);
    }
  }
  return detected;
};

const toCoverageInferredPlatforms = (
  coverage: NonNullable<Extract<EvidenceReadResult, { kind: 'valid' }>['evidence']['snapshot']['rules_coverage']> | undefined
): ReadonlyArray<PreWriteSkillsPlatform> => {
  if (!coverage) {
    return [];
  }
  const ruleIds = [...coverage.active_rule_ids, ...coverage.evaluated_rule_ids];
  const inferred = new Set<PreWriteSkillsPlatform>();
  for (const ruleId of ruleIds) {
    for (const platform of PREWRITE_SKILLS_PLATFORMS) {
      const prefix = PLATFORM_SKILLS_RULE_PREFIXES[platform];
      if (ruleId.startsWith(prefix)) {
        inferred.add(platform);
      }
    }
  }
  return PREWRITE_SKILLS_PLATFORMS.filter((platform) => inferred.has(platform));
};

const toRepoTreeDetectedPlatforms = (params: {
  repoRoot: string;
  platforms: ReadonlyArray<PreWriteSkillsPlatform>;
}): ReadonlyArray<PreWriteSkillsPlatform> => {
  return params.platforms.filter((platform) => {
    const prefixes = PREWRITE_PLATFORM_REPO_TREE_PREFIXES[platform] ?? [];
    return prefixes.some((prefix) => existsSync(resolve(params.repoRoot, prefix)));
  });
};

const normalizeChangedPath = (value: string): string =>
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
    const normalizedRenamed = normalizeChangedPath(renamed);
    return normalizedRenamed.length > 0 ? normalizedRenamed : null;
  }
  const normalized = normalizeChangedPath(raw);
  return normalized.length > 0 ? normalized : null;
};

const collectWorktreeChangedPaths = (repoRoot: string): ReadonlyArray<string> => {
  try {
    const output = execFileSync(
      'git',
      ['status', '--short', '--untracked-files=all'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    );
    const files = output
      .split('\n')
      .map((line) => parseChangedPath(line))
      .filter((line): line is string => typeof line === 'string' && line.length > 0);
    return [...new Set(files)];
  } catch {
    return [];
  }
};

const collectGitChangedPaths = (
  repoRoot: string,
  args: ReadonlyArray<string>
): ReadonlyArray<string> => {
  try {
    const output = execFileSync(
      'git',
      [...args],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    );
    const files = output
      .split('\n')
      .map((line) => parseChangedPath(line))
      .filter((line): line is string => typeof line === 'string' && line.length > 0);
    return [...new Set(files)];
  } catch {
    return [];
  }
};

const collectStagedChangedPaths = (repoRoot: string): ReadonlyArray<string> =>
  collectGitChangedPaths(repoRoot, ['diff', '--cached', '--name-status', '--find-renames']);

const collectRangeChangedPaths = (params: {
  repoRoot: string;
  fromRef: string;
  toRef: string;
}): ReadonlyArray<string> =>
  collectGitChangedPaths(params.repoRoot, [
    'diff',
    '--name-status',
    '--find-renames',
    `${params.fromRef}...${params.toRef}`,
  ]);

const isPlatformPath = (platform: PreWriteSkillsPlatform, filePath: string): boolean => {
  const normalized = normalizeChangedPath(filePath).toLowerCase();
  if (platform === 'ios') {
    return normalized.endsWith('.swift')
      || normalized.startsWith('apps/ios/')
      || normalized.startsWith('ios/');
  }
  if (platform === 'android') {
    return normalized.endsWith('.kt')
      || normalized.endsWith('.kts')
      || normalized.startsWith('apps/android/')
      || normalized.startsWith('android/');
  }
  if (platform === 'backend') {
    const isTypeScriptOrJavaScript =
      normalized.endsWith('.ts')
      || normalized.endsWith('.js')
      || normalized.endsWith('.mts')
      || normalized.endsWith('.cts')
      || normalized.endsWith('.mjs')
      || normalized.endsWith('.cjs');
    if (!isTypeScriptOrJavaScript) {
      return false;
    }
    return normalized.startsWith('apps/backend/')
      || /(^|\/)(backend|server|api)(\/|$)/.test(normalized);
  }
  const isReactExtension = normalized.endsWith('.tsx') || normalized.endsWith('.jsx');
  if (isReactExtension) {
    return true;
  }
  const isTypeScriptOrJavaScript =
    normalized.endsWith('.ts')
    || normalized.endsWith('.js')
    || normalized.endsWith('.mts')
    || normalized.endsWith('.cts')
    || normalized.endsWith('.mjs')
    || normalized.endsWith('.cjs');
  if (!isTypeScriptOrJavaScript) {
    return false;
  }
  return normalized.startsWith('apps/frontend/')
    || normalized.startsWith('apps/web/')
    || /(^|\/)(frontend|web|client)(\/|$)/.test(normalized);
};

const toDetectedPlatformsFromPaths = (params: {
  changedPaths: ReadonlyArray<string>;
  requiredPlatforms: ReadonlyArray<PreWriteSkillsPlatform>;
}): ReadonlyArray<PreWriteSkillsPlatform> => {
  if (params.changedPaths.length === 0) {
    return [];
  }

  const detected = new Set<PreWriteSkillsPlatform>();
  for (const filePath of params.changedPaths) {
    for (const platform of params.requiredPlatforms) {
      if (isPlatformPath(platform, filePath)) {
        detected.add(platform);
      }
    }
  }

  return PREWRITE_SKILLS_PLATFORMS.filter((platform) => detected.has(platform));
};

const collectStageScopedChangedPaths = (params: {
  stage: AiGateStage;
  repoRoot: string;
  upstream: string | null;
}): ReadonlyArray<string> => {
  if (params.stage === 'PRE_WRITE') {
    return collectWorktreeChangedPaths(params.repoRoot);
  }
  if (params.stage === 'PRE_COMMIT') {
    return collectStagedChangedPaths(params.repoRoot);
  }
  if (params.stage === 'PRE_PUSH' && typeof params.upstream === 'string' && params.upstream.length > 0) {
    return collectRangeChangedPaths({
      repoRoot: params.repoRoot,
      fromRef: params.upstream,
      toRef: 'HEAD',
    });
  }
  return [];
};

const hasWorktreeCodePlatforms = (params: {
  repoRoot: string;
  requiredPlatforms: ReadonlyArray<PreWriteSkillsPlatform>;
}): boolean => {
  const changedPaths = collectWorktreeChangedPaths(params.repoRoot);
  if (changedPaths.length === 0) {
    return false;
  }
  return changedPaths.some((filePath) =>
    params.requiredPlatforms.some((platform) => isPlatformPath(platform, filePath))
  );
};

const toStageScopedDetectedPlatforms = (params: {
  stage: AiGateStage;
  repoRoot: string;
  upstream: string | null;
  requiredPlatforms: ReadonlyArray<PreWriteSkillsPlatform>;
}): ReadonlyArray<PreWriteSkillsPlatform> => {
  return toDetectedPlatformsFromPaths({
    changedPaths: collectStageScopedChangedPaths({
      stage: params.stage,
      repoRoot: params.repoRoot,
      upstream: params.upstream,
    }),
    requiredPlatforms: params.requiredPlatforms,
  });
};

const toLockRequiredPlatforms = (
  requiredLock: SkillsLockV1 | undefined
): ReadonlyArray<PreWriteSkillsPlatform> => {
  if (!requiredLock) {
    return [];
  }

  const requiredBundles = new Set(
    requiredLock.bundles.map((bundle) => toNormalizedSkillsBundleName(bundle.name))
  );
  const required = new Set<PreWriteSkillsPlatform>();

  for (const platform of PREWRITE_SKILLS_PLATFORMS) {
    const requiredByBundle = PLATFORM_REQUIRED_SKILLS_BUNDLES[platform].some((bundleName) =>
      requiredBundles.has(bundleName)
    );
    const requiredByRules = requiredLock.bundles.some((bundle) =>
      bundle.rules.some(
        (rule) => PREWRITE_SKILLS_PLATFORMS.includes(rule.platform as PreWriteSkillsPlatform)
          && rule.platform === platform
      )
    );

    if (requiredByBundle || requiredByRules) {
      required.add(platform);
    }
  }

  return PREWRITE_SKILLS_PLATFORMS.filter((platform) => required.has(platform));
};

const toEffectiveSkillsPlatforms = (params: {
  platforms: Extract<EvidenceReadResult, { kind: 'valid' }>['evidence']['platforms'] | undefined;
  coverage: NonNullable<Extract<EvidenceReadResult, { kind: 'valid' }>['evidence']['snapshot']['rules_coverage']> | undefined;
}): ReadonlyArray<PreWriteSkillsPlatform> => {
  const detectedPlatforms = toDetectedSkillsPlatforms(params.platforms);
  const inferredFromCoverage = toCoverageInferredPlatforms(params.coverage);
  if (detectedPlatforms.length === 0) {
    return inferredFromCoverage;
  }
  if (inferredFromCoverage.length === 0) {
    return detectedPlatforms;
  }
  const inferredSet = new Set(inferredFromCoverage);
  const intersection = detectedPlatforms.filter((platform) => inferredSet.has(platform));
  if (intersection.length > 0) {
    return intersection;
  }
  return detectedPlatforms;
};

const toPreWriteDetectedSkillsPlatforms = (params: {
  platforms: Extract<EvidenceReadResult, { kind: 'valid' }>['evidence']['platforms'] | undefined;
  coverage: NonNullable<Extract<EvidenceReadResult, { kind: 'valid' }>['evidence']['snapshot']['rules_coverage']> | undefined;
}): ReadonlyArray<PreWriteSkillsPlatform> => {
  const explicitlyDetectedPlatforms = toDetectedSkillsPlatforms(params.platforms);
  if (explicitlyDetectedPlatforms.length === 0) {
    return [];
  }
  return toEffectiveSkillsPlatforms(params);
};

const collectActiveRuleIdsCoverageViolations = (params: {
  stage: AiGateStage;
  evidence: Extract<EvidenceReadResult, { kind: 'valid' }>['evidence'];
  coverage: NonNullable<Extract<EvidenceReadResult, { kind: 'valid' }>['evidence']['snapshot']['rules_coverage']>;
}): AiGateViolation[] => {
  if (params.coverage.active_rule_ids.length > 0) {
    return [];
  }
  const explicitlyDetectedPlatforms = toDetectedSkillsPlatforms(params.evidence.platforms);
  const effectivePlatforms = toEffectiveSkillsPlatforms({
    platforms: params.evidence.platforms,
    coverage: params.coverage,
  });
  const inferredPlatforms = toCoverageInferredPlatforms(params.coverage);
  const blockedPlatforms = effectivePlatforms.length > 0
    ? effectivePlatforms
    : inferredPlatforms;
  if (blockedPlatforms.length === 0) {
    return [];
  }
  const detectionMode = explicitlyDetectedPlatforms.length > 0 ? 'detected' : 'inferred';
  return [
    toErrorViolation(
      'EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES',
      `Active rules coverage is empty at ${params.stage} with ${detectionMode} code platforms=[${blockedPlatforms.join(', ')}].`
    ),
  ];
};

const collectPreWritePlatformSkillsViolations = (params: {
  evidence: Extract<EvidenceReadResult, { kind: 'valid' }>['evidence'];
  coverage: NonNullable<Extract<EvidenceReadResult, { kind: 'valid' }>['evidence']['snapshot']['rules_coverage']>;
  skillsEnforcement: SkillsEnforcementResolution;
}): AiGateViolation[] => {
  const detectedPlatforms = toPreWriteDetectedSkillsPlatforms({
    platforms: params.evidence.platforms,
    coverage: params.coverage,
  });
  if (detectedPlatforms.length === 0) {
    return [];
  }

  const violations: AiGateViolation[] = [];
  const missingScopeCoverage: string[] = [];
  const missingBundlesByPlatform: string[] = [];

  for (const platform of detectedPlatforms) {
    const prefix = PLATFORM_SKILLS_RULE_PREFIXES[platform];
    const hasActivePrefix = params.coverage.active_rule_ids.some((ruleId) => ruleId.startsWith(prefix));
    const hasEvaluatedPrefix = params.coverage.evaluated_rule_ids.some((ruleId) =>
      ruleId.startsWith(prefix)
    );

    if (!hasActivePrefix || !hasEvaluatedPrefix) {
      const reasons: string[] = [];
      if (!hasActivePrefix) {
        reasons.push(`active_rules_prefix=${prefix} missing`);
      }
      if (!hasEvaluatedPrefix) {
        reasons.push(`evaluated_rules_prefix=${prefix} missing`);
      }
      missingScopeCoverage.push(`${platform}{${reasons.join('; ')}}`);
    }
  }

  if (missingScopeCoverage.length > 0) {
    violations.push(
      toSkillsViolation(
        params.skillsEnforcement,
        'EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE',
        `Detected platforms missing skill-rule coverage in PRE_WRITE: ${missingScopeCoverage.join(' | ')}.`
      )
    );
  }

  const activeSkillsBundles = new Set(
    (params.evidence.rulesets ?? [])
      .filter((ruleset) => ruleset.platform === 'skills')
      .map((ruleset) => toNormalizedSkillsBundleName(ruleset.bundle))
      .filter((bundle) => bundle.length > 0)
  );

  for (const platform of detectedPlatforms) {
    const requiredBundles = PLATFORM_REQUIRED_SKILLS_BUNDLES[platform];
    const missingBundles = requiredBundles.filter((bundleName) => !activeSkillsBundles.has(bundleName));
    if (missingBundles.length === 0) {
      continue;
    }
    missingBundlesByPlatform.push(`${platform}{missing_bundles=[${missingBundles.join(', ')}]}`);
  }

  if (missingBundlesByPlatform.length > 0) {
    violations.push(
      toSkillsViolation(
        params.skillsEnforcement,
        'EVIDENCE_PLATFORM_SKILLS_BUNDLES_MISSING',
        `Detected platforms missing required skill bundles in PRE_WRITE: ${missingBundlesByPlatform.join(' | ')}.`
      )
    );
  }

  const missingCriticalRulesByPlatform: string[] = [];
  for (const platform of detectedPlatforms) {
    const requiredCriticalRuleIds = PREWRITE_CRITICAL_SKILLS_RULES[platform];
    if (requiredCriticalRuleIds.length === 0) {
      continue;
    }
    const missingCriticalRuleIds = requiredCriticalRuleIds.filter((ruleId) => {
      const hasActive = params.coverage.active_rule_ids.includes(ruleId);
      const hasEvaluated = params.coverage.evaluated_rule_ids.includes(ruleId);
      return !hasActive || !hasEvaluated;
    });
    if (missingCriticalRuleIds.length === 0) {
      continue;
    }
    missingCriticalRulesByPlatform.push(
      `${platform}{missing_critical_rule_ids=[${missingCriticalRuleIds.join(', ')}]}`
    );
  }

  if (missingCriticalRulesByPlatform.length > 0) {
    violations.push(
      toSkillsViolation(
        params.skillsEnforcement,
        'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING',
        `Detected platforms missing critical skill-rule enforcement in PRE_WRITE: ${missingCriticalRulesByPlatform.join(' | ')}.`
      )
    );
  }

  return violations;
};

const collectPreWriteCrossPlatformCriticalViolations = (params: {
  evidence: Extract<EvidenceReadResult, { kind: 'valid' }>['evidence'];
  coverage: NonNullable<Extract<EvidenceReadResult, { kind: 'valid' }>['evidence']['snapshot']['rules_coverage']>;
  skillsEnforcement: SkillsEnforcementResolution;
}): AiGateViolation[] => {
  const detectedPlatforms = toPreWriteDetectedSkillsPlatforms({
    platforms: params.evidence.platforms,
    coverage: params.coverage,
  });
  if (detectedPlatforms.length === 0) {
    return [];
  }

  const missingCriticalCoverage: string[] = [];
  for (const platform of detectedPlatforms) {
    const requiredRuleIds = PREWRITE_TRANSVERSAL_CRITICAL_SKILLS_RULES[platform];
    if (requiredRuleIds.length === 0) {
      continue;
    }

    const hasCoverage = requiredRuleIds.some((ruleId) =>
      params.coverage.active_rule_ids.includes(ruleId) &&
      params.coverage.evaluated_rule_ids.includes(ruleId)
    );

    if (hasCoverage) {
      continue;
    }

    missingCriticalCoverage.push(
      `${platform}{required_any=[${requiredRuleIds.join(', ')}]}`
    );
  }

  if (missingCriticalCoverage.length === 0) {
    return [];
  }

  return [
    toSkillsViolation(
      params.skillsEnforcement,
      'EVIDENCE_CROSS_PLATFORM_CRITICAL_ENFORCEMENT_INCOMPLETE',
      `Cross-platform critical enforcement incomplete in PRE_WRITE: ${missingCriticalCoverage.join(' | ')}.`
    ),
  ];
};

const toSkillsContractAssessment = (params: {
  stage: AiGateStage;
  repoRoot: string;
  repoState: RepoState;
  evidenceResult: EvidenceReadResult;
  requiredLock?: SkillsLockV1;
  skillsEnforcement: SkillsEnforcementResolution;
}): AiGateSkillsContractAssessment => {
  const requiredPlatforms = toLockRequiredPlatforms(params.requiredLock);

  if (params.evidenceResult.kind !== 'valid') {
    return {
      stage: params.stage,
      enforced: requiredPlatforms.length > 0,
      status: requiredPlatforms.length > 0 ? 'FAIL' : 'NOT_APPLICABLE',
      detected_platforms: [],
      requirements: requiredPlatforms.map((platform) => ({
        platform,
        required_rule_prefix: PLATFORM_SKILLS_RULE_PREFIXES[platform],
        required_bundles: [...PLATFORM_REQUIRED_SKILLS_BUNDLES[platform]],
        required_critical_rule_ids: [...PREWRITE_CRITICAL_SKILLS_RULES[platform]],
        required_any_transversal_critical_rule_ids: [
          ...PREWRITE_TRANSVERSAL_CRITICAL_SKILLS_RULES[platform],
        ],
        active_prefix_covered: false,
        evaluated_prefix_covered: false,
        missing_bundles: [...PLATFORM_REQUIRED_SKILLS_BUNDLES[platform]],
        missing_critical_rule_ids: [...PREWRITE_CRITICAL_SKILLS_RULES[platform]],
        transversal_critical_covered: false,
        missing_any_transversal_critical_rule_ids: [
          ...PREWRITE_TRANSVERSAL_CRITICAL_SKILLS_RULES[platform],
        ],
      })),
      violations:
        requiredPlatforms.length > 0
          ? [
              toSkillsViolation(
                params.skillsEnforcement,
                'EVIDENCE_SKILLS_PLATFORMS_UNDETECTED',
                `Required repo skills exist, but active platforms could not be detected for ${params.stage}.`
              ),
            ]
          : [],
    };
  }

  const coverage = params.evidenceResult.evidence.snapshot.rules_coverage;
  const explicitlyDetectedPlatforms = toDetectedSkillsPlatforms(params.evidenceResult.evidence.platforms);
  const inferredPlatforms = toCoverageInferredPlatforms(coverage);
  const stageScopedDetectedPlatforms =
    params.stage !== 'CI' && requiredPlatforms.length > 0
      ? toStageScopedDetectedPlatforms({
          stage: params.stage,
          repoRoot: params.repoRoot,
          upstream: params.repoState.git.upstream,
          requiredPlatforms,
        })
      : [];
  const worktreeDetectedPlatforms = stageScopedDetectedPlatforms;
  const repoTreeDetectedPlatforms =
    params.stage === 'CI' && requiredPlatforms.length > 0
      ? toRepoTreeDetectedPlatforms({
          repoRoot: params.repoRoot,
          platforms: requiredPlatforms,
        })
      : [];
  const explicitlyDetectedEffectivePlatforms =
    explicitlyDetectedPlatforms.length > 0
      ? toEffectiveSkillsPlatforms({
          platforms: params.evidenceResult.evidence.platforms,
        coverage,
      })
      : [];
  const detectedPlatforms =
    stageScopedDetectedPlatforms.length > 0
      ? stageScopedDetectedPlatforms
      : explicitlyDetectedEffectivePlatforms.length > 0
      ? explicitlyDetectedEffectivePlatforms
      : inferredPlatforms.length > 0
        ? inferredPlatforms
        : worktreeDetectedPlatforms.length > 0
          ? worktreeDetectedPlatforms
        : repoTreeDetectedPlatforms;
  const pendingChanges = resolvePendingChanges(params.repoState);
  const detectedPlatformSet = new Set(detectedPlatforms);
  const assessmentPlatforms =
    requiredPlatforms.length > 0
      ? params.stage !== 'CI' && detectedPlatforms.length > 0
        ? requiredPlatforms.filter((platform) => detectedPlatformSet.has(platform))
        : requiredPlatforms
      : detectedPlatforms;

  if (requiredPlatforms.length > 0 && detectedPlatforms.length === 0) {
    if (
      params.stage === 'PRE_WRITE'
      && (
        pendingChanges === 0
        || !hasWorktreeCodePlatforms({
          repoRoot: params.repoRoot,
          requiredPlatforms,
        })
      )
    ) {
      return {
        stage: params.stage,
        enforced: false,
        status: 'NOT_APPLICABLE',
        detected_platforms: [],
        requirements: [],
        violations: [],
      };
    }
    const requirements: AiGateSkillsContractPlatformRequirement[] = requiredPlatforms.map((platform) => ({
      platform,
      required_rule_prefix: PLATFORM_SKILLS_RULE_PREFIXES[platform],
      required_bundles: [...PLATFORM_REQUIRED_SKILLS_BUNDLES[platform]],
      required_critical_rule_ids: [...PREWRITE_CRITICAL_SKILLS_RULES[platform]],
      required_any_transversal_critical_rule_ids: [
        ...PREWRITE_TRANSVERSAL_CRITICAL_SKILLS_RULES[platform],
      ],
      active_prefix_covered: false,
      evaluated_prefix_covered: false,
      missing_bundles: [...PLATFORM_REQUIRED_SKILLS_BUNDLES[platform]],
      missing_critical_rule_ids: [...PREWRITE_CRITICAL_SKILLS_RULES[platform]],
      transversal_critical_covered: false,
      missing_any_transversal_critical_rule_ids: [
        ...PREWRITE_TRANSVERSAL_CRITICAL_SKILLS_RULES[platform],
      ],
    }));

    return {
      stage: params.stage,
      enforced: true,
      status: 'FAIL',
      detected_platforms: [],
      requirements,
      violations: [
        toSkillsViolation(
          params.skillsEnforcement,
          'EVIDENCE_SKILLS_PLATFORMS_UNDETECTED',
          `Required repo skills exist, but active platforms could not be detected for ${params.stage}.`
        ),
      ],
    };
  }
  if (assessmentPlatforms.length === 0) {
    return {
      stage: params.stage,
      enforced: false,
      status: 'NOT_APPLICABLE',
      detected_platforms: [],
      requirements: [],
      violations: [],
    };
  }

  const activeSkillsBundles = new Set(
    (params.evidenceResult.evidence.rulesets ?? [])
      .filter((ruleset) => ruleset.platform === 'skills')
      .map((ruleset) => toNormalizedSkillsBundleName(ruleset.bundle))
      .filter((bundle) => bundle.length > 0)
  );

  const requirements: AiGateSkillsContractPlatformRequirement[] = [];
  const violations: AiGateViolation[] = [];
  if (requiredPlatforms.length > 0 && detectedPlatforms.length === 0) {
    violations.push(
      toSkillsViolation(
        params.skillsEnforcement,
        'EVIDENCE_SKILLS_PLATFORMS_UNDETECTED',
        `Required repo skills exist, but active platforms could not be detected for ${params.stage}.`
      )
    );
  }
  for (const platform of assessmentPlatforms) {
    const requiredRulePrefix = PLATFORM_SKILLS_RULE_PREFIXES[platform];
    const requiredBundles = [...PLATFORM_REQUIRED_SKILLS_BUNDLES[platform]];
    const requiredCriticalRuleIds = [...PREWRITE_CRITICAL_SKILLS_RULES[platform]];
    const requiredAnyTransversalCriticalRuleIds = [
      ...PREWRITE_TRANSVERSAL_CRITICAL_SKILLS_RULES[platform],
    ];
    const activePrefixCovered = coverage
      ? coverage.active_rule_ids.some((ruleId) => ruleId.startsWith(requiredRulePrefix))
      : false;
    const evaluatedPrefixCovered = coverage
      ? coverage.evaluated_rule_ids.some((ruleId) => ruleId.startsWith(requiredRulePrefix))
      : false;
    const missingBundles = requiredBundles.filter(
      (bundleName) => !activeSkillsBundles.has(bundleName)
    );
    const missingCriticalRuleIds = coverage
      ? requiredCriticalRuleIds.filter((ruleId) => {
          const hasActive = coverage.active_rule_ids.includes(ruleId);
          const hasEvaluated = coverage.evaluated_rule_ids.includes(ruleId);
          return !hasActive || !hasEvaluated;
        })
      : [...requiredCriticalRuleIds];
    const transversalCriticalCovered =
      requiredAnyTransversalCriticalRuleIds.length === 0
        ? true
        : coverage
          ? requiredAnyTransversalCriticalRuleIds.some((ruleId) =>
              coverage.active_rule_ids.includes(ruleId)
              && coverage.evaluated_rule_ids.includes(ruleId)
            )
          : false;
    const missingAnyTransversalCriticalRuleIds = transversalCriticalCovered
      ? []
      : [...requiredAnyTransversalCriticalRuleIds];

    requirements.push({
      platform,
      required_rule_prefix: requiredRulePrefix,
      required_bundles: requiredBundles,
      required_critical_rule_ids: requiredCriticalRuleIds,
      required_any_transversal_critical_rule_ids: requiredAnyTransversalCriticalRuleIds,
      active_prefix_covered: activePrefixCovered,
      evaluated_prefix_covered: evaluatedPrefixCovered,
      missing_bundles: missingBundles,
      missing_critical_rule_ids: missingCriticalRuleIds,
      transversal_critical_covered: transversalCriticalCovered,
      missing_any_transversal_critical_rule_ids: missingAnyTransversalCriticalRuleIds,
    });

    if (!activePrefixCovered || !evaluatedPrefixCovered) {
      const missingParts: string[] = [];
      if (!activePrefixCovered) {
        missingParts.push('active_prefix');
      }
      if (!evaluatedPrefixCovered) {
        missingParts.push('evaluated_prefix');
      }
      violations.push(
        toSkillsViolation(
          params.skillsEnforcement,
          'EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE',
          `Skills contract scope coverage missing for ${platform}: ${missingParts.join(', ')} (${requiredRulePrefix}).`
        )
      );
    }
    if (missingBundles.length > 0) {
      violations.push(
        toSkillsViolation(
          params.skillsEnforcement,
          'EVIDENCE_PLATFORM_SKILLS_BUNDLES_MISSING',
          `Skills contract missing bundles for ${platform}: [${missingBundles.join(', ')}].`
        )
      );
    }
    if (missingCriticalRuleIds.length > 0) {
      violations.push(
        toSkillsViolation(
          params.skillsEnforcement,
          'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING',
          `Skills contract missing critical rule coverage for ${platform}: [${missingCriticalRuleIds.join(', ')}].`
        )
      );
    }
    if (!transversalCriticalCovered && requiredAnyTransversalCriticalRuleIds.length > 0) {
      violations.push(
        toSkillsViolation(
          params.skillsEnforcement,
          'EVIDENCE_CROSS_PLATFORM_CRITICAL_ENFORCEMENT_INCOMPLETE',
          `Skills contract missing transversal critical coverage for ${platform}: required_any=[${requiredAnyTransversalCriticalRuleIds.join(', ')}].`
        )
      );
    }
  }

  return {
    stage: params.stage,
    enforced: true,
    status: violations.length === 0 ? 'PASS' : 'FAIL',
    detected_platforms: detectedPlatforms,
    requirements,
    violations,
  };
};

const collectPreWriteCoherenceViolations = (params: {
  evidence: Extract<EvidenceReadResult, { kind: 'valid' }>['evidence'];
  repoRoot: string;
  repoState: RepoState;
  nowMs: number;
  preWriteWorktreeHygiene: PreWriteWorktreeHygienePolicy;
}): AiGateViolation[] => {
  const violations: AiGateViolation[] = [];
  const evidenceRepoRoot = params.evidence.repo_state?.repo_root;
  if (
    typeof evidenceRepoRoot === 'string' &&
    evidenceRepoRoot.trim().length > 0 &&
    toCanonicalPath(evidenceRepoRoot) !== toCanonicalPath(params.repoRoot)
  ) {
    violations.push(
      toErrorViolation(
        'EVIDENCE_REPO_ROOT_MISMATCH',
        `Evidence repo root mismatch (${evidenceRepoRoot} != ${params.repoRoot}).`
      )
    );
  }

  const evidenceBranch = params.evidence.repo_state?.git?.branch;
  const currentBranch = params.repoState.git.branch;
  if (
    typeof evidenceBranch === 'string' &&
    evidenceBranch.trim().length > 0 &&
    typeof currentBranch === 'string' &&
    currentBranch.trim().length > 0 &&
    evidenceBranch !== currentBranch
  ) {
    violations.push(
      toErrorViolation(
        'EVIDENCE_BRANCH_MISMATCH',
        `Evidence branch mismatch (${evidenceBranch} != ${currentBranch}).`
      )
    );
  }

  if (params.evidence.severity_metrics.gate_status !== params.evidence.ai_gate.status) {
    violations.push(
      toErrorViolation(
        'EVIDENCE_GATE_STATUS_INCOHERENT',
        `Evidence gate status mismatch (severity_metrics=${params.evidence.severity_metrics.gate_status} ai_gate=${params.evidence.ai_gate.status}).`
      )
    );
  }

  if (params.evidence.ai_gate.status === 'BLOCKED' && params.evidence.snapshot.outcome !== 'BLOCK') {
    violations.push(
      toErrorViolation(
        'EVIDENCE_OUTCOME_INCOHERENT',
        `Evidence outcome mismatch (ai_gate=BLOCKED snapshot.outcome=${params.evidence.snapshot.outcome}).`
      )
    );
  }

  const coverage = params.evidence.snapshot.rules_coverage;
  if (!coverage) {
    violations.push(
      toErrorViolation(
        'EVIDENCE_RULES_COVERAGE_MISSING',
        'Evidence rules_coverage is missing for PRE_WRITE validation.'
      )
    );
  } else {
    const skillsEnforcement = resolveSkillsEnforcement();
    if (coverage.stage !== params.evidence.snapshot.stage) {
      violations.push(
        toErrorViolation(
          'EVIDENCE_RULES_COVERAGE_STAGE_MISMATCH',
          `rules_coverage stage mismatch (${coverage.stage} != ${params.evidence.snapshot.stage}).`
        )
      );
    }
    if (coverage.counts.unevaluated > 0 || coverage.coverage_ratio < 1) {
      violations.push(
        toErrorViolation(
          'EVIDENCE_RULES_COVERAGE_INCOMPLETE',
          `rules_coverage incomplete (unevaluated=${coverage.counts.unevaluated}, ratio=${coverage.coverage_ratio}).`
        )
      );
    }
    const unsupportedAutoCount =
      coverage.counts.unsupported_auto
      ?? coverage.unsupported_auto_rule_ids?.length
      ?? 0;
    if (unsupportedAutoCount > 0) {
      violations.push(
        toErrorViolation(
          'EVIDENCE_UNSUPPORTED_AUTO_RULES',
          `rules_coverage has unsupported auto rules (${unsupportedAutoCount}).`
        )
      );
    }

    violations.push(
      ...collectActiveRuleIdsCoverageViolations({
        stage: 'PRE_WRITE',
        evidence: params.evidence,
        coverage,
      })
    );

    violations.push(
      ...collectPreWritePlatformSkillsViolations({
        evidence: params.evidence,
        coverage,
        skillsEnforcement,
      })
    );
    violations.push(
      ...collectPreWriteCrossPlatformCriticalViolations({
        evidence: params.evidence,
        coverage,
        skillsEnforcement,
      })
    );
  }

  if (isTimestampFuture(params.evidence.timestamp, params.nowMs)) {
    violations.push(
      toErrorViolation(
        'EVIDENCE_TIMESTAMP_FUTURE',
        'Evidence timestamp is in the future.'
      )
    );
  }

  return violations;
};

const collectEvidenceViolations = (
  result: EvidenceReadResult,
  repoRoot: string,
  repoState: RepoState,
  stage: AiGateStage,
  nowMs: number,
  maxAgeSecondsByStage: Readonly<Record<AiGateStage, number>>,
  preWriteWorktreeHygiene: PreWriteWorktreeHygienePolicy
): { violations: AiGateViolation[]; ageSeconds: number | null } => {
  const violations: AiGateViolation[] = [];
  const maxAgeSeconds = maxAgeSecondsByStage[stage];

  if (result.kind === 'missing') {
    violations.push(toErrorViolation('EVIDENCE_MISSING', '.ai_evidence.json is missing.'));
    return { violations, ageSeconds: null };
  }

  if (result.kind === 'invalid') {
    const invalidCode =
      result.reason === 'evidence-chain-invalid'
        ? 'EVIDENCE_CHAIN_INVALID'
        : 'EVIDENCE_INVALID';
    const detailSuffix = result.detail ? ` ${result.detail}` : '';
    violations.push(
      toErrorViolation(
        invalidCode,
        `.ai_evidence.json is invalid${result.version ? ` (version=${result.version})` : ''}.${detailSuffix}`
      )
    );
    return { violations, ageSeconds: null };
  }

  const ageSeconds = toTimestampAgeSeconds(result.evidence.timestamp, nowMs);
  if (ageSeconds === null) {
    violations.push(toErrorViolation('EVIDENCE_TIMESTAMP_INVALID', 'Evidence timestamp is invalid.'));
    return { violations, ageSeconds: null };
  }

  if (ageSeconds > maxAgeSeconds) {
    violations.push(
      toErrorViolation(
        'EVIDENCE_STALE',
        `Evidence is stale (${ageSeconds}s > ${maxAgeSeconds}s for ${stage}).`
      )
    );
  }

  if (result.evidence.ai_gate.status === 'BLOCKED') {
    violations.push(toErrorViolation('EVIDENCE_GATE_BLOCKED', 'Evidence AI gate status is BLOCKED.'));
  }

  if (stage === 'PRE_WRITE') {
    violations.push(
      ...collectPreWriteCoherenceViolations({
        evidence: result.evidence,
        repoRoot,
        repoState,
        nowMs,
        preWriteWorktreeHygiene,
      })
    );
  }

  appendWorktreeHygieneViolations(violations, repoState, preWriteWorktreeHygiene, stage);

  return { violations, ageSeconds };
};

const severityOrder: ReadonlyArray<'CRITICAL' | 'ERROR' | 'WARN' | 'INFO'> = [
  'CRITICAL',
  'ERROR',
  'WARN',
  'INFO',
];

const toHighestTriggeredSeverity = (
  severityCounts: Readonly<Record<'INFO' | 'WARN' | 'ERROR' | 'CRITICAL', number>>,
  threshold: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
): 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | null => {
  for (const severity of severityOrder) {
    if (severityCounts[severity] > 0 && isSeverityAtLeast(severity, threshold)) {
      return severity;
    }
  }
  return null;
};

const collectEvidencePolicyThresholdViolations = (params: {
  evidenceResult: EvidenceReadResult;
  policy: ReturnType<typeof resolvePolicyForStage>['policy'];
}): AiGateViolation[] => {
  if (params.evidenceResult.kind !== 'valid') {
    return [];
  }

  const severityCounts = params.evidenceResult.evidence.severity_metrics.by_severity;
  const blockSeverity = toHighestTriggeredSeverity(
    severityCounts,
    params.policy.blockOnOrAbove
  );
  if (blockSeverity && params.evidenceResult.evidence.ai_gate.status !== 'BLOCKED') {
    return [
      toErrorViolation(
        'EVIDENCE_POLICY_THRESHOLD_BLOCK',
        `Evidence severities exceed block_on_or_above=${params.policy.blockOnOrAbove} (highest=${blockSeverity}).`
      ),
    ];
  }

  const warnSeverity = toHighestTriggeredSeverity(
    severityCounts,
    params.policy.warnOnOrAbove
  );
  if (warnSeverity && params.evidenceResult.evidence.ai_gate.status === 'ALLOWED') {
    return [
      toWarnViolation(
        'EVIDENCE_POLICY_THRESHOLD_WARN',
        `Evidence severities exceed warn_on_or_above=${params.policy.warnOnOrAbove} (highest=${warnSeverity}).`
      ),
    ];
  }

  return [];
};

const toEvidenceSourceDescriptor = (
  result: EvidenceReadResult,
  repoRoot: string
): AiGateCheckResult['evidence']['source'] => {
  if ('source_descriptor' in result) {
    return {
      source: result.source_descriptor.source,
      path: result.source_descriptor.path,
      digest: result.source_descriptor.digest,
      generated_at: result.source_descriptor.generated_at,
    };
  }

  return {
    source: 'local-file',
    path: resolve(repoRoot, '.ai_evidence.json'),
    digest: null,
    generated_at: null,
  };
};

const collectGitflowViolations = (
  repoState: RepoState,
  protectedBranches: ReadonlySet<string>
): AiGateViolation[] => {
  const violations: AiGateViolation[] = [];
  if (!repoState.git.available) {
    return violations;
  }
  const branch = repoState.git.branch?.trim() ?? null;
  const normalizedBranch = branch?.toLowerCase() ?? null;
  if (branch && normalizedBranch && protectedBranches.has(normalizedBranch)) {
    violations.push(
      toErrorViolation(
        'GITFLOW_PROTECTED_BRANCH',
        `Direct work on protected branch "${branch}" is not allowed.`
      )
    );
    return violations;
  }
  if (
    branch
    && !DEFAULT_GITFLOW_BRANCH_PATTERNS.some((pattern) => pattern.test(branch))
  ) {
    violations.push(
      toErrorViolation(
        'GITFLOW_BRANCH_NAMING_INVALID',
        `Branch "${branch}" does not comply with GitFlow naming. Use feature/*, bugfix/*, hotfix/*, release/*, chore/*, refactor/* or docs/*.`
      )
    );
  }
  return violations;
};

const DEFAULT_TRACKING_STATE: RepoTrackingState = {
  enforced: false,
  canonical_path: null,
  canonical_present: false,
  source_file: null,
  in_progress_count: null,
  single_in_progress_valid: null,
  conflict: false,
  declarations: [],
};

const collectTrackingViolations = (repoState: RepoState): AiGateViolation[] => {
  const tracking = repoState.lifecycle.tracking ?? DEFAULT_TRACKING_STATE;
  if (!tracking.enforced) {
    return [];
  }

  if (tracking.conflict) {
    const declaredPaths = tracking.declarations
      .map((entry) => `${entry.source_file}:${entry.resolved_path}`)
      .join(', ');
    return [
      toErrorViolation(
        'TRACKING_CANONICAL_SOURCE_CONFLICT',
        `Tracking canonical source conflict detected (${declaredPaths}).`
      ),
    ];
  }

  if (!tracking.canonical_path || !tracking.canonical_present) {
    return [
      toErrorViolation(
        'TRACKING_CANONICAL_FILE_MISSING',
        `Tracking canonical file is missing (${tracking.canonical_path ?? 'undeclared'}).`
      ),
    ];
  }

  if (tracking.single_in_progress_valid === false) {
    return [
      toErrorViolation(
        'TRACKING_CANONICAL_IN_PROGRESS_INVALID',
        `Tracking canonical file must contain exactly one in-progress task (count=${tracking.in_progress_count ?? 'n/a'}).`
      ),
    ];
  }

  return [];
};

const resolvePendingChanges = (repoState: RepoState): number | null => {
  if (!repoState.git.available) {
    return null;
  }
  return repoState.git.pending_changes ?? (repoState.git.staged + repoState.git.unstaged);
};

const appendWorktreeHygieneViolations = (
  violations: AiGateViolation[],
  repoState: RepoState,
  policy: PreWriteWorktreeHygienePolicy,
  stageLabel: AiGateStage
): void => {
  if (!policy.enabled || !repoState.git.available) {
    return;
  }
  const pendingChanges = resolvePendingChanges(repoState) ?? 0;
  if (pendingChanges >= policy.blockThreshold) {
    violations.push(
      toErrorViolation(
        'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT',
        `${stageLabel} worktree hygiene exceeded: pending_changes=${pendingChanges} (block_threshold=${policy.blockThreshold}). Split worktree into atomic slices.`
      )
    );
  } else if (pendingChanges >= policy.warnThreshold) {
    violations.push(
      toWarnViolation(
        'EVIDENCE_PREWRITE_WORKTREE_WARN',
        `${stageLabel} worktree hygiene warning: pending_changes=${pendingChanges} (warn_threshold=${policy.warnThreshold}). Consider smaller staged/unstaged batches.`
      )
    );
  }
};

const toPolicyStage = (stage: AiGateStage): SkillsStage => {
  if (stage === 'PRE_WRITE') {
    return 'PRE_COMMIT';
  }
  return stage;
};

const isMcpReceiptStageCompatible = (params: {
  receiptStage: AiGateStage;
  requestedStage: AiGateStage;
}): boolean => {
  return MCP_RECEIPT_STAGE_ORDER[params.receiptStage] >= MCP_RECEIPT_STAGE_ORDER[params.requestedStage];
};

const collectMcpReceiptViolations = (params: {
  required: boolean;
  stage: AiGateStage;
  repoRoot: string;
  nowMs: number;
  maxAgeSecondsByStage: Readonly<Record<AiGateStage, number>>;
  readMcpAiGateReceipt: (repoRoot: string) => McpAiGateReceiptReadResult;
}): {
  required: boolean;
  kind: 'disabled' | McpAiGateReceiptReadResult['kind'];
  path: string;
  maxAgeSeconds: number | null;
  ageSeconds: number | null;
  violations: AiGateViolation[];
} => {
  const path = resolveMcpAiGateReceiptPath(params.repoRoot);
  if (!params.required || params.stage !== 'PRE_WRITE') {
    return {
      required: params.required,
      kind: 'disabled',
      path,
      maxAgeSeconds: null,
      ageSeconds: null,
      violations: [],
    };
  }

  const maxAgeSeconds = params.maxAgeSecondsByStage[params.stage];
  const receiptRead = params.readMcpAiGateReceipt(params.repoRoot);
  if (receiptRead.kind === 'missing') {
    return {
      required: true,
      kind: 'missing',
      path: receiptRead.path,
      maxAgeSeconds,
      ageSeconds: null,
      violations: [
        toErrorViolation(
          'MCP_ENTERPRISE_RECEIPT_MISSING',
          'MCP receipt is missing. Call tool ai_gate_check in pumuki-enterprise MCP before PRE_WRITE.'
        ),
      ],
    };
  }

  if (receiptRead.kind === 'invalid') {
    return {
      required: true,
      kind: 'invalid',
      path: receiptRead.path,
      maxAgeSeconds,
      ageSeconds: null,
      violations: [
        toErrorViolation(
          'MCP_ENTERPRISE_RECEIPT_INVALID',
          `MCP receipt is invalid: ${receiptRead.reason}`
        ),
      ],
    };
  }

  const violations: AiGateViolation[] = [];
  if (toCanonicalPath(receiptRead.receipt.repo_root) !== toCanonicalPath(params.repoRoot)) {
    violations.push(
      toErrorViolation(
        'MCP_ENTERPRISE_RECEIPT_REPO_ROOT_MISMATCH',
        `MCP receipt repo root mismatch (${receiptRead.receipt.repo_root} != ${params.repoRoot}).`
      )
    );
  }
  if (
    !isMcpReceiptStageCompatible({
      receiptStage: receiptRead.receipt.stage,
      requestedStage: params.stage,
    })
  ) {
    violations.push(
      toErrorViolation(
        'MCP_ENTERPRISE_RECEIPT_STAGE_MISMATCH',
        `MCP receipt stage mismatch (${receiptRead.receipt.stage} incompatible with ${params.stage}).`
      )
    );
  }
  const ageSeconds = toTimestampAgeSeconds(receiptRead.receipt.issued_at, params.nowMs);
  if (ageSeconds === null) {
    violations.push(
      toErrorViolation(
        'MCP_ENTERPRISE_RECEIPT_TIMESTAMP_INVALID',
        'MCP receipt issued_at timestamp is invalid.'
      )
    );
  } else if (ageSeconds > maxAgeSeconds) {
    violations.push(
      toErrorViolation(
        'MCP_ENTERPRISE_RECEIPT_STALE',
        `MCP receipt is stale (${ageSeconds}s > ${maxAgeSeconds}s for ${params.stage}).`
      )
    );
  }
  if (isTimestampFuture(receiptRead.receipt.issued_at, params.nowMs)) {
    violations.push(
      toErrorViolation(
        'MCP_ENTERPRISE_RECEIPT_TIMESTAMP_FUTURE',
        'MCP receipt timestamp is in the future.'
      )
    );
  }

  return {
    required: true,
    kind: 'valid',
    path: receiptRead.path,
    maxAgeSeconds,
    ageSeconds,
    violations,
  };
};

export const evaluateAiGate = (
  params: {
    repoRoot: string;
    stage: AiGateStage;
    maxAgeSecondsByStage?: Readonly<Record<AiGateStage, number>>;
    protectedBranches?: ReadonlyArray<string>;
    requireMcpReceipt?: boolean;
    preWriteWorktreeHygiene?: Partial<PreWriteWorktreeHygienePolicy>;
  },
  dependencies: Partial<AiGateDependencies> = {}
): AiGateCheckResult => {
  const activeDependencies: AiGateDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const maxAgeSecondsByStage = params.maxAgeSecondsByStage ?? DEFAULT_MAX_AGE_SECONDS;
  const preWriteWorktreeHygiene = resolvePreWriteWorktreeHygienePolicy(
    params.preWriteWorktreeHygiene
  );
  const protectedBranches = new Set(params.protectedBranches ?? Array.from(DEFAULT_PROTECTED_BRANCHES));
  const nowMs = activeDependencies.now();
  const evidenceResult = activeDependencies.readEvidenceResult(params.repoRoot);
  const repoState = normalizeRepoStateLifecycleVersions(
    activeDependencies.captureRepoState(params.repoRoot)
  );
  const effectiveSkillsLock = activeDependencies.loadEffectiveSkillsLock(params.repoRoot);
  const requiredSkillsLock = activeDependencies.loadRequiredSkillsLock(params.repoRoot);
  const requiredSkillsPlatforms = toLockRequiredPlatforms(requiredSkillsLock);
  const policyStage = toPolicyStage(params.stage);
  const resolvedPolicy = activeDependencies.resolvePolicyForStage(
    policyStage,
    params.repoRoot
  );
  const skillsEnforcement = resolveSkillsEnforcement();
  const evidenceAssessment = collectEvidenceViolations(
    evidenceResult,
    params.repoRoot,
    repoState,
    params.stage,
    nowMs,
    maxAgeSecondsByStage,
    preWriteWorktreeHygiene
  );
  const mcpReceiptAssessment = collectMcpReceiptViolations({
    required: params.requireMcpReceipt ?? false,
    stage: params.stage,
    repoRoot: params.repoRoot,
    nowMs,
    maxAgeSecondsByStage,
    readMcpAiGateReceipt: activeDependencies.readMcpAiGateReceipt,
  });
  const gitflowViolations = collectGitflowViolations(repoState, protectedBranches);
  const trackingViolations = collectTrackingViolations(repoState);
  const skillsContract = toSkillsContractAssessment({
    stage: params.stage,
    repoRoot: params.repoRoot,
    repoState,
    evidenceResult,
    requiredLock: requiredSkillsLock,
    skillsEnforcement,
  });
  const suppressSkillsContractViolation = evidenceAssessment.violations.some((violation) =>
    SKILLS_CONTRACT_SUPPRESSED_EVIDENCE_CODES.has(violation.code)
  );
  const stageSkillsContractViolations =
    suppressSkillsContractViolation
    || skillsContract.status !== 'FAIL'
    || (params.stage === 'PRE_WRITE' && requiredSkillsPlatforms.length === 0)
        ? []
      : [
          toSkillsViolation(
            skillsEnforcement,
            'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE',
            `Skills contract incomplete for ${params.stage}: ${skillsContract.violations.map((violation) => violation.code).join(', ')}.`
          ),
        ];
  const policyThresholdViolations = collectEvidencePolicyThresholdViolations({
    evidenceResult,
    policy: resolvedPolicy.policy,
  });
  const violations = [
    ...evidenceAssessment.violations,
    ...policyThresholdViolations,
    ...stageSkillsContractViolations,
    ...gitflowViolations,
    ...trackingViolations,
    ...mcpReceiptAssessment.violations,
  ];
  const blocked = violations.some((violation) => violation.severity === 'ERROR');

  return {
    stage: params.stage,
    status: blocked ? 'BLOCKED' : 'ALLOWED',
    allowed: !blocked,
    policy: {
      stage: params.stage,
      resolved_stage: policyStage,
      block_on_or_above: resolvedPolicy.policy.blockOnOrAbove,
      warn_on_or_above: resolvedPolicy.policy.warnOnOrAbove,
      trace: resolvedPolicy.trace,
    },
    evidence: {
      kind: evidenceResult.kind,
      max_age_seconds: maxAgeSecondsByStage[params.stage],
      age_seconds: evidenceAssessment.ageSeconds,
      source: toEvidenceSourceDescriptor(evidenceResult, params.repoRoot),
    },
    mcp_receipt: {
      required: mcpReceiptAssessment.required,
      kind: mcpReceiptAssessment.kind,
      path: mcpReceiptAssessment.path,
      max_age_seconds: mcpReceiptAssessment.maxAgeSeconds,
      age_seconds: mcpReceiptAssessment.ageSeconds,
    },
    skills_contract: skillsContract,
    repo_state: repoState,
    violations,
  };
};
