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

const heuristicsPromotionStageAllowList = new Set<GateStage>([
  'PRE_COMMIT',
  'PRE_PUSH',
  'CI',
]);
const heuristicsPromotionIgnoreSet = new Set<string>([
  'heuristics.ts.empty-catch.ast',
]);

const heuristicSeverityOverrideForStage = (
  ruleId: string,
  stage: GateStage
): Severity | null => {
  if (!heuristicsPromotionStageAllowList.has(stage)) {
    return null;
  }
  if (!ruleId.startsWith('heuristics.')) {
    return null;
  }
  if (heuristicsPromotionIgnoreSet.has(ruleId)) {
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
    return {
      policy: hardModePolicy,
      trace: {
        source: 'hard-mode',
        bundle,
        hash: createPolicyTraceHash({
          stage,
          source: 'hard-mode',
          blockOnOrAbove: hardModePolicy.blockOnOrAbove,
          warnOnOrAbove: hardModePolicy.warnOnOrAbove,
          sourcePolicyHash: profileName ?? undefined,
        }),
      },
    };
  }

  const defaults = defaultPolicyByStage[stage];
  const loadedPolicy = loadSkillsPolicy(repoRoot);
  const stageOverride = loadedPolicy?.stages[stage];

  if (!stageOverride) {
    return {
      policy: defaults,
      trace: {
        source: 'default',
        bundle: `gate-policy.default.${stage}`,
        hash: createPolicyTraceHash({
          stage,
          source: 'default',
          blockOnOrAbove: defaults.blockOnOrAbove,
          warnOnOrAbove: defaults.warnOnOrAbove,
        }),
      },
    };
  }

  const resolvedPolicy: GatePolicy = {
    stage: defaults.stage,
    blockOnOrAbove: stageOverride.blockOnOrAbove,
    warnOnOrAbove: stageOverride.warnOnOrAbove,
  };

  return {
    policy: resolvedPolicy,
    trace: {
      source: 'skills.policy',
      bundle: `gate-policy.skills.policy.${stage}`,
      hash: createPolicyTraceHash({
        stage,
        source: 'skills.policy',
        blockOnOrAbove: resolvedPolicy.blockOnOrAbove,
        warnOnOrAbove: resolvedPolicy.warnOnOrAbove,
        sourcePolicyHash: createSkillsPolicyDeterministicHash(loadedPolicy),
      }),
    },
  };
};

export const applyHeuristicSeverityForStage = (
  rules: RuleSet,
  stage: GateStage
): RuleSet => {
  return rules.map((rule) => {
    const severityOverride = heuristicSeverityOverrideForStage(rule.id, stage);
    if (!severityOverride || severityOverride === rule.severity) {
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

export const policyForPrePush = (): GatePolicy => {
  return defaultPolicyByStage.PRE_PUSH;
};

export const policyForCI = (): GatePolicy => {
  return defaultPolicyByStage.CI;
};
