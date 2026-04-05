import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GatePolicy } from '../../core/gate/GatePolicy';
import type { GateStage } from '../../core/gate/GateStage';
import type { RuleSet } from '../../core/rules/RuleSet';
import type { Severity } from '../../core/rules/Severity';
import {
  createSkillsPolicyDeterministicHash,
  loadSkillsPolicy,
} from '../config/skillsPolicy';
import type { SkillsStage } from '../config/skillsLock';
import { resolveDegradedMode } from './degradedMode';

const heuristicsPromotionStageAllowList = new Set<GateStage>([
  'PRE_WRITE',
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
    source: 'default' | 'skills.policy' | 'hard-mode';
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

export const mapEnterpriseSeverityToGateSeverity = (
  severity: EnterpriseSeverity
): Severity => {
  switch (severity) {
    case 'CRITICAL':
      return 'CRITICAL';
    case 'HIGH':
      return 'ERROR';
    case 'MEDIUM':
      return 'WARN';
    case 'LOW':
      return 'INFO';
  }
};

type EnterpriseStageThresholds = {
  blockOnOrAbove: EnterpriseSeverity;
  warnOnOrAbove: EnterpriseSeverity;
};

const toGatePolicyFromEnterpriseThresholds = (
  stage: SkillsStage,
  thresholds: EnterpriseStageThresholds
): GatePolicy => {
  return {
    stage,
    blockOnOrAbove: mapEnterpriseSeverityToGateSeverity(thresholds.blockOnOrAbove),
    warnOnOrAbove: mapEnterpriseSeverityToGateSeverity(thresholds.warnOnOrAbove),
  };
};

const toGatePolicyRecordFromEnterpriseThresholds = (
  enterpriseThresholdsByStage: Record<SkillsStage, EnterpriseStageThresholds>
): Record<SkillsStage, GatePolicy> => {
  return {
    PRE_WRITE: toGatePolicyFromEnterpriseThresholds(
      'PRE_WRITE',
      enterpriseThresholdsByStage.PRE_WRITE
    ),
    PRE_COMMIT: toGatePolicyFromEnterpriseThresholds(
      'PRE_COMMIT',
      enterpriseThresholdsByStage.PRE_COMMIT
    ),
    PRE_PUSH: toGatePolicyFromEnterpriseThresholds(
      'PRE_PUSH',
      enterpriseThresholdsByStage.PRE_PUSH
    ),
    CI: toGatePolicyFromEnterpriseThresholds('CI', enterpriseThresholdsByStage.CI),
  };
};

const defaultPolicyByStage: Record<SkillsStage, GatePolicy> = {
  PRE_WRITE: {
    stage: 'PRE_WRITE',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  },
  PRE_COMMIT: {
    stage: 'PRE_COMMIT',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  },
  PRE_PUSH: {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  },
  CI: {
    stage: 'CI',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  },
};

const hardModeEnterpriseThresholdsByStage: Record<SkillsStage, EnterpriseStageThresholds> = {
  PRE_WRITE: {
    blockOnOrAbove: 'MEDIUM',
    warnOnOrAbove: 'LOW',
  },
  PRE_COMMIT: {
    blockOnOrAbove: 'MEDIUM',
    warnOnOrAbove: 'LOW',
  },
  PRE_PUSH: {
    blockOnOrAbove: 'MEDIUM',
    warnOnOrAbove: 'LOW',
  },
  CI: {
    blockOnOrAbove: 'MEDIUM',
    warnOnOrAbove: 'LOW',
  },
};

const hardModePolicyByStage: Record<SkillsStage, GatePolicy> =
  toGatePolicyRecordFromEnterpriseThresholds(hardModeEnterpriseThresholdsByStage);

type HardModeProfileName = 'critical-high' | 'all-severities';

const hardModeEnterpriseThresholdsProfileByStage: Record<
  HardModeProfileName,
  Record<SkillsStage, EnterpriseStageThresholds>
> = {
  'critical-high': {
    PRE_WRITE: {
      blockOnOrAbove: 'HIGH',
      warnOnOrAbove: 'MEDIUM',
    },
    PRE_COMMIT: {
      blockOnOrAbove: 'HIGH',
      warnOnOrAbove: 'MEDIUM',
    },
    PRE_PUSH: {
      blockOnOrAbove: 'HIGH',
      warnOnOrAbove: 'MEDIUM',
    },
    CI: {
      blockOnOrAbove: 'HIGH',
      warnOnOrAbove: 'MEDIUM',
    },
  },
  'all-severities': {
    PRE_WRITE: {
      blockOnOrAbove: 'LOW',
      warnOnOrAbove: 'LOW',
    },
    PRE_COMMIT: {
      blockOnOrAbove: 'LOW',
      warnOnOrAbove: 'LOW',
    },
    PRE_PUSH: {
      blockOnOrAbove: 'LOW',
      warnOnOrAbove: 'LOW',
    },
    CI: {
      blockOnOrAbove: 'LOW',
      warnOnOrAbove: 'LOW',
    },
  },
};

const hardModePolicyProfileByStage: Record<
  HardModeProfileName,
  Record<SkillsStage, GatePolicy>
> = {
  'critical-high': toGatePolicyRecordFromEnterpriseThresholds(
    hardModeEnterpriseThresholdsProfileByStage['critical-high']
  ),
  'all-severities': toGatePolicyRecordFromEnterpriseThresholds(
    hardModeEnterpriseThresholdsProfileByStage['all-severities']
  ),
};

const HARD_MODE_CONFIG_PATH = '.pumuki/hard-mode.json';
const POLICY_AS_CODE_CONTRACT_PATH = '.pumuki/policy-as-code.json';
const POLICY_AS_CODE_VERSION = '1.0';

type PolicyAsCodeContract = {
  version: '1.0';
  source: 'default' | 'skills.policy' | 'hard-mode';
  signatures: Partial<Record<SkillsStage, string>> & Record<'PRE_COMMIT' | 'PRE_PUSH' | 'CI', string>;
  expires_at?: string;
};

const resolveContractSignatureForStage = (
  signatures: PolicyAsCodeContract['signatures'],
  stage: SkillsStage
): string | undefined => {
  if (stage === 'PRE_WRITE') {
    return signatures.PRE_WRITE ?? signatures.PRE_COMMIT;
  }
  return signatures[stage];
};

const toSignatureStageForCompatibility = (stage: SkillsStage): SkillsStage =>
  stage === 'PRE_WRITE' ? 'PRE_COMMIT' : stage;

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
    (typeof value.signatures.PRE_WRITE === 'undefined' || isSha256Hex(value.signatures.PRE_WRITE)) &&
    isSha256Hex(value.signatures.PRE_COMMIT) &&
    isSha256Hex(value.signatures.PRE_PUSH) &&
    isSha256Hex(value.signatures.CI)
  );
};

