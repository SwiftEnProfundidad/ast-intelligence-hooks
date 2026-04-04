import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { GatePolicy } from '../../core/gate/GatePolicy';
import {
  createSkillsPolicyDeterministicHash,
  loadSkillsPolicy,
} from '../config/skillsPolicy';
import type { SkillsStage } from '../config/skillsLock';

export type PolicyProfileSource = 'default' | 'skills.policy' | 'hard-mode';
export type PolicyProfileLayer = 'policy-pack';
export type PolicyProfileActivation = 'default-advisory' | 'explicit';
export type PolicyPackActivationSource =
  | 'env'
  | 'file:.pumuki/hard-mode.json'
  | 'file:skills.policy.json';

export type ResolvedPolicyProfile = {
  policy: GatePolicy;
  source: PolicyProfileSource;
  layer: PolicyProfileLayer;
  activation: PolicyProfileActivation;
  activationSource: PolicyPackActivationSource | null;
  bundle: string;
  sourcePolicyHash?: string;
};

export type EnterpriseSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

type EnterpriseStageThresholds = {
  blockOnOrAbove: EnterpriseSeverity;
  warnOnOrAbove: EnterpriseSeverity;
};

const mapEnterpriseSeverityToGateSeverity = (
  severity: EnterpriseSeverity
): GatePolicy['blockOnOrAbove'] => {
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

const toGatePolicyFromEnterpriseThresholds = (
  stage: SkillsStage,
  thresholds: EnterpriseStageThresholds
): GatePolicy => {
  return {
    stage,
    blockOnOrAbove: mapEnterpriseSeverityToGateSeverity(
      thresholds.blockOnOrAbove
    ),
    warnOnOrAbove: mapEnterpriseSeverityToGateSeverity(
      thresholds.warnOnOrAbove
    ),
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
    CI: toGatePolicyFromEnterpriseThresholds(
      'CI',
      enterpriseThresholdsByStage.CI
    ),
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

const hardModeEnterpriseThresholdsByStage: Record<
  SkillsStage,
  EnterpriseStageThresholds
> = {
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
  toGatePolicyRecordFromEnterpriseThresholds(
    hardModeEnterpriseThresholdsByStage
  );

export type HardModeProfileName = 'critical-high' | 'all-severities';

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

export const HARD_MODE_CONFIG_PATH = '.pumuki/hard-mode.json';

const toHardModeProfileName = (
  value: unknown
): HardModeProfileName | null => {
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

export type PersistedHardModeConfig = HardModeConfigState & {
  configPath: typeof HARD_MODE_CONFIG_PATH;
};

export type HardModeRuntimeState = HardModeConfigState & {
  activationSource: 'env' | 'file:.pumuki/hard-mode.json' | null;
  configPath: typeof HARD_MODE_CONFIG_PATH;
};

export type ExplicitPolicyPackSelection =
  | {
    source: 'hard-mode';
    activation: 'explicit';
    activationSource: 'env' | 'file:.pumuki/hard-mode.json';
    profileName: HardModeProfileName | null;
  }
  | {
    source: 'skills.policy';
    activation: 'explicit';
    activationSource: 'file:skills.policy.json';
    policy: NonNullable<ReturnType<typeof loadSkillsPolicy>>;
    sourcePolicyHash: string;
  };

export const readPersistedHardModeConfig = (
  repoRoot: string
): PersistedHardModeConfig | null => {
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
      configPath: HARD_MODE_CONFIG_PATH,
    };
  } catch {
    return null;
  }
};

export const resolveHardModeRuntimeState = (
  repoRoot: string
): HardModeRuntimeState => {
  const configured = readPersistedHardModeConfig(repoRoot);
  const envEnabled = hardModeEnabledFromEnv();
  const envProfile = hardModeProfileNameFromEnv();

  if (envEnabled !== null) {
    return {
      enabled: envEnabled,
      profileName: envProfile ?? configured?.profileName ?? null,
      activationSource: 'env',
      configPath: HARD_MODE_CONFIG_PATH,
    };
  }

  if (configured) {
    return {
      enabled: configured.enabled,
      profileName: envProfile ?? configured.profileName,
      activationSource: 'file:.pumuki/hard-mode.json',
      configPath: configured.configPath,
    };
  }

  return {
    enabled: false,
    profileName: envProfile,
    activationSource: null,
    configPath: HARD_MODE_CONFIG_PATH,
  };
};

export const resolveExplicitPolicyPackSelection = (
  repoRoot: string = process.cwd()
): ExplicitPolicyPackSelection | null => {
  const hardModeState = resolveHardModeRuntimeState(repoRoot);
  if (hardModeState.enabled && hardModeState.activationSource) {
    return {
      source: 'hard-mode',
      activation: 'explicit',
      activationSource: hardModeState.activationSource,
      profileName: hardModeState.profileName,
    };
  }

  const loadedPolicy = loadSkillsPolicy(repoRoot);
  if (!loadedPolicy) {
    return null;
  }

  return {
    source: 'skills.policy',
    activation: 'explicit',
    activationSource: 'file:skills.policy.json',
    policy: loadedPolicy,
    sourcePolicyHash: createSkillsPolicyDeterministicHash(loadedPolicy),
  };
};

export const resolveCorePolicyForStage = (
  stage: SkillsStage
): GatePolicy => {
  return defaultPolicyByStage[stage];
};

export const resolveDefaultAdvisoryPolicyProfileForStage = (
  stage: SkillsStage
): ResolvedPolicyProfile => {
  return {
    policy: resolveCorePolicyForStage(stage),
    source: 'default',
    layer: 'policy-pack',
    activation: 'default-advisory',
    activationSource: null,
    bundle: `gate-policy.default.${stage}`,
  };
};

export const resolveExplicitPolicyProfileForStage = (
  stage: SkillsStage,
  repoRoot: string = process.cwd()
): ResolvedPolicyProfile | null => {
  const explicitPack = resolveExplicitPolicyPackSelection(repoRoot);
  if (!explicitPack) {
    return null;
  }

  if (explicitPack.source === 'hard-mode') {
    const profileName = explicitPack.profileName;
    const profilePolicy = profileName
      ? hardModePolicyProfileByStage[profileName][stage]
      : null;
    const hardModePolicy = profilePolicy ?? hardModePolicyByStage[stage];
    return {
      policy: hardModePolicy,
      source: 'hard-mode',
      layer: 'policy-pack',
      activation: 'explicit',
      activationSource: explicitPack.activationSource,
      bundle: profileName
        ? `gate-policy.hard-mode.${profileName}.${stage}`
        : `gate-policy.hard-mode.${stage}`,
      sourcePolicyHash: profileName ?? undefined,
    };
  }

  const defaults = resolveCorePolicyForStage(stage);
  const stageOverride = explicitPack.policy.stages[stage];

  return {
    policy: {
      stage: defaults.stage,
      blockOnOrAbove: stageOverride.blockOnOrAbove,
      warnOnOrAbove: stageOverride.warnOnOrAbove,
    },
    source: 'skills.policy',
    layer: 'policy-pack',
    activation: 'explicit',
    activationSource: explicitPack.activationSource,
    bundle: `gate-policy.skills.policy.${stage}`,
    sourcePolicyHash: explicitPack.sourcePolicyHash,
  };
};

export const resolvePolicyProfileForStage = (
  stage: SkillsStage,
  repoRoot: string = process.cwd()
): ResolvedPolicyProfile => {
  return (
    resolveExplicitPolicyProfileForStage(stage, repoRoot) ??
    resolveDefaultAdvisoryPolicyProfileForStage(stage)
  );
};

export const policyForPreCommit = (): GatePolicy => {
  return resolveCorePolicyForStage('PRE_COMMIT');
};

export const policyForPreWrite = (): GatePolicy => {
  return resolveCorePolicyForStage('PRE_WRITE');
};

export const policyForPrePush = (): GatePolicy => {
  return resolveCorePolicyForStage('PRE_PUSH');
};

export const policyForCI = (): GatePolicy => {
  return resolveCorePolicyForStage('CI');
};

export { mapEnterpriseSeverityToGateSeverity };
