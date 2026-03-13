import { createHash } from 'node:crypto';
import type { GatePolicy } from '../../core/gate/GatePolicy';
import type { GateStage } from '../../core/gate/GateStage';
import type { RuleSet } from '../../core/rules/RuleSet';
import type { Severity } from '../../core/rules/Severity';
import type { SkillsStage } from '../config/skillsLock';
import {
  mapEnterpriseSeverityToGateSeverity as mapEnterpriseSeverityToGateSeverityFromProfiles,
  policyForCI as policyForCIFromProfiles,
  policyForPreCommit as policyForPreCommitFromProfiles,
  policyForPrePush as policyForPrePushFromProfiles,
  resolvePolicyProfileForStage,
  type PolicyProfileSource,
} from '../policy/policyProfiles';
import { resolvePolicyAsCodeTraceMetadata } from '../policy/policyAsCode';
import {
  resolveHeuristicsEnforcement,
  type HeuristicsEnforcementResolution,
} from '../policy/heuristicsEnforcement';
import { resolveDegradedMode } from './degradedMode';

const heuristicsPromotionStageAllowList = new Set<GateStage>([
  'PRE_COMMIT',
  'PRE_PUSH',
  'CI',
]);

const isHeuristicRuleId = (ruleId: string): boolean => {
  return ruleId.startsWith('heuristics.');
};

const canPromoteHeuristicForStage = (stage: GateStage): boolean => {
  return heuristicsPromotionStageAllowList.has(stage);
};

const heuristicSeverityOverrideForStage = (
  ruleId: string,
  stage: GateStage,
  enforcement: HeuristicsEnforcementResolution
): Severity | null => {
  if (!enforcement.blocking) {
    return null;
  }
  if (!canPromoteHeuristicForStage(stage)) {
    return null;
  }
  if (!isHeuristicRuleId(ruleId)) {
    return null;
  }
  return 'ERROR';
};

export type ResolvedStagePolicy = {
  policy: GatePolicy;
  trace: {
    source: PolicyProfileSource;
    bundle: string;
    hash: string;
    version?: string;
    signature?: string;
    policySource?: string;
    validation?: {
      status: 'valid' | 'invalid' | 'expired' | 'unknown-source' | 'unsigned';
      code:
        | 'POLICY_AS_CODE_VALID'
        | 'POLICY_AS_CODE_UNSIGNED'
        | 'POLICY_AS_CODE_CONTRACT_INVALID'
        | 'POLICY_AS_CODE_CONTRACT_EXPIRED'
        | 'POLICY_AS_CODE_SIGNATURE_MISMATCH'
        | 'POLICY_AS_CODE_UNKNOWN_SOURCE';
      message: string;
      strict: boolean;
    };
    degraded?: {
      enabled: true;
      action: 'allow' | 'block';
      reason: string;
      source: 'env' | 'file:.pumuki/degraded-mode.json';
      code: 'DEGRADED_MODE_ALLOWED' | 'DEGRADED_MODE_BLOCKED';
    };
  };
};

export type EnterpriseSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export const mapEnterpriseSeverityToGateSeverity =
  mapEnterpriseSeverityToGateSeverityFromProfiles;
const createPolicyTraceHash = (params: {
  stage: SkillsStage;
  source: PolicyProfileSource;
  blockOnOrAbove: GatePolicy['blockOnOrAbove'];
  warnOnOrAbove: GatePolicy['warnOnOrAbove'];
  sourcePolicyHash?: string;
}): string => {
  return createHash('sha256')
    .update(
      JSON.stringify({
        stage: params.stage,
        source: params.source,
        blockOnOrAbove: params.blockOnOrAbove,
        warnOnOrAbove: params.warnOnOrAbove,
        sourcePolicyHash: params.sourcePolicyHash ?? null,
      })
    )
    .digest('hex');
};

export const resolvePolicyForStage = (
  stage: SkillsStage,
  repoRoot: string = process.cwd()
): ResolvedStagePolicy => {
  const degraded = resolveDegradedMode(stage, repoRoot);
  const resolvedProfile = resolvePolicyProfileForStage(stage, repoRoot);
  const hash = createPolicyTraceHash({
    stage,
    source: resolvedProfile.source,
    blockOnOrAbove: resolvedProfile.policy.blockOnOrAbove,
    warnOnOrAbove: resolvedProfile.policy.warnOnOrAbove,
    sourcePolicyHash: resolvedProfile.sourcePolicyHash,
  });
  const policyAsCode = resolvePolicyAsCodeTraceMetadata({
    stage,
    source: resolvedProfile.source,
    bundle: resolvedProfile.bundle,
    hash,
    repoRoot,
  });
  return {
    policy: resolvedProfile.policy,
    trace: {
      source: resolvedProfile.source,
      bundle: resolvedProfile.bundle,
      hash,
      version: policyAsCode.version,
      signature: policyAsCode.signature,
      policySource: policyAsCode.policySource,
      validation: policyAsCode.validation,
      ...(degraded ? { degraded } : {}),
    },
  };
};

export const applyHeuristicSeverityForStage = (
  rules: RuleSet,
  stage: GateStage,
  enforcement: HeuristicsEnforcementResolution = resolveHeuristicsEnforcement()
): RuleSet => {
  return rules.map((rule) => {
    const severityOverride = heuristicSeverityOverrideForStage(rule.id, stage, enforcement);
    if (severityOverride === null || severityOverride === rule.severity) {
      return rule;
    }
    return {
      ...rule,
      severity: severityOverride,
    };
  });
};

export const policyForPreCommit = (): GatePolicy => {
  return policyForPreCommitFromProfiles();
};

export const policyForPrePush = (): GatePolicy => {
  return policyForPrePushFromProfiles();
};

export const policyForCI = (): GatePolicy => {
  return policyForCIFromProfiles();
};
