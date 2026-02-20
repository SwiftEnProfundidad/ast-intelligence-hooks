import type { EvidenceReadResult } from '../evidence/readEvidence';
import { readEvidenceResult } from '../evidence/readEvidence';
import { captureRepoState } from '../evidence/repoState';
import type { RepoState } from '../evidence/schema';
import { resolvePolicyForStage } from './stagePolicies';
import type { SkillsStage } from '../config/skillsLock';

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
  };
  repo_state: RepoState;
  violations: AiGateViolation[];
};

type AiGateDependencies = {
  now: () => number;
  readEvidenceResult: (repoRoot: string) => EvidenceReadResult;
  captureRepoState: (repoRoot: string) => RepoState;
  resolvePolicyForStage: (stage: SkillsStage, repoRoot: string) => ReturnType<typeof resolvePolicyForStage>;
};

const defaultDependencies: AiGateDependencies = {
  now: () => Date.now(),
  readEvidenceResult,
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

const collectEvidenceViolations = (
  result: EvidenceReadResult,
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
    violations.push(
      toErrorViolation(
        'EVIDENCE_INVALID',
        `.ai_evidence.json is invalid${result.version ? ` (version=${result.version})` : ''}.`
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

  return { violations, ageSeconds };
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

export const evaluateAiGate = (
  params: {
    repoRoot: string;
    stage: AiGateStage;
    maxAgeSecondsByStage?: Readonly<Record<AiGateStage, number>>;
    protectedBranches?: ReadonlyArray<string>;
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
    params.stage,
    nowMs,
    maxAgeSecondsByStage
  );
  const gitflowViolations = collectGitflowViolations(repoState, protectedBranches);
  const violations = [...evidenceAssessment.violations, ...gitflowViolations];
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
    },
    repo_state: repoState,
    violations,
  };
};
