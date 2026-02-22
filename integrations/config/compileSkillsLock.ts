import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createSkillsLockDeterministicHash,
  loadSkillsLock,
  parseSkillsLock,
  type SkillsCompiledRule,
  type SkillsLockBundle,
  type SkillsLockV1,
} from './skillsLock';
import {
  SKILLS_LOCK_COMPILER_VERSION,
  skillsCompilerTemplates,
  type SkillsRuleTemplate,
} from './skillsCompilerTemplates';
import { loadSkillsSources, type SkillsSourceBundleV1 } from './skillsSources';
import { extractCompiledRulesFromSkillMarkdown } from './skillsMarkdownRules';

const DEFAULT_MANIFEST_FILE = 'skills.sources.json';
const DEFAULT_OUTPUT_FILE = 'skills.lock.json';

export type CompileSkillsLockParams = {
  repoRoot?: string;
  manifestFile?: string;
  generatedAt?: string;
};

export type WriteSkillsLockParams = {
  repoRoot?: string;
  outputFile?: string;
};

export type SkillsLockCheckResult = {
  status: 'fresh' | 'stale' | 'missing' | 'invalid';
  details: string;
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
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

const toCompiledRule = (
  rule: SkillsRuleTemplate,
  sourceBundle: SkillsSourceBundleV1
): SkillsCompiledRule => {
  return {
    ...rule,
    sourceSkill: sourceBundle.name,
    sourcePath: sourceBundle.sourcePath,
    evaluationMode: rule.evaluationMode ?? 'AUTO',
    origin: rule.origin ?? 'core',
  };
};

const buildBundleHash = (params: {
  sourceBundle: SkillsSourceBundleV1;
  sourceContent: string;
  compiledRules: ReadonlyArray<SkillsCompiledRule>;
}): string => {
  const normalized = {
    name: params.sourceBundle.name,
    version: params.sourceBundle.version,
    template: params.sourceBundle.template,
    sourcePath: params.sourceBundle.sourcePath,
    sourceContentSha256: createHash('sha256').update(params.sourceContent).digest('hex'),
    rules: [...params.compiledRules].sort((left, right) => left.id.localeCompare(right.id)),
  };

  return createHash('sha256').update(stableStringify(normalized)).digest('hex');
};

const compileBundle = (
  sourceBundle: SkillsSourceBundleV1,
  repoRoot: string
): SkillsLockBundle => {
  const template = skillsCompilerTemplates[sourceBundle.template];
  if (!template) {
    throw new Error(
      `Unknown skills template \"${sourceBundle.template}\" for bundle \"${sourceBundle.name}\".`
    );
  }

  const sourceFilePath = resolve(repoRoot, sourceBundle.sourcePath);
  if (!existsSync(sourceFilePath)) {
    throw new Error(
      `Skills source file not found for bundle \"${sourceBundle.name}\": ${sourceBundle.sourcePath}`
    );
  }

  const sourceContent = readFileSync(sourceFilePath, 'utf8');
  const templateRules = template.rules.map((rule) => toCompiledRule(rule, sourceBundle));
  const markdownRules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: sourceBundle.name,
    sourcePath: sourceBundle.sourcePath,
    sourceContent,
    existingRuleIds: templateRules.map((rule) => rule.id),
    origin: 'core',
  });

  const byId = new Map<string, SkillsCompiledRule>();
  for (const markdownRule of markdownRules) {
    byId.set(markdownRule.id, markdownRule);
  }
  for (const templateRule of templateRules) {
    byId.set(templateRule.id, templateRule);
  }

  const compiledRules = [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));

  const hash = buildBundleHash({
    sourceBundle,
    sourceContent,
    compiledRules,
  });

  return {
    name: sourceBundle.name,
    version: sourceBundle.version,
    source: sourceBundle.source ?? `file:${sourceBundle.sourcePath}`,
    hash,
    rules: compiledRules,
  };
};

export const compileSkillsLock = (params: CompileSkillsLockParams = {}): SkillsLockV1 => {
  const repoRoot = params.repoRoot ?? process.cwd();
  const manifestFile = params.manifestFile ?? DEFAULT_MANIFEST_FILE;
  const sources = loadSkillsSources(repoRoot, manifestFile);

  if (!sources) {
    throw new Error(
      `Skills sources manifest not found or invalid: ${resolve(repoRoot, manifestFile)}`
    );
  }

  const activeBundles = sources.bundles
    .filter((bundle) => bundle.enabled !== false)
    .map((bundle) => compileBundle(bundle, repoRoot))
    .sort((left, right) => {
      const byName = left.name.localeCompare(right.name);
      if (byName !== 0) {
        return byName;
      }
      return left.version.localeCompare(right.version);
    });

  return {
    version: '1.0',
    compilerVersion: SKILLS_LOCK_COMPILER_VERSION,
    generatedAt: params.generatedAt ?? new Date().toISOString(),
    bundles: activeBundles,
  };
};

export const writeSkillsLock = (
  lock: SkillsLockV1,
  params: WriteSkillsLockParams = {}
): string => {
  const repoRoot = params.repoRoot ?? process.cwd();
  const outputFile = params.outputFile ?? DEFAULT_OUTPUT_FILE;
  const outputPath = resolve(repoRoot, outputFile);
  writeFileSync(outputPath, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
  return outputPath;
};

export const checkSkillsLockStatus = (
  params: {
    repoRoot?: string;
    manifestFile?: string;
    lockFile?: string;
  } = {}
): SkillsLockCheckResult => {
  const repoRoot = params.repoRoot ?? process.cwd();
  const lockFile = params.lockFile ?? DEFAULT_OUTPUT_FILE;
  const lockPath = resolve(repoRoot, lockFile);

  const existingLock =
    lockFile === DEFAULT_OUTPUT_FILE
      ? loadSkillsLock(repoRoot)
      : (() => {
          if (!existsSync(lockPath)) {
            return undefined;
          }
          try {
            const parsed: unknown = JSON.parse(readFileSync(lockPath, 'utf8'));
            return parseSkillsLock(parsed);
          } catch {
            return undefined;
          }
        })();

  if (!existsSync(lockPath)) {
    return {
      status: 'missing',
      details: `${lockFile} is missing. Run skills lock compilation.`,
    };
  }

  if (!existingLock || existingLock.version !== '1.0') {
    return {
      status: 'invalid',
      details: `${lockFile} is invalid for SkillsLockV1.`,
    };
  }

  try {
    const compiled = compileSkillsLock({
      repoRoot,
      manifestFile: params.manifestFile,
      generatedAt: existingLock.generatedAt,
    });
    const existingHash = createSkillsLockDeterministicHash(existingLock);
    const compiledHash = createSkillsLockDeterministicHash(compiled);

    if (existingHash === compiledHash) {
      return {
        status: 'fresh',
        details: `${lockFile} is fresh.`,
      };
    }

    return {
      status: 'stale',
      details: `${lockFile} is stale. Re-run skills lock compilation.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown compilation error.';
    return {
      status: 'invalid',
      details: message,
    };
  }
};
