import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';
import type { RuleDefinition } from '../../core/rules/RuleDefinition';
import type { Severity } from '../../core/rules/Severity';
import {
  type SkillsCompiledRule,
  type SkillsLockBundle,
  type SkillsLockV1,
  type SkillsRuleConfidence,
  type SkillsRuleEvaluationMode,
  type SkillsRuleOrigin,
  type SkillsStage,
} from './skillsLock';
import { extractCompiledRulesFromSkillMarkdown } from './skillsMarkdownRules';

const CUSTOM_RULES_FILE_CANDIDATES = [
  '.pumuki/custom-rules.json',
  'pumuki.custom-rules.json',
] as const;

type CustomSkillsRuleV1 = {
  id: string;
  description: string;
  severity: Severity;
  platform: NonNullable<RuleDefinition['platform']>;
  stage?: SkillsStage;
  confidence?: SkillsRuleConfidence;
  locked?: boolean;
  evaluationMode?: SkillsRuleEvaluationMode;
};

export type CustomSkillsRulesFileV1 = {
  version: '1.0';
  generatedAt: string;
  source_files: string[];
  rules: CustomSkillsRuleV1[];
};

export type CustomSkillsImportResult = {
  sourceFiles: string[];
  importedRules: SkillsCompiledRule[];
  outputPath: string;
};

const severityValues = new Set<Severity>(['INFO', 'WARN', 'ERROR', 'CRITICAL']);
const stageValues = new Set<SkillsStage>(['PRE_COMMIT', 'PRE_PUSH', 'CI']);
const confidenceValues = new Set<SkillsRuleConfidence>(['HIGH', 'MEDIUM', 'LOW']);
const evaluationModeValues = new Set<SkillsRuleEvaluationMode>(['AUTO', 'DECLARATIVE']);
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

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (isObject(value)) {
    const entries = Object.entries(value).sort(([left], [right]) =>
      left.localeCompare(right)
    );
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
};

const isCustomRule = (value: unknown): value is CustomSkillsRuleV1 => {
  if (!isObject(value)) {
    return false;
  }
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.description)) {
    return false;
  }
  if (
    typeof value.severity !== 'string' ||
    !severityValues.has(value.severity as Severity)
  ) {
    return false;
  }
  if (
    typeof value.platform !== 'string' ||
    !platformValues.has(value.platform as NonNullable<RuleDefinition['platform']>)
  ) {
    return false;
  }
  if (typeof value.stage !== 'undefined' && !stageValues.has(value.stage as SkillsStage)) {
    return false;
  }
  if (
    typeof value.confidence !== 'undefined' &&
    !confidenceValues.has(value.confidence as SkillsRuleConfidence)
  ) {
    return false;
  }
  if (
    typeof value.evaluationMode !== 'undefined' &&
    !evaluationModeValues.has(value.evaluationMode as SkillsRuleEvaluationMode)
  ) {
    return false;
  }
  if (typeof value.locked !== 'undefined' && typeof value.locked !== 'boolean') {
    return false;
  }
  return true;
};

const isCustomSkillsRulesFile = (value: unknown): value is CustomSkillsRulesFileV1 => {
  if (!isObject(value)) {
    return false;
  }
  if (value.version !== '1.0') {
    return false;
  }
  if (!isNonEmptyString(value.generatedAt) || !Number.isFinite(Date.parse(value.generatedAt))) {
    return false;
  }
  if (!Array.isArray(value.source_files) || !value.source_files.every(isNonEmptyString)) {
    return false;
  }
  if (!Array.isArray(value.rules) || value.rules.some((rule) => !isCustomRule(rule))) {
    return false;
  }
  return true;
};

const normalizePath = (params: { repoRoot: string; path: string }): string => {
  const absolute = isAbsolute(params.path)
    ? params.path
    : resolve(params.repoRoot, params.path);
  return resolve(absolute);
};

const toRepoRelativePath = (params: { repoRoot: string; absolutePath: string }): string => {
  const rel = relative(params.repoRoot, params.absolutePath);
  if (!rel.startsWith('..') && !isAbsolute(rel)) {
    return rel.replace(/\\/g, '/');
  }
  return params.absolutePath.replace(/\\/g, '/');
};

