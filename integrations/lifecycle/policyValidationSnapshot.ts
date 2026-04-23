import type { SkillsStage } from '../config/skillsLock';
import {
  resolvePolicyForStage,
  type ResolvedStagePolicy,
} from '../gate/stagePolicies';
import { resolvePreWriteEnforcement } from '../policy/preWriteEnforcement';

export type LifecyclePolicyValidationStageSnapshot = {
  source: ResolvedStagePolicy['trace']['source'];
  bundle: string;
  hash: string;
  version: string | null;
  signature: string | null;
  policySource: string | null;
  validationStatus: NonNullable<ResolvedStagePolicy['trace']['validation']>['status'] | null;
  validationCode: NonNullable<ResolvedStagePolicy['trace']['validation']>['code'] | null;
  strict: boolean;
};

export type LifecyclePolicyValidationSnapshot = {
  stages: Record<SkillsStage, LifecyclePolicyValidationStageSnapshot>;
};

const POLICY_STAGES: ReadonlyArray<SkillsStage> = ['PRE_WRITE', 'PRE_COMMIT', 'PRE_PUSH', 'CI'];

const toStageSnapshot = (
  stage: SkillsStage,
  resolved: ResolvedStagePolicy
): LifecyclePolicyValidationStageSnapshot => {
  const strictFromPolicy = resolved.trace.validation?.strict ?? false;
  const strict = stage === 'PRE_WRITE'
    ? strictFromPolicy || resolvePreWriteEnforcement().blocking
    : strictFromPolicy;
  return {
    source: resolved.trace.source,
    bundle: resolved.trace.bundle,
    hash: resolved.trace.hash,
    version: resolved.trace.version ?? null,
    signature: resolved.trace.signature ?? null,
    policySource: resolved.trace.policySource ?? null,
    validationStatus: resolved.trace.validation?.status ?? null,
    validationCode: resolved.trace.validation?.code ?? null,
    strict,
  };
};

export const readLifecyclePolicyValidationSnapshot = (
  repoRoot: string
): LifecyclePolicyValidationSnapshot => {
  const resolvedByStage = Object.fromEntries(
    POLICY_STAGES.map((stage) => [stage, toStageSnapshot(stage, resolvePolicyForStage(stage, repoRoot))])
  ) as Record<SkillsStage, LifecyclePolicyValidationStageSnapshot>;

  return {
    stages: resolvedByStage,
  };
};
