import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { GateStage } from '../../core/gate/GateStage';
import type { RuleDefinition } from '../../core/rules/RuleDefinition';
import type { Severity } from '../../core/rules/Severity';

export type SkillsStage = Exclude<GateStage, 'STAGED'>;

export type SkillsRuleConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type SkillsRuleEvaluationMode = 'AUTO' | 'DECLARATIVE';
export type SkillsRuleOrigin = 'core' | 'custom';

export type SkillsCompiledRule = {
  id: string;
  description: string;
  severity: Severity;
  platform: NonNullable<RuleDefinition['platform']>;
  sourceSkill: string;
  sourcePath: string;
  stage?: SkillsStage;
  confidence?: SkillsRuleConfidence;
  locked?: boolean;
  evaluationMode?: SkillsRuleEvaluationMode;
  origin?: SkillsRuleOrigin;
};

export type SkillsLockBundle = {
  name: string;
  version: string;
  source: string;
  hash: string;
  rules: ReadonlyArray<SkillsCompiledRule>;
};

export type SkillsLockV1 = {
  version: '1.0';
  compilerVersion: string;
  generatedAt: string;
  bundles: ReadonlyArray<SkillsLockBundle>;
};

const SKILLS_LOCK_FILE = 'skills.lock.json';
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const SHA256_PATTERN = /^[A-Fa-f0-9]{64}$/;

const severityValues = new Set<Severity>(['INFO', 'WARN', 'ERROR', 'CRITICAL']);
const stageValues = new Set<SkillsStage>(['PRE_COMMIT', 'PRE_PUSH', 'CI']);
const confidenceValues = new Set<SkillsRuleConfidence>(['HIGH', 'MEDIUM', 'LOW']);
const evaluationModeValues = new Set<SkillsRuleEvaluationMode>(['AUTO', 'DECLARATIVE']);
const originValues = new Set<SkillsRuleOrigin>(['core', 'custom']);
const platformValues = new Set<NonNullable<RuleDefinition['platform']>>([
  'ios',
  'android',
  'backend',
  'frontend',
  'text',
  'generic',
]);

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const isIsoTimestamp = (value: unknown): value is string => {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    Number.isFinite(Date.parse(value))
  );
};

const isSeverity = (value: unknown): value is Severity => {
  return typeof value === 'string' && severityValues.has(value as Severity);
};

const isSkillsStage = (value: unknown): value is SkillsStage => {
  return typeof value === 'string' && stageValues.has(value as SkillsStage);
};

const isRuleConfidence = (value: unknown): value is SkillsRuleConfidence => {
  return typeof value === 'string' && confidenceValues.has(value as SkillsRuleConfidence);
};

const isRuleEvaluationMode = (value: unknown): value is SkillsRuleEvaluationMode => {
  return typeof value === 'string' && evaluationModeValues.has(value as SkillsRuleEvaluationMode);
};

const isRuleOrigin = (value: unknown): value is SkillsRuleOrigin => {
  return typeof value === 'string' && originValues.has(value as SkillsRuleOrigin);
};

const isRulePlatform = (
  value: unknown
): value is NonNullable<RuleDefinition['platform']> => {
  return (
    typeof value === 'string' && platformValues.has(value as NonNullable<RuleDefinition['platform']>)
  );
};

const isSemver = (value: unknown): value is string => {
  return typeof value === 'string' && SEMVER_PATTERN.test(value);
};

const isSha256Hex = (value: unknown): value is string => {
  return typeof value === 'string' && SHA256_PATTERN.test(value);
};

const isSkillsCompiledRule = (value: unknown): value is SkillsCompiledRule => {
  if (!isObject(value)) {
    return false;
  }

  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.description)) {
    return false;
  }

  if (!isSeverity(value.severity) || !isRulePlatform(value.platform)) {
    return false;
  }

  if (!isNonEmptyString(value.sourceSkill) || !isNonEmptyString(value.sourcePath)) {
    return false;
  }

  if (typeof value.locked !== 'undefined' && typeof value.locked !== 'boolean') {
    return false;
  }

  if (typeof value.stage !== 'undefined' && !isSkillsStage(value.stage)) {
    return false;
  }

  if (typeof value.confidence !== 'undefined' && !isRuleConfidence(value.confidence)) {
    return false;
  }

  if (
    typeof value.evaluationMode !== 'undefined' &&
    !isRuleEvaluationMode(value.evaluationMode)
  ) {
    return false;
  }

  if (typeof value.origin !== 'undefined' && !isRuleOrigin(value.origin)) {
    return false;
  }

  return true;
};

const isSkillsLockBundle = (value: unknown): value is SkillsLockBundle => {
  if (!isObject(value)) {
    return false;
  }

  if (!isNonEmptyString(value.name) || !isSemver(value.version)) {
    return false;
  }

  if (!isNonEmptyString(value.source) || !isSha256Hex(value.hash)) {
    return false;
  }

  if (!Array.isArray(value.rules) || value.rules.some((rule) => !isSkillsCompiledRule(rule))) {
    return false;
  }

  return true;
};

export const isSkillsLockV1 = (value: unknown): value is SkillsLockV1 => {
  if (!isObject(value)) {
    return false;
  }

  if (value.version !== '1.0' || !isSemver(value.compilerVersion)) {
    return false;
  }

  if (!isIsoTimestamp(value.generatedAt)) {
    return false;
  }

  if (!Array.isArray(value.bundles) || value.bundles.some((bundle) => !isSkillsLockBundle(bundle))) {
    return false;
  }

  return true;
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

const normalizedRuleForHash = (rule: SkillsCompiledRule): Record<string, unknown> => {
  return {
    id: rule.id,
    description: rule.description,
    severity: rule.severity,
    platform: rule.platform,
    sourceSkill: rule.sourceSkill,
    sourcePath: rule.sourcePath,
    stage: rule.stage ?? null,
    confidence: rule.confidence ?? null,
    locked: rule.locked ?? false,
    evaluationMode: rule.evaluationMode ?? null,
    origin: rule.origin ?? null,
  };
};

const normalizedBundleForHash = (bundle: SkillsLockBundle): Record<string, unknown> => {
  const sortedRules = [...bundle.rules].sort((left, right) => left.id.localeCompare(right.id));
  return {
    name: bundle.name,
    version: bundle.version,
    source: bundle.source,
    hash: bundle.hash,
    rules: sortedRules.map((rule) => normalizedRuleForHash(rule)),
  };
};

const normalizedLockForHash = (lock: SkillsLockV1): Record<string, unknown> => {
  const sortedBundles = [...lock.bundles].sort((left, right) => {
    const byName = left.name.localeCompare(right.name);
    if (byName !== 0) {
      return byName;
    }
    return left.version.localeCompare(right.version);
  });

  return {
    version: lock.version,
    compilerVersion: lock.compilerVersion,
    bundles: sortedBundles.map((bundle) => normalizedBundleForHash(bundle)),
  };
};

export const createSkillsLockDeterministicHash = (lock: SkillsLockV1): string => {
  const normalized = normalizedLockForHash(lock);
  return createHash('sha256').update(stableStringify(normalized)).digest('hex');
};

export const parseSkillsLock = (value: unknown): SkillsLockV1 | undefined => {
  return isSkillsLockV1(value) ? value : undefined;
};

export const loadSkillsLock = (repoRoot: string = process.cwd()): SkillsLockV1 | undefined => {
  const filePath = resolve(repoRoot, SKILLS_LOCK_FILE);
  if (!existsSync(filePath)) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
    return parseSkillsLock(parsed);
  } catch {
    return undefined;
  }
};
