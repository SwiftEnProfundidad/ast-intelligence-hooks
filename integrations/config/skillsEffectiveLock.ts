import { createHash } from 'node:crypto';
import { loadCoreSkillsLock } from './coreSkillsLock';
import { loadCustomSkillsLock } from './skillsCustomRules';
import {
  loadSkillsLock,
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
      })),
  };
  return createHash('sha256').update(stableStringify(normalized)).digest('hex');
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
  const customLock = loadCustomSkillsLock(repoRoot);

  let effectiveLock = coreLock ?? repoLock;
  if (!effectiveLock) {
    return undefined;
  }

  if (repoLock && coreLock) {
    effectiveLock = mergeSkillsLocks(coreLock, repoLock);
  }
  if (customLock && effectiveLock) {
    effectiveLock = mergeSkillsLocks(effectiveLock, customLock);
  }

  return effectiveLock;
};
