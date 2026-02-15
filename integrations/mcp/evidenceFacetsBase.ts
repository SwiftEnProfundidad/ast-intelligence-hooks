import type { AiEvidenceV2_1 } from '../evidence/schema';
export const sortRulesets = (rulesets: AiEvidenceV2_1['rulesets']): AiEvidenceV2_1['rulesets'] => {
  return [...rulesets].sort((left, right) => {
    const byPlatform = left.platform.localeCompare(right.platform);
    if (byPlatform !== 0) {
      return byPlatform;
    }
    const byBundle = left.bundle.localeCompare(right.bundle);
    if (byBundle !== 0) {
      return byBundle;
    }
    return left.hash.localeCompare(right.hash);
  });
};

export const sortPlatforms = (platforms: AiEvidenceV2_1['platforms']) => {
  return Object.entries(platforms)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([platform, state]) => ({
      platform,
      detected: state.detected,
      confidence: state.confidence,
    }));
};

export const severityOrder = ['CRITICAL', 'ERROR', 'WARN', 'INFO'] as const;
export const severityRank: Record<string, number> = {
  CRITICAL: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
};

export const toSeverityCounts = (
  findings: AiEvidenceV2_1['snapshot']['findings']
): Record<string, number> => {
  const counts = new Map<string, number>();
  for (const finding of findings) {
    const key = finding.severity.toUpperCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const orderedEntries = [...counts.entries()].sort(([left], [right]) => {
    const leftIndex = severityOrder.indexOf(left as (typeof severityOrder)[number]);
    const rightIndex = severityOrder.indexOf(right as (typeof severityOrder)[number]);
    const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
    if (normalizedLeft !== normalizedRight) {
      return normalizedLeft - normalizedRight;
    }
    return left.localeCompare(right);
  });

  return Object.fromEntries(orderedEntries);
};

export const toRulesetsByPlatform = (rulesets: AiEvidenceV2_1['rulesets']): Record<string, number> => {
  const counts = new Map<string, number>();
  for (const ruleset of rulesets) {
    counts.set(ruleset.platform, (counts.get(ruleset.platform) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
};

export const toRulesetsFingerprint = (rulesets: AiEvidenceV2_1['rulesets']): string => {
  return sortRulesets(rulesets)
    .map((ruleset) => ruleset.hash)
    .join('|');
};

export const toRulesetsBundlesCount = (rulesets: AiEvidenceV2_1['rulesets']): number => {
  const bundles = new Set<string>();
  for (const ruleset of rulesets) {
    bundles.add(ruleset.bundle);
  }
  return bundles.size;
};

export const toRulesetsPlatformsCount = (rulesets: AiEvidenceV2_1['rulesets']): number => {
  const platforms = new Set<string>();
  for (const ruleset of rulesets) {
    platforms.add(ruleset.platform);
  }
  return platforms.size;
};

export const toRulesetsHashesCount = (rulesets: AiEvidenceV2_1['rulesets']): number => {
  const hashes = new Set<string>();
  for (const ruleset of rulesets) {
    hashes.add(ruleset.hash);
  }
  return hashes.size;
};