const createPolicyAsCodeSignature = (params: {
  stage: SkillsStage;
  source: 'default' | 'skills.policy' | 'hard-mode';
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
  source: 'default' | 'skills.policy' | 'hard-mode';
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
        signature: resolveContractSignatureForStage(raw.signatures, params.stage) ?? computedSignature,
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

    const signatureStage = toSignatureStageForCompatibility(params.stage);
    const expectedSignature = createPolicyAsCodeSignature({
      stage: signatureStage,
      source: params.source,
      bundle: params.bundle,
      hash: params.hash,
      version: raw.version,
    });
    const stageSignature = resolveContractSignatureForStage(raw.signatures, params.stage);

    if (stageSignature !== expectedSignature) {
      return {
        version: `policy-as-code/${raw.source}@${raw.version}`,
        signature: stageSignature ?? computedSignature,
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

const toHardModeProfileName = (value: unknown): HardModeProfileName | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'critical-high') {
    return 'critical-high';
  }
  if (normalized === 'all-severities') {
    return 'all-severities';
  }
  return null;
};

const hardModeEnabledFromEnv = (): boolean | null => {
  const value = process.env.PUMUKI_HARD_MODE?.trim().toLowerCase();
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  if (value === '1' || value === 'true' || value === 'yes' || value === 'on') {
    return true;
  }
  if (value === '0' || value === 'false' || value === 'no' || value === 'off') {
    return false;
  }
  return null;
};

const hardModeProfileNameFromEnv = (): HardModeProfileName | null => {
  return toHardModeProfileName(process.env.PUMUKI_HARD_MODE_PROFILE);
};

type HardModeConfigState = {
  enabled: boolean;
  profileName: HardModeProfileName | null;
};

const readHardModeConfig = (repoRoot: string): HardModeConfigState | null => {
  const configPath = join(repoRoot, HARD_MODE_CONFIG_PATH);
  if (!existsSync(configPath)) {
    return null;
  }
  try {
    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as {
      enabled?: unknown;
      profile?: unknown;
    };
    if (typeof parsed.enabled !== 'boolean') {
      return null;
    }
    return {
      enabled: parsed.enabled,
      profileName: toHardModeProfileName(parsed.profile),
    };
  } catch {
    return null;
  }
};

const resolveHardModeState = (repoRoot: string): HardModeConfigState => {
  const configured = readHardModeConfig(repoRoot);
  const envEnabled = hardModeEnabledFromEnv();
  const envProfile = hardModeProfileNameFromEnv();

  if (envEnabled !== null) {
    return {
      enabled: envEnabled,
      profileName: envProfile ?? configured?.profileName ?? null,
    };
  }

  if (configured) {
    return {
      enabled: configured.enabled,
      profileName: envProfile ?? configured.profileName,
    };
  }

  return {
    enabled: false,
    profileName: envProfile,
  };
};


const createPolicyTraceHash = (params: {
  stage: SkillsStage;
  source: 'default' | 'skills.policy' | 'hard-mode';
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
  const hardModeState = resolveHardModeState(repoRoot);
  if (hardModeState.enabled) {
    const profileName = hardModeState.profileName;
    const profilePolicy = profileName
      ? hardModePolicyProfileByStage[profileName][stage]
      : null;
    const hardModePolicy = profilePolicy ?? hardModePolicyByStage[stage];
    const bundle = profileName
      ? `gate-policy.hard-mode.${profileName}.${stage}`
      : `gate-policy.hard-mode.${stage}`;
    const hash = createPolicyTraceHash({
      stage,
      source: 'hard-mode',
      blockOnOrAbove: hardModePolicy.blockOnOrAbove,
      warnOnOrAbove: hardModePolicy.warnOnOrAbove,
      sourcePolicyHash: profileName ?? undefined,
    });
    const policyAsCode = resolvePolicyAsCodeTraceMetadata({
      stage,
      source: 'hard-mode',
      bundle,
      hash,
      repoRoot,
    });
    return {
      policy: hardModePolicy,
      trace: {
        source: 'hard-mode',
        bundle,
        hash,
        version: policyAsCode.version,
        signature: policyAsCode.signature,
        policySource: policyAsCode.policySource,
        validation: policyAsCode.validation,
        ...(degraded ? { degraded } : {}),
      },
    };
  }

  const defaults = defaultPolicyByStage[stage];
  const loadedPolicy = loadSkillsPolicy(repoRoot);
  const stageOverride = loadedPolicy?.stages[stage];

  if (!stageOverride) {
    const bundle = `gate-policy.default.${stage}`;
    const hash = createPolicyTraceHash({
      stage,
      source: 'default',
      blockOnOrAbove: defaults.blockOnOrAbove,
      warnOnOrAbove: defaults.warnOnOrAbove,
    });
    const policyAsCode = resolvePolicyAsCodeTraceMetadata({
      stage,
      source: 'default',
      bundle,
      hash,
      repoRoot,
    });
    return {
      policy: defaults,
      trace: {
        source: 'default',
        bundle,
        hash,
        version: policyAsCode.version,
        signature: policyAsCode.signature,
        policySource: policyAsCode.policySource,
        validation: policyAsCode.validation,
        ...(degraded ? { degraded } : {}),
      },
    };
  }

  const resolvedPolicy: GatePolicy = {
    stage: defaults.stage,
    blockOnOrAbove: stageOverride.blockOnOrAbove,
    warnOnOrAbove: stageOverride.warnOnOrAbove,
  };

  const bundle = `gate-policy.skills.policy.${stage}`;
  const hash = createPolicyTraceHash({
    stage,
    source: 'skills.policy',
    blockOnOrAbove: resolvedPolicy.blockOnOrAbove,
    warnOnOrAbove: resolvedPolicy.warnOnOrAbove,
    sourcePolicyHash: createSkillsPolicyDeterministicHash(loadedPolicy),
  });
  const policyAsCode = resolvePolicyAsCodeTraceMetadata({
    stage,
    source: 'skills.policy',
    bundle,
    hash,
    repoRoot,
  });
  return {
    policy: resolvedPolicy,
    trace: {
      source: 'skills.policy',
      bundle,
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
  return defaultPolicyByStage.PRE_COMMIT;
};

export const policyForPreWrite = (): GatePolicy => {
  return defaultPolicyByStage.PRE_WRITE;
};

export const policyForPrePush = (): GatePolicy => {
  return defaultPolicyByStage.PRE_PUSH;
};

export const policyForCI = (): GatePolicy => {
  return defaultPolicyByStage.CI;
};
