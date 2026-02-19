import type { AiEvidenceV2_1 } from '../evidence/schema';
import { inferPlatformFromFilePath } from './evidenceFacetsSuppressed';

export const toLedgerByPlatform = (ledger: AiEvidenceV2_1['ledger']): Record<string, number> => {
  const counts = new Map<string, number>();
  for (const entry of ledger) {
    const platform = inferPlatformFromFilePath(entry.file);
    counts.set(platform, (counts.get(platform) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
};

export const toLedgerFilesCount = (ledger: AiEvidenceV2_1['ledger']): number => {
  const files = new Set<string>();
  for (const entry of ledger) {
    files.add(entry.file);
  }
  return files.size;
};

export const toLedgerRulesCount = (ledger: AiEvidenceV2_1['ledger']): number => {
  const rules = new Set<string>();
  for (const entry of ledger) {
    rules.add(entry.ruleId);
  }
  return rules.size;
};
