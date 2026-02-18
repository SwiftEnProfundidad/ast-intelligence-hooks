import type { AiEvidenceV2_1 } from '../evidence/schema';

export const sortPlatforms = (platforms: AiEvidenceV2_1['platforms']) => {
  return Object.entries(platforms)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([platform, state]) => ({
      platform,
      detected: state.detected,
      confidence: state.confidence,
    }));
};

export const toPlatformConfidenceCounts = (
  platforms: AiEvidenceV2_1['platforms']
): Record<string, number> => {
  const counts = new Map<string, number>();
  for (const entry of Object.values(platforms)) {
    counts.set(entry.confidence, (counts.get(entry.confidence) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
};
