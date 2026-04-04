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
  ast_node_ids?: string[];
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

export type CompiledImportedSkillsRulesResult = Omit<
  CustomSkillsImportResult,
  'outputPath'
>;

type VendorSkillManifestEntry = {
  name: string;
  file: string;
};

type VendorSkillsManifest = {
  skills: VendorSkillManifestEntry[];
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

const isObject = (value: unknown): value is Record<string, string | number | boolean | bigint | symbol | null | Date | object> => {
  return typeof value === 'object' && value !== null;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const isVendorSkillManifestEntry = (
  value: unknown
): value is VendorSkillManifestEntry => {
  return (
    isObject(value) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.file)
  );
};

const isVendorSkillsManifest = (value: unknown): value is VendorSkillsManifest => {
  return (
    isObject(value) &&
    Array.isArray(value.skills) &&
    value.skills.every((entry) => isVendorSkillManifestEntry(entry))
  );
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
  if (
    typeof value.ast_node_ids !== 'undefined' &&
    (!Array.isArray(value.ast_node_ids) ||
      value.ast_node_ids.length === 0 ||
      !value.ast_node_ids.every(isNonEmptyString))
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
      ast_node_ids:
        rule.astNodeIds && rule.astNodeIds.length > 0
          ? [...new Set(rule.astNodeIds)].sort()
          : null,
      origin: rule.origin ?? null,
      sourceSkill: rule.sourceSkill,
      sourcePath: rule.sourcePath,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  return createHash('sha256').update(stableStringify(normalized)).digest('hex');
};

const resolveCustomRulesFilePath = (repoRoot: string) => {
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
      ast_node_ids:
        rule.astNodeIds && rule.astNodeIds.length > 0
          ? [...new Set(rule.astNodeIds)].sort()
          : undefined,
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
) => {
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
    astNodeIds: rule.ast_node_ids,
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

const isVendoredSkillMarkdownPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/');
  return (
    normalized.includes('/docs/codex-skills/') ||
    normalized.startsWith('docs/codex-skills/') ||
    normalized.includes('/vendor/skills/') ||
    normalized.startsWith('vendor/skills/')
  );
};

const isSkillMarkdownCandidatePath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/');
  return /(^|\/)SKILL\.md$/i.test(normalized) || isVendoredSkillMarkdownPath(normalized);
};

const extractSkillPathsFromText = (content: string): string[] => {
  const matches = content.match(
    /(\/[^\s`'"]+\.md|(?:\.{1,2}\/)?[A-Za-z0-9_./:-]+\.md)/g
  );
  if (!matches) {
    return [];
  }
  return [...new Set(matches.filter(isSkillMarkdownCandidatePath))];
};

const extractRequiredSkillNamesFromText = (content: string): string[] => {
  const names = new Set<string>();
  const pattern =
    /REQUIRED\s+SKILL\s*:\s*["'`]?([A-Za-z0-9_.:/-]+(?:\s+[A-Za-z0-9_.:/-]+)*)["'`]?/gi;

  for (const match of content.matchAll(pattern)) {
    const rawName = match[1]?.trim();
    if (rawName) {
      names.add(rawName);
    }
  }

  return [...names];
};

const sourceSkillNameFromPath = (path: string): string => {
  const fileName = basename(path);
  if (/^SKILL\.md$/i.test(fileName)) {
    return basename(dirname(path));
  }
  return fileName.replace(/\.md$/i, '');
};

const CANONICAL_IMPORTED_SKILL_NAMES: Readonly<Record<string, string>> = {
  android: 'android-guidelines',
  'android-guidelines': 'android-guidelines',
  'android-enterprise-rules': 'android-guidelines',
  backend: 'backend-guidelines',
  'backend-guidelines': 'backend-guidelines',
  'backend-enterprise-rules': 'backend-guidelines',
  'enterprise-operating-system': 'enterprise-operating-system',
  frontend: 'frontend-guidelines',
  'frontend-guidelines': 'frontend-guidelines',
  'frontend-enterprise-rules': 'frontend-guidelines',
  ios: 'ios-guidelines',
  'ios-guidelines': 'ios-guidelines',
  'ios-enterprise-rules': 'ios-guidelines',
  'swift-concurrency': 'ios-concurrency-guidelines',
  'swift-concurrency-guidelines': 'ios-concurrency-guidelines',
  'ios-concurrency-guidelines': 'ios-concurrency-guidelines',
  'swiftui-expert-skill': 'ios-swiftui-expert-guidelines',
  'swiftui-guidelines': 'ios-swiftui-expert-guidelines',
  'ios-swiftui-expert-guidelines': 'ios-swiftui-expert-guidelines',
  'swift-testing-expert': 'ios-swift-testing-guidelines',
  'swift-testing-guidelines': 'ios-swift-testing-guidelines',
  'ios-swift-testing-guidelines': 'ios-swift-testing-guidelines',
  'core-data-expert': 'ios-core-data-guidelines',
  'core-data-guidelines': 'ios-core-data-guidelines',
  'ios-core-data-guidelines': 'ios-core-data-guidelines',
};

export const toCanonicalImportedSkillName = (rawName: string): string => {
  const normalized = rawName
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return CANONICAL_IMPORTED_SKILL_NAMES[normalized] ?? rawName;
};

export const canonicalImportedSkillNameFromPath = (path: string): string => {
  return toCanonicalImportedSkillName(sourceSkillNameFromPath(path));
};

const loadVendorSkillsManifest = (
  repoRoot: string
): ReadonlyMap<string, string> => {
  const manifestPath = resolve(repoRoot, 'vendor/skills/MANIFEST.json');
  if (!existsSync(manifestPath)) {
    return new Map();
  }

  const parsed = readJson(manifestPath);
  if (!isVendorSkillsManifest(parsed)) {
    return new Map();
  }

  const bySkillName = new Map<string, string>();
  for (const entry of parsed.skills) {
    bySkillName.set(
      toCanonicalImportedSkillName(entry.name),
      normalizePath({ repoRoot, path: entry.file })
    );
  }
  return bySkillName;
};

export const resolveSkillImportSources = (params: {
  repoRoot?: string;
  explicitSources?: ReadonlyArray<string>;
}): string[] => {
  const repoRoot = params.repoRoot ?? process.cwd();
  const resolved = new Map<string, { path: string; priority: number }>();
  const vendoredManifest = loadVendorSkillsManifest(repoRoot);

  const pushIfExists = (rawPath: string): void => {
    const normalized = normalizePath({
      repoRoot,
      path: rawPath,
    });
    if (!existsSync(normalized)) {
      return;
    }
    const skillKey = toCanonicalImportedSkillName(sourceSkillNameFromPath(normalized));
    const priority = isVendoredSkillMarkdownPath(normalized) ? 2 : 1;
    const current = resolved.get(skillKey);
    if (
      !current ||
      priority > current.priority ||
      (priority === current.priority && normalized.localeCompare(current.path) < 0)
    ) {
      resolved.set(skillKey, { path: normalized, priority });
    }
  };

  if (params.explicitSources && params.explicitSources.length > 0) {
    for (const source of params.explicitSources) {
      pushIfExists(source);
    }
    return [...resolved.values()]
      .map((item) => item.path)
      .sort();
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
    for (const requiredSkillName of extractRequiredSkillNamesFromText(content)) {
      const canonicalName = toCanonicalImportedSkillName(requiredSkillName);
      const manifestPath = vendoredManifest.get(canonicalName);
      if (manifestPath) {
        pushIfExists(manifestPath);
        continue;
      }
      pushIfExists(`vendor/skills/${requiredSkillName}/SKILL.md`);
      pushIfExists(`vendor/skills/${canonicalName}/SKILL.md`);
    }
  }

  return [...resolved.values()]
    .map((item) => item.path)
    .sort();
};

export const compileImportedSkillsRules = (params: {
  repoRoot?: string;
  sourceFiles?: ReadonlyArray<string>;
}): CompiledImportedSkillsRulesResult => {
  const repoRoot = params.repoRoot ?? process.cwd();
  const sourceFiles = resolveSkillImportSources({
    repoRoot,
    explicitSources: params.sourceFiles,
  });

  const importedRules: SkillsCompiledRule[] = [];
  const usedRuleIds = new Set<string>();

  for (const sourceFile of sourceFiles) {
    const sourceContent = readFileSync(sourceFile, 'utf8');
    const sourceSkill = toCanonicalImportedSkillName(sourceSkillNameFromPath(sourceFile));
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

  return {
    sourceFiles,
    importedRules: importedRules.sort((left, right) => left.id.localeCompare(right.id)),
  };
};

export const importCustomSkillsRules = (params: {
  repoRoot?: string;
  sourceFiles?: ReadonlyArray<string>;
}): CustomSkillsImportResult => {
  const repoRoot = params.repoRoot ?? process.cwd();
  const compiled = compileImportedSkillsRules(params);
  const outputPath = resolve(repoRoot, '.pumuki/custom-rules.json');
  mkdirSync(dirname(outputPath), { recursive: true });
  const payload = toCustomRulesFile(compiled.importedRules, compiled.sourceFiles);
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  return {
    sourceFiles: compiled.sourceFiles,
    importedRules: compiled.importedRules,
    outputPath,
  };
};