const computeBundleHash = (rules: ReadonlyArray<SkillsCompiledRule>): string => {
  const normalized = rules
    .map((rule) => ({
      id: rule.id,
      description: rule.description,
      severity: rule.severity,
      platform: rule.platform,
      stage: rule.stage ?? null,
      confidence: rule.confidence ?? null,
      locked: rule.locked ?? false,
      evaluationMode: rule.evaluationMode ?? null,
      origin: rule.origin ?? null,
      sourceSkill: rule.sourceSkill,
      sourcePath: rule.sourcePath,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  return createHash('sha256').update(stableStringify(normalized)).digest('hex');
};

const resolveCustomRulesFilePath = (repoRoot: string): string | undefined => {
  for (const candidate of CUSTOM_RULES_FILE_CANDIDATES) {
    const absolute = resolve(repoRoot, candidate);
    if (existsSync(absolute)) {
      return absolute;
    }
  }
  return undefined;
};

const toCustomRulesFile = (
  rules: ReadonlyArray<SkillsCompiledRule>,
  sourceFiles: ReadonlyArray<string>
): CustomSkillsRulesFileV1 => {
  const normalizedRules = rules
    .map((rule) => ({
      id: rule.id,
      description: rule.description,
      severity: rule.severity,
      platform: rule.platform,
      stage: rule.stage,
      confidence: rule.confidence,
      locked: rule.locked ?? false,
      evaluationMode: rule.evaluationMode ?? 'AUTO',
    }))
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    source_files: [...new Set(sourceFiles)].sort(),
    rules: normalizedRules,
  };
};

const readJson = (absolutePath: string): unknown => {
  try {
    return JSON.parse(readFileSync(absolutePath, 'utf8')) as unknown;
  } catch {
    return undefined;
  }
};

export const loadCustomSkillsRulesFile = (
  repoRoot: string = process.cwd()
): CustomSkillsRulesFileV1 | undefined => {
  const path = resolveCustomRulesFilePath(repoRoot);
  if (!path) {
    return undefined;
  }
  const parsed = readJson(path);
  if (!isCustomSkillsRulesFile(parsed)) {
    return undefined;
  }
  return parsed;
};

export const loadCustomSkillsLock = (
  repoRoot: string = process.cwd()
): SkillsLockV1 | undefined => {
  const payload = loadCustomSkillsRulesFile(repoRoot);
  if (!payload || payload.rules.length === 0) {
    return undefined;
  }

  const rules: SkillsCompiledRule[] = payload.rules.map((rule) => ({
    ...rule,
    sourceSkill: 'custom-guidelines',
    sourcePath: '.pumuki/custom-rules.json',
    evaluationMode: rule.evaluationMode ?? 'AUTO',
    origin: 'custom',
  }));

  const bundle: SkillsLockBundle = {
    name: 'custom-guidelines',
    version: '1.0.0',
    source: 'file:.pumuki/custom-rules.json',
    hash: computeBundleHash(rules),
    rules,
  };

  return {
    version: '1.0',
    compilerVersion: 'custom-1.0.0',
    generatedAt: payload.generatedAt,
    bundles: [bundle],
  };
};

const extractSkillPathsFromText = (content: string): string[] => {
  const matches = content.match(
    /(\/[^\s`'"]*SKILL\.md|(?:\.{1,2}\/)?[A-Za-z0-9_./-]*SKILL\.md)/g
  );
  if (!matches) {
    return [];
  }
  return matches;
};

const sourceSkillNameFromPath = (path: string): string => {
  const parent = basename(dirname(path));
  if (parent && parent.toUpperCase() !== 'SKILL.MD') {
    return parent;
  }
  return basename(path).replace(/\.md$/i, '');
};

export const resolveSkillImportSources = (params: {
  repoRoot?: string;
  explicitSources?: ReadonlyArray<string>;
}): string[] => {
  const repoRoot = params.repoRoot ?? process.cwd();
  const resolved = new Set<string>();

  const pushIfExists = (rawPath: string): void => {
    const normalized = normalizePath({
      repoRoot,
      path: rawPath,
    });
    if (!existsSync(normalized)) {
      return;
    }
    resolved.add(normalized);
  };

  if (params.explicitSources && params.explicitSources.length > 0) {
    for (const source of params.explicitSources) {
      pushIfExists(source);
    }
    return [...resolved].sort();
  }

  for (const profileFile of ['AGENTS.md', 'SKILLS.md']) {
    const profilePath = resolve(repoRoot, profileFile);
    if (!existsSync(profilePath)) {
      continue;
    }
    const content = readFileSync(profilePath, 'utf8');
    for (const candidate of extractSkillPathsFromText(content)) {
      pushIfExists(candidate);
    }
  }

  return [...resolved].sort();
};

export const importCustomSkillsRules = (params: {
  repoRoot?: string;
  sourceFiles?: ReadonlyArray<string>;
}): CustomSkillsImportResult => {
  const repoRoot = params.repoRoot ?? process.cwd();
  const sourceFiles = resolveSkillImportSources({
    repoRoot,
    explicitSources: params.sourceFiles,
  });

  const importedRules: SkillsCompiledRule[] = [];
  const usedRuleIds = new Set<string>();

  for (const sourceFile of sourceFiles) {
    const sourceContent = readFileSync(sourceFile, 'utf8');
    const sourceSkill = sourceSkillNameFromPath(sourceFile);
    const sourcePath = toRepoRelativePath({
      repoRoot,
      absolutePath: sourceFile,
    });

    const extracted = extractCompiledRulesFromSkillMarkdown({
      sourceSkill,
      sourcePath,
      sourceContent,
      existingRuleIds: [...usedRuleIds],
      origin: 'custom',
    });

    for (const rule of extracted) {
      usedRuleIds.add(rule.id);
      importedRules.push({
        ...rule,
        origin: 'custom' as SkillsRuleOrigin,
      });
    }
  }

  const outputPath = resolve(repoRoot, '.pumuki/custom-rules.json');
  mkdirSync(dirname(outputPath), { recursive: true });
  const payload = toCustomRulesFile(importedRules, sourceFiles);
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  return {
    sourceFiles,
    importedRules: importedRules.sort((left, right) => left.id.localeCompare(right.id)),
    outputPath,
  };
};
