import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type SkillsSourceBundleV1 = {
  name: string;
  version: string;
  sourcePath: string;
  template: string;
  source?: string;
  enabled?: boolean;
};

export type SkillsSourcesV1 = {
  version: '1.0';
  bundles: ReadonlyArray<SkillsSourceBundleV1>;
};

const SKILLS_SOURCES_FILE = 'skills.sources.json';
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

const isObject = (value: unknown): value is Record<string, string | number | boolean | bigint | symbol | null | Date | object> => {
  return typeof value === 'object' && value !== null;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const isSemver = (value: unknown): value is string => {
  return typeof value === 'string' && SEMVER_PATTERN.test(value);
};

const isSkillsSourceBundleV1 = (value: unknown): value is SkillsSourceBundleV1 => {
  if (!isObject(value)) {
    return false;
  }

  if (!isNonEmptyString(value.name) || !isSemver(value.version)) {
    return false;
  }

  if (!isNonEmptyString(value.sourcePath) || !isNonEmptyString(value.template)) {
    return false;
  }

  if (typeof value.source !== 'undefined' && !isNonEmptyString(value.source)) {
    return false;
  }

  if (typeof value.enabled !== 'undefined' && typeof value.enabled !== 'boolean') {
    return false;
  }

  return true;
};

export const isSkillsSourcesV1 = (value: unknown): value is SkillsSourcesV1 => {
  if (!isObject(value)) {
    return false;
  }

  return (
    value.version === '1.0' &&
    Array.isArray(value.bundles) &&
    value.bundles.every((bundle) => isSkillsSourceBundleV1(bundle))
  );
};

export const parseSkillsSources = (value: unknown): SkillsSourcesV1 | undefined => {
  return isSkillsSourcesV1(value) ? value : undefined;
};

export const loadSkillsSources = (
  repoRoot: string = process.cwd(),
  manifestFile: string = SKILLS_SOURCES_FILE
): SkillsSourcesV1 | undefined => {
  const filePath = resolve(repoRoot, manifestFile);
  if (!existsSync(filePath)) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
    return parseSkillsSources(parsed);
  } catch {
    return undefined;
  }
};
