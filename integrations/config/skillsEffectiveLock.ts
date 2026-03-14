import { createHash } from 'node:crypto';
import { isAbsolute, relative } from 'node:path';
import { loadCoreSkillsLock } from './coreSkillsLock';
import {
  canonicalImportedSkillNameFromPath,
  compileImportedSkillsRules,
  loadCustomSkillsLock,
} from './skillsCustomRules';
import {
  loadSkillsLock,
  normalizeSkillsAstNodeIds,
  type SkillsCompiledRule,
  type SkillsLockBundle,
  type SkillsLockV1,
} from './skillsLock';

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, string | number | boolean | bigint | symbol | null | Date | object>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
};

const toBundleHash = (params: {
  name: string;
  version: string;
  source: string;
  rules: ReadonlyArray<SkillsCompiledRule>;
}): string => {
  const normalized = {
    name: params.name,
    version: params.version,
    source: params.source,
    rules: [...params.rules]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((rule) => ({
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
        astNodeIds: normalizeSkillsAstNodeIds(rule.astNodeIds),
      })),
  };
  return createHash('sha256').update(stableStringify(normalized)).digest('hex');
};

const toRepoRelativeSourcePath = (params: {
  repoRoot: string;
  absolutePath: string;
}): string => {
  const rel = relative(params.repoRoot, params.absolutePath).replace(/\\/g, '/');
  if (!rel.startsWith('..') && !isAbsolute(rel)) {
    return rel;
  }
  return params.absolutePath.replace(/\\/g, '/');
};

const toImportedSkillsLock = (repoRoot: string): SkillsLockV1 | undefined => {
  const compiled = compileImportedSkillsRules({ repoRoot });
  if (compiled.sourceFiles.length === 0) {
    return undefined;
  }

  const bundleRulesByName = new Map<string, SkillsCompiledRule[]>();
  const bundleSourcePathByName = new Map<string, string>();

  for (const sourceFile of compiled.sourceFiles) {
    const bundleName = canonicalImportedSkillNameFromPath(sourceFile);
    if (!bundleRulesByName.has(bundleName)) {
      bundleRulesByName.set(bundleName, []);
    }
    if (!bundleSourcePathByName.has(bundleName)) {
      bundleSourcePathByName.set(
        bundleName,
        toRepoRelativeSourcePath({
          repoRoot,
          absolutePath: sourceFile,
        })
      );
    }
  }

  for (const rule of compiled.importedRules) {
    const current = bundleRulesByName.get(rule.sourceSkill) ?? [];
    current.push(rule);
    bundleRulesByName.set(rule.sourceSkill, current);
    if (!bundleSourcePathByName.has(rule.sourceSkill)) {
      bundleSourcePathByName.set(rule.sourceSkill, rule.sourcePath);
    }
  }

  const bundles: SkillsLockBundle[] = [...bundleRulesByName.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, rules]) => {
      const sortedRules = [...rules].sort((left, right) => left.id.localeCompare(right.id));
      const sourcePath =
        bundleSourcePathByName.get(name) ??
        sortedRules[0]?.sourcePath ??
        `docs/codex-skills/${name}.md`;
      const source = `file:${sourcePath}`;
      return {
        name,
        version: '1.0.0',
        source,
        hash: toBundleHash({
          name,
          version: '1.0.0',
          source,
          rules: sortedRules,
        }),
        rules: sortedRules,
      };
    });

  return {
    version: '1.0',
    compilerVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    bundles,
  };
};

const mergeBundles = (
  baseBundles: ReadonlyArray<SkillsLockBundle>,
  overlayBundles: ReadonlyArray<SkillsLockBundle>
): SkillsLockBundle[] => {
  const byName = new Map<string, SkillsLockBundle>();
  const order: string[] = [];

  const addBundle = (bundle: SkillsLockBundle): void => {
    const existing = byName.get(bundle.name);
    if (!existing) {
      byName.set(bundle.name, {
        ...bundle,
        rules: [...bundle.rules].sort((left, right) => left.id.localeCompare(right.id)),
      });
      order.push(bundle.name);
      return;
    }

    const byRuleId = new Map<string, SkillsCompiledRule>();
    for (const rule of existing.rules) {
      byRuleId.set(rule.id, rule);
    }
    for (const rule of bundle.rules) {
      byRuleId.set(rule.id, rule);
    }

    const rules = [...byRuleId.values()].sort((left, right) => left.id.localeCompare(right.id));
    byName.set(bundle.name, {
      ...existing,
      ...bundle,
      rules,
      hash: toBundleHash({
        name: bundle.name,
        version: bundle.version,
        source: bundle.source,
        rules,
      }),
    });
  };

  for (const bundle of baseBundles) {
    addBundle(bundle);
  }
  for (const bundle of overlayBundles) {
    addBundle(bundle);
  }

  return order
    .map((name) => byName.get(name))
    .filter((bundle): bundle is SkillsLockBundle => bundle !== undefined);
};

const mergeSkillsLocks = (
  base: SkillsLockV1,
  overlay: SkillsLockV1
): SkillsLockV1 => {
  return {
    version: '1.0',
    compilerVersion: overlay.compilerVersion || base.compilerVersion,
    generatedAt: overlay.generatedAt || base.generatedAt,
    bundles: mergeBundles(base.bundles, overlay.bundles),
  };
};

export const loadEffectiveSkillsLock = (
  repoRoot: string = process.cwd()
): SkillsLockV1 | undefined => {
  const coreDisabled = process.env.PUMUKI_DISABLE_CORE_SKILLS?.trim() === '1';
  const coreLock = coreDisabled ? undefined : loadCoreSkillsLock();
  const repoLock = loadSkillsLock(repoRoot);
  const importedLock = toImportedSkillsLock(repoRoot);
  const customLock = loadCustomSkillsLock(repoRoot);

  let effectiveLock = coreLock ?? repoLock ?? importedLock ?? customLock;
  if (!effectiveLock) {
    return undefined;
  }

  if (repoLock && coreLock) {
    effectiveLock = mergeSkillsLocks(coreLock, repoLock);
  }
  if (importedLock && effectiveLock !== importedLock) {
    effectiveLock = mergeSkillsLocks(effectiveLock, importedLock);
  }
  if (customLock && effectiveLock) {
    effectiveLock = mergeSkillsLocks(effectiveLock, customLock);
  }

  return effectiveLock;
};

export const loadRequiredSkillsLock = (
  repoRoot: string = process.cwd()
): SkillsLockV1 | undefined => {
  const repoLock = loadSkillsLock(repoRoot);
  const importedLock = toImportedSkillsLock(repoRoot);
  const customLock = loadCustomSkillsLock(repoRoot);

  let requiredLock = repoLock ?? importedLock ?? customLock;
  if (!requiredLock) {
    return undefined;
  }
  if (importedLock && requiredLock !== importedLock) {
    requiredLock = mergeSkillsLocks(requiredLock, importedLock);
  }
  if (customLock && requiredLock !== customLock) {
    requiredLock = mergeSkillsLocks(requiredLock, customLock);
  }
  return requiredLock;
};
