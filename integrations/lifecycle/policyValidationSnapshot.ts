import type { SkillsStage } from '../config/skillsLock';
import {
  resolvePolicyForStage,
  type ResolvedStagePolicy,
} from '../gate/stagePolicies';

export type LifecyclePolicyValidationStageSnapshot = {
  source: ResolvedStagePolicy['trace']['source'];
  layer: ResolvedStagePolicy['trace']['layer'];
  activation: ResolvedStagePolicy['trace']['activation'];
  activationSource: ResolvedStagePolicy['trace']['activationSource'];
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

const POLICY_STAGES: ReadonlyArray<SkillsStage> = ['PRE_COMMIT', 'PRE_PUSH', 'CI'];

const toStageSnapshot = (
  resolved: ResolvedStagePolicy
): LifecyclePolicyValidationStageSnapshot => {
  return {
    source: resolved.trace.source,
    layer: resolved.trace.layer,
    activation: resolved.trace.activation,
    activationSource: resolved.trace.activationSource,
    bundle: resolved.trace.bundle,
    hash: resolved.trace.hash,
    version: resolved.trace.version ?? null,
    signature: resolved.trace.signature ?? null,
    policySource: resolved.trace.policySource ?? null,
    validationStatus: resolved.trace.validation?.status ?? null,
    validationCode: resolved.trace.validation?.code ?? null,
    strict: resolved.trace.validation?.strict ?? false,
  };
};

export const readLifecyclePolicyValidationSnapshot = (
  repoRoot: string
): LifecyclePolicyValidationSnapshot => {
  const resolvedByStage = Object.fromEntries(
    POLICY_STAGES.map((stage) => [stage, toStageSnapshot(resolvePolicyForStage(stage, repoRoot))])
  ) as Record<SkillsStage, LifecyclePolicyValidationStageSnapshot>;

  return {
    stages: resolvedByStage,
  };
};
