import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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
  stage: GateStage
): Severity | null => {
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

const POLICY_AS_CODE_CONTRACT_PATH = '.pumuki/policy-as-code.json';
const POLICY_AS_CODE_VERSION = '1.0';

type PolicyAsCodeContract = {
  version: '1.0';
  source: 'default' | 'skills.policy' | 'hard-mode';
  signatures: Record<SkillsStage, string>;
  expires_at?: string;
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isSha256Hex = (value: unknown): value is string => {
  return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
};

const isIsoDateString = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }
  return Number.isFinite(Date.parse(value));
};

const policyStrictModeFromEnv = (): boolean => {
  const raw = process.env.PUMUKI_POLICY_STRICT?.trim().toLowerCase();
  if (!raw) {
    return false;
  }
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
};

const isPolicyAsCodeContract = (value: unknown): value is PolicyAsCodeContract => {
  if (!isObject(value)) {
    return false;
  }
  if (value.version !== '1.0') {
    return false;
  }
  if (
    value.source !== 'default' &&
    value.source !== 'skills.policy' &&
    value.source !== 'hard-mode'
  ) {
    return false;
  }
  if (!isObject(value.signatures)) {
    return false;
  }
  if (typeof value.expires_at !== 'undefined' && !isIsoDateString(value.expires_at)) {
    return false;
  }
  return (
    isSha256Hex(value.signatures.PRE_COMMIT) &&
    isSha256Hex(value.signatures.PRE_PUSH) &&
    isSha256Hex(value.signatures.CI)
  );
};

const createPolicyAsCodeSignature = (params: {
  stage: SkillsStage;
  source: PolicyProfileSource;
  bundle: string;
  hash: string;
  version: string;
}): string => {
  return createHash('sha256')
    .update(
      JSON.stringify({
        stage: params.stage,
        source: params.source,
        bundle: params.bundle,
        hash: params.hash,
        version: params.version,
      })
    )
    .digest('hex');
};

const resolvePolicyAsCodeTraceMetadata = (params: {
  stage: SkillsStage;
  source: PolicyProfileSource;
  bundle: string;
  hash: string;
  repoRoot: string;
}): {
  version: string;
  signature: string;
  policySource: string;
  validation: NonNullable<ResolvedStagePolicy['trace']['validation']>;
} => {
  const strict = policyStrictModeFromEnv();
  const computedVersion = `policy-as-code/${params.source}@${POLICY_AS_CODE_VERSION}`;
  const computedSignature = createPolicyAsCodeSignature({
    stage: params.stage,
    source: params.source,
    bundle: params.bundle,
    hash: params.hash,
    version: POLICY_AS_CODE_VERSION,
  });
  const contractPath = join(params.repoRoot, POLICY_AS_CODE_CONTRACT_PATH);

  if (!existsSync(contractPath)) {
    if (strict) {
      return {
        version: computedVersion,
        signature: computedSignature,
        policySource: 'computed-local',
        validation: {
          status: 'unsigned',
          code: 'POLICY_AS_CODE_UNSIGNED',
          message:
            'Policy-as-code contract is missing; runtime policy metadata is unsigned.',
          strict,
        },
      };
    }

    return {
      version: computedVersion,
      signature: computedSignature,
      policySource: 'computed-local',
      validation: {
        status: 'valid',
        code: 'POLICY_AS_CODE_VALID',
        message: 'Policy-as-code metadata generated from active runtime policy.',
        strict,
      },
    };
  }

  try {
    const raw: unknown = JSON.parse(readFileSync(contractPath, 'utf8'));
    if (!isPolicyAsCodeContract(raw)) {
      return {
        version: computedVersion,
        signature: computedSignature,
        policySource: `file:${POLICY_AS_CODE_CONTRACT_PATH}`,
        validation: {
          status: 'invalid',
          code: 'POLICY_AS_CODE_CONTRACT_INVALID',
          message: 'Policy-as-code contract is malformed.',
          strict,
        },
      };
    }

    if (raw.source !== params.source) {
      return {
        version: `policy-as-code/${raw.source}@${raw.version}`,
        signature: raw.signatures[params.stage],
        policySource: `file:${POLICY_AS_CODE_CONTRACT_PATH}`,
        validation: {
          status: 'unknown-source',
          code: 'POLICY_AS_CODE_UNKNOWN_SOURCE',
          message:
            `Policy-as-code contract source mismatch: expected=${params.source} actual=${raw.source}.`,
          strict,
        },
      };
    }

    const expectedSignature = createPolicyAsCodeSignature({
      stage: params.stage,
      source: params.source,
      bundle: params.bundle,
      hash: params.hash,
      version: raw.version,
    });
    const stageSignature = raw.signatures[params.stage];

    if (stageSignature !== expectedSignature) {
      return {
        version: `policy-as-code/${raw.source}@${raw.version}`,
        signature: stageSignature,
        policySource: `file:${POLICY_AS_CODE_CONTRACT_PATH}`,
        validation: {
          status: 'invalid',
          code: 'POLICY_AS_CODE_SIGNATURE_MISMATCH',
          message:
            'Policy-as-code signature mismatch for active stage against runtime policy trace.',
          strict,
        },
      };
    }

    if (typeof raw.expires_at === 'string') {
      const expiresAtTimestamp = Date.parse(raw.expires_at);
      if (Number.isFinite(expiresAtTimestamp) && Date.now() >= expiresAtTimestamp) {
        return {
          version: `policy-as-code/${raw.source}@${raw.version}`,
          signature: stageSignature,
          policySource: `file:${POLICY_AS_CODE_CONTRACT_PATH}`,
          validation: {
            status: 'expired',
            code: 'POLICY_AS_CODE_CONTRACT_EXPIRED',
            message: `Policy-as-code contract expired at ${raw.expires_at}.`,
            strict,
          },
        };
      }
    }

    return {
      version: `policy-as-code/${raw.source}@${raw.version}`,
      signature: stageSignature,
      policySource: `file:${POLICY_AS_CODE_CONTRACT_PATH}`,
      validation: {
        status: 'valid',
        code: 'POLICY_AS_CODE_VALID',
        message: 'Policy-as-code contract verified successfully.',
        strict,
      },
    };
  } catch {
    return {
      version: computedVersion,
      signature: computedSignature,
      policySource: `file:${POLICY_AS_CODE_CONTRACT_PATH}`,
      validation: {
        status: 'invalid',
        code: 'POLICY_AS_CODE_CONTRACT_INVALID',
        message: 'Policy-as-code contract cannot be parsed as JSON.',
        strict,
      },
    };
  }
};

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
  stage: GateStage
): RuleSet => {
  return rules.map((rule) => {
    const severityOverride = heuristicSeverityOverrideForStage(rule.id, stage);
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
