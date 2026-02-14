import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { GatePolicy } from '../../core/gate/GatePolicy';
import type { Severity } from '../../core/rules/Severity';
import type { SkillsStage } from './skillsLock';

export type SkillsStagePolicy = Pick<GatePolicy, 'blockOnOrAbove' | 'warnOnOrAbove'>;

export type SkillsBundlePolicy = {
  enabled: boolean;
  promoteToErrorRuleIds?: ReadonlyArray<string>;
};

export type SkillsPolicyV1 = {
  version: '1.0';
  defaultBundleEnabled: boolean;
  stages: Record<SkillsStage, SkillsStagePolicy>;
  bundles: Record<string, SkillsBundlePolicy>;
};

const SKILLS_POLICY_FILE = 'skills.policy.json';

const severityValues = new Set<Severity>(['INFO', 'WARN', 'ERROR', 'CRITICAL']);
const stageValues = new Set<SkillsStage>(['PRE_COMMIT', 'PRE_PUSH', 'CI']);

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isSeverity = (value: unknown): value is Severity => {
  return typeof value === 'string' && severityValues.has(value as Severity);
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const isSkillsStagePolicy = (value: unknown): value is SkillsStagePolicy => {
  if (!isObject(value)) {
    return false;
  }

  return isSeverity(value.blockOnOrAbove) && isSeverity(value.warnOnOrAbove);
};

const isStringArray = (value: unknown): value is ReadonlyArray<string> => {
  return Array.isArray(value) && value.every((item) => isNonEmptyString(item));
};

const isSkillsBundlePolicy = (value: unknown): value is SkillsBundlePolicy => {
  if (!isObject(value)) {
    return false;
  }

  if (typeof value.enabled !== 'boolean') {
    return false;
  }

  if (
    typeof value.promoteToErrorRuleIds !== 'undefined' &&
    !isStringArray(value.promoteToErrorRuleIds)
  ) {
    return false;
  }

  return true;
};

const isSkillsStageMap = (
  value: unknown
): value is Record<SkillsStage, SkillsStagePolicy> => {
  if (!isObject(value)) {
    return false;
  }

  for (const stage of stageValues) {
    if (!isSkillsStagePolicy(value[stage])) {
      return false;
    }
  }

  return true;
};

const isSkillsBundleMap = (value: unknown): value is Record<string, SkillsBundlePolicy> => {
  if (!isObject(value)) {
    return false;
  }

  for (const [bundleName, bundleConfig] of Object.entries(value)) {
    if (!isNonEmptyString(bundleName) || !isSkillsBundlePolicy(bundleConfig)) {
      return false;
    }
  }

  return true;
};

export const isSkillsPolicyV1 = (value: unknown): value is SkillsPolicyV1 => {
  if (!isObject(value)) {
    return false;
  }

  return (
    value.version === '1.0' &&
    typeof value.defaultBundleEnabled === 'boolean' &&
    isSkillsStageMap(value.stages) &&
    isSkillsBundleMap(value.bundles)
  );
};

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (isObject(value)) {
    const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`;
  }

  return JSON.stringify(value) ?? 'null';
};

const normalizedBundlePolicy = (value: SkillsBundlePolicy): Record<string, unknown> => {
  return {
    enabled: value.enabled,
    promoteToErrorRuleIds: [...(value.promoteToErrorRuleIds ?? [])].sort(),
  };
};

const normalizedPolicyForHash = (policy: SkillsPolicyV1): Record<string, unknown> => {
  const bundleEntries = Object.entries(policy.bundles).sort(([left], [right]) =>
    left.localeCompare(right)
  );

  return {
    version: policy.version,
    defaultBundleEnabled: policy.defaultBundleEnabled,
    stages: {
      PRE_COMMIT: policy.stages.PRE_COMMIT,
      PRE_PUSH: policy.stages.PRE_PUSH,
      CI: policy.stages.CI,
    },
    bundles: bundleEntries.map(([name, config]) => ({
      name,
      ...normalizedBundlePolicy(config),
    })),
  };
};

export const createSkillsPolicyDeterministicHash = (policy: SkillsPolicyV1): string => {
  const normalized = normalizedPolicyForHash(policy);
  return createHash('sha256').update(stableStringify(normalized)).digest('hex');
};

export const parseSkillsPolicy = (value: unknown): SkillsPolicyV1 | undefined => {
  return isSkillsPolicyV1(value) ? value : undefined;
};

export const loadSkillsPolicy = (
  repoRoot: string = process.cwd()
): SkillsPolicyV1 | undefined => {
  const filePath = resolve(repoRoot, SKILLS_POLICY_FILE);
  if (!existsSync(filePath)) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
    return parseSkillsPolicy(parsed);
  } catch {
    return undefined;
  }
};
