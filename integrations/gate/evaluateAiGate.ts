import type { EvidenceReadResult } from '../evidence/readEvidence';
import { readEvidenceResult } from '../evidence/readEvidence';
import { captureRepoState } from '../evidence/repoState';
import type { RepoState } from '../evidence/schema';
import { resolvePolicyForStage } from './stagePolicies';
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import type { SkillsStage } from '../config/skillsLock';
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
  repo_state: RepoState;
  violations: AiGateViolation[];
};

type AiGateDependencies = {
  now: () => number;
  readEvidenceResult: (repoRoot: string) => EvidenceReadResult;
  readMcpAiGateReceipt: (repoRoot: string) => McpAiGateReceiptReadResult;
  captureRepoState: (repoRoot: string) => RepoState;
  resolvePolicyForStage: (stage: SkillsStage, repoRoot: string) => ReturnType<typeof resolvePolicyForStage>;
};

const defaultDependencies: AiGateDependencies = {
  now: () => Date.now(),
  readEvidenceResult,
  readMcpAiGateReceipt,
  captureRepoState,
  resolvePolicyForStage,
};

const DEFAULT_MAX_AGE_SECONDS: Readonly<Record<AiGateStage, number>> = {
  PRE_WRITE: 300,
  PRE_COMMIT: 900,
  PRE_PUSH: 1800,
  CI: 7200,
};

const DEFAULT_PROTECTED_BRANCHES = new Set(['main', 'master', 'develop', 'dev']);
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
const MCP_RECEIPT_STAGE_ORDER: Readonly<Record<AiGateStage, number>> = {
  PRE_WRITE: 0,
  PRE_COMMIT: 1,
  PRE_PUSH: 2,
  CI: 3,
};

const toErrorViolation = (code: string, message: string): AiGateViolation => ({
  code,
  severity: 'ERROR',
  message,
});

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

const collectActiveRuleIdsCoverageViolations = (params: {
  stage: AiGateStage;
  evidence: Extract<EvidenceReadResult, { kind: 'valid' }>['evidence'];
  coverage: NonNullable<Extract<EvidenceReadResult, { kind: 'valid' }>['evidence']['snapshot']['rules_coverage']>;
}): AiGateViolation[] => {
  if (params.coverage.active_rule_ids.length > 0) {
    return [];
  }
  const detectedPlatforms = toDetectedSkillsPlatforms(params.evidence.platforms);
  if (detectedPlatforms.length === 0) {
    return [];
  }
  return [
    toErrorViolation(
      'EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES',
      `Active rules coverage is empty at ${params.stage} with detected code platforms=[${detectedPlatforms.join(', ')}].`
    ),
  ];
};

const collectPreWritePlatformSkillsViolations = (params: {
  evidence: Extract<EvidenceReadResult, { kind: 'valid' }>['evidence'];
  coverage: NonNullable<Extract<EvidenceReadResult, { kind: 'valid' }>['evidence']['snapshot']['rules_coverage']>;
}): AiGateViolation[] => {
  const detectedPlatforms = toDetectedSkillsPlatforms(params.evidence.platforms);
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
      toErrorViolation(
        'EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE',
        `Detected platforms missing skill-rule coverage in PRE_WRITE: ${missingScopeCoverage.join(' | ')}.`
      )
    );
  }

  const activeSkillsBundles = new Set(
    params.evidence.rulesets
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
      toErrorViolation(
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
      toErrorViolation(
        'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING',
        `Detected platforms missing critical skill-rule enforcement in PRE_WRITE: ${missingCriticalRulesByPlatform.join(' | ')}.`
      )
    );
  }

  return violations;
};

const collectPreWriteCoherenceViolations = (params: {
  evidence: Extract<EvidenceReadResult, { kind: 'valid' }>['evidence'];
  repoRoot: string;
  repoState: RepoState;
  nowMs: number;
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
  maxAgeSecondsByStage: Readonly<Record<AiGateStage, number>>
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
      })
    );
  }

  return { violations, ageSeconds };
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
  if (repoState.git.branch && protectedBranches.has(repoState.git.branch)) {
    violations.push(
      toErrorViolation(
        'GITFLOW_PROTECTED_BRANCH',
        `Direct work on protected branch "${repoState.git.branch}" is not allowed.`
      )
    );
  }
  return violations;
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
  },
  dependencies: Partial<AiGateDependencies> = {}
): AiGateCheckResult => {
  const activeDependencies: AiGateDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const maxAgeSecondsByStage = params.maxAgeSecondsByStage ?? DEFAULT_MAX_AGE_SECONDS;
  const protectedBranches = new Set(params.protectedBranches ?? Array.from(DEFAULT_PROTECTED_BRANCHES));
  const nowMs = activeDependencies.now();
  const evidenceResult = activeDependencies.readEvidenceResult(params.repoRoot);
  const repoState = activeDependencies.captureRepoState(params.repoRoot);
  const policyStage = toPolicyStage(params.stage);
  const resolvedPolicy = activeDependencies.resolvePolicyForStage(
    policyStage,
    params.repoRoot
  );
  const evidenceAssessment = collectEvidenceViolations(
    evidenceResult,
    params.repoRoot,
    repoState,
    params.stage,
    nowMs,
    maxAgeSecondsByStage
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
  const violations = [
    ...evidenceAssessment.violations,
    ...gitflowViolations,
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
    repo_state: repoState,
    violations,
  };
};
