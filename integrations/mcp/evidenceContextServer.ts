import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AiEvidenceV2_1 } from '../evidence/schema';

export type EvidenceServerOptions = {
  host?: string;
  port?: number;
  route?: string;
  repoRoot?: string;
};

const DEFAULT_ROUTE = '/ai-evidence';
const MAX_FINDINGS_LIMIT = 100;
const MAX_RULESETS_LIMIT = 100;
const MAX_PLATFORMS_LIMIT = 100;
const MAX_LEDGER_LIMIT = 100;

const json = (value: unknown): string => JSON.stringify(value);
const truthyQueryValues = new Set(['1', 'true', 'yes', 'on']);
const falsyQueryValues = new Set(['0', 'false', 'no', 'off']);

const CONTEXT_API_CAPABILITIES = {
  endpoints: [
    '/health',
    '/status',
    '/ai-evidence',
    '/ai-evidence/summary',
    '/ai-evidence/snapshot',
    '/ai-evidence/findings',
    '/ai-evidence/rulesets',
    '/ai-evidence/platforms',
    '/ai-evidence/ledger',
  ],
  filters: {
    findings: ['severity', 'ruleId', 'platform', 'limit', 'offset', 'maxLimit'],
    rulesets: ['platform', 'bundle', 'limit', 'offset', 'maxLimit'],
    platforms: ['detectedOnly', 'confidence', 'limit', 'offset', 'maxLimit'],
    ledger: ['lastSeenAfter', 'lastSeenBefore', 'limit', 'offset', 'maxLimit'],
  },
  pagination_bounds: {
    findings: { max_limit: MAX_FINDINGS_LIMIT },
    rulesets: { max_limit: MAX_RULESETS_LIMIT },
    platforms: { max_limit: MAX_PLATFORMS_LIMIT },
    ledger: { max_limit: MAX_LEDGER_LIMIT },
  },
} as const;

type EvidenceReadResult =
  | { kind: 'missing' }
  | { kind: 'invalid'; version?: string }
  | { kind: 'valid'; evidence: AiEvidenceV2_1 };

const readEvidenceResult = (repoRoot: string): EvidenceReadResult => {
  const evidencePath = resolve(repoRoot, '.ai_evidence.json');
  if (!existsSync(evidencePath)) {
    return { kind: 'missing' };
  }

  try {
    const parsed: unknown = JSON.parse(readFileSync(evidencePath, 'utf8'));
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'version' in parsed &&
      (parsed as { version?: unknown }).version === '2.1'
    ) {
      return {
        kind: 'valid',
        evidence: parsed as AiEvidenceV2_1,
      };
    }
    const versionCandidate =
      typeof parsed === 'object' && parsed !== null && 'version' in parsed
        ? (parsed as { version?: unknown }).version
        : undefined;
    return {
      kind: 'invalid',
      version: typeof versionCandidate === 'string' ? versionCandidate : undefined,
    };
  } catch {
    return {
      kind: 'invalid',
    };
  }
};

const readEvidence = (repoRoot: string): AiEvidenceV2_1 | undefined => {
  const result = readEvidenceResult(repoRoot);
  return result.kind === 'valid' ? result.evidence : undefined;
};

const parseBooleanQuery = (value: string | null): boolean | undefined => {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (truthyQueryValues.has(normalized)) {
    return true;
  }
  if (falsyQueryValues.has(normalized)) {
    return false;
  }
  return undefined;
};

const parseNonNegativeIntQuery = (value: string | null): number | undefined => {
  if (!value) {
    return undefined;
  }
  if (!/^\d+$/.test(value.trim())) {
    return undefined;
  }
  return Number.parseInt(value.trim(), 10);
};

const includeSuppressedFromQuery = (requestUrl: URL): boolean => {
  const view = requestUrl.searchParams.get('view')?.trim().toLowerCase();
  if (view === 'compact') {
    return false;
  }
  if (view === 'full') {
    return true;
  }

  const parsed = parseBooleanQuery(requestUrl.searchParams.get('includeSuppressed'));
  return parsed ?? true;
};

const normalizeRoute = (route: string): string => {
  if (!route.startsWith('/')) {
    return `/${route}`;
  }
  if (route.length > 1 && route.endsWith('/')) {
    return route.slice(0, -1);
  }
  return route;
};

const sortRulesets = (rulesets: AiEvidenceV2_1['rulesets']): AiEvidenceV2_1['rulesets'] => {
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

const sortPlatforms = (platforms: AiEvidenceV2_1['platforms']) => {
  return Object.entries(platforms)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([platform, state]) => ({
      platform,
      detected: state.detected,
      confidence: state.confidence,
    }));
};

const severityOrder = ['CRITICAL', 'ERROR', 'WARN', 'INFO'] as const;
const severityRank: Record<string, number> = {
  CRITICAL: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
};

const toSeverityCounts = (
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

const toRulesetsByPlatform = (rulesets: AiEvidenceV2_1['rulesets']): Record<string, number> => {
  const counts = new Map<string, number>();
  for (const ruleset of rulesets) {
    counts.set(ruleset.platform, (counts.get(ruleset.platform) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
};

const toRulesetsFingerprint = (rulesets: AiEvidenceV2_1['rulesets']): string => {
  return sortRulesets(rulesets)
    .map((ruleset) => ruleset.hash)
    .join('|');
};

const toRulesetsBundlesCount = (rulesets: AiEvidenceV2_1['rulesets']): number => {
  const bundles = new Set<string>();
  for (const ruleset of rulesets) {
    bundles.add(ruleset.bundle);
  }
  return bundles.size;
};

const toRulesetsPlatformsCount = (rulesets: AiEvidenceV2_1['rulesets']): number => {
  const platforms = new Set<string>();
  for (const ruleset of rulesets) {
    platforms.add(ruleset.platform);
  }
  return platforms.size;
};

const toRulesetsHashesCount = (rulesets: AiEvidenceV2_1['rulesets']): number => {
  const hashes = new Set<string>();
  for (const ruleset of rulesets) {
    hashes.add(ruleset.hash);
  }
  return hashes.size;
};

const toSuppressedReplacementRulesCount = (evidence: AiEvidenceV2_1): number => {
  const replacements = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    replacements.add(entry.replacedByRuleId);
  }
  return replacements.size;
};

const toSuppressedReplacementRulesRatioPct = (evidence: AiEvidenceV2_1): number => {
  const replacementRules = toSuppressedReplacementRulesCount(evidence);
  const suppressedRules = toSuppressedRulesCount(evidence);
  if (suppressedRules === 0) {
    return 0;
  }
  return Math.round((replacementRules / suppressedRules) * 100);
};

const toSuppressedNonReplacementRulesCount = (evidence: AiEvidenceV2_1): number => {
  const rules = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      rules.add(entry.ruleId);
    }
  }
  return rules.size;
};

const toSuppressedNonReplacementRulesRatioPct = (evidence: AiEvidenceV2_1): number => {
  const nonReplacementRules = toSuppressedNonReplacementRulesCount(evidence);
  const suppressedRules = toSuppressedRulesCount(evidence);
  if (suppressedRules === 0) {
    return 0;
  }
  return Math.round((nonReplacementRules / suppressedRules) * 100);
};

const toSuppressedPlatformsCount = (evidence: AiEvidenceV2_1): number => {
  const platforms = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    platforms.add(inferPlatformFromFilePath(entry.file));
  }
  return platforms.size;
};

const toSuppressedFilesCount = (evidence: AiEvidenceV2_1): number => {
  const files = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    files.add(entry.file);
  }
  return files.size;
};

const toSuppressedRulesCount = (evidence: AiEvidenceV2_1): number => {
  const rules = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    rules.add(entry.ruleId);
  }
  return rules.size;
};

const toSuppressedReasonsCount = (evidence: AiEvidenceV2_1): number => {
  const reasons = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    reasons.add(entry.reason);
  }
  return reasons.size;
};

const toSuppressedWithReplacementCount = (evidence: AiEvidenceV2_1): number => {
  let count = 0;
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      count += 1;
    }
  }
  return count;
};

const toSuppressedWithReplacementFilesCount = (evidence: AiEvidenceV2_1): number => {
  const files = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null || entry.replacedByRuleId.length > 0) {
      files.add(entry.file);
    }
  }
  return files.size;
};

const toSuppressedWithReplacementPlatformsCount = (evidence: AiEvidenceV2_1): number => {
  const platforms = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null || entry.replacedByRuleId.length > 0) {
      platforms.add(entry.platform);
    }
  }
  return platforms.size;
};

const toSuppressedWithoutReplacementFilesCount = (evidence: AiEvidenceV2_1): number => {
  const files = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null && entry.replacedByRuleId.length === 0) {
      files.add(entry.file);
    }
  }
  return files.size;
};

const toSuppressedNonReplacementFilesCount = (evidence: AiEvidenceV2_1): number => {
  const files = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      files.add(entry.file);
    }
  }
  return files.size;
};

const toSuppressedWithReplacementFilesRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalFiles = toSuppressedFilesCount(evidence);
  if (totalFiles === 0) {
    return 0;
  }
  return Math.round((toSuppressedWithReplacementFilesCount(evidence) / totalFiles) * 100);
};

const toSuppressedReplacementFilesRatioPct = (evidence: AiEvidenceV2_1): number =>
  toSuppressedWithReplacementFilesRatioPct(evidence);

const toSuppressedWithoutReplacementFilesRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalFiles = toSuppressedFilesCount(evidence);
  if (totalFiles === 0) {
    return 0;
  }
  return Math.round((toSuppressedWithoutReplacementFilesCount(evidence) / totalFiles) * 100);
};

const toSuppressedNonReplacementFilesRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalFiles = toSuppressedFilesCount(evidence);
  if (totalFiles === 0) {
    return 0;
  }
  return Math.round((toSuppressedNonReplacementFilesCount(evidence) / totalFiles) * 100);
};

const toSuppressedWithReplacementPlatformsRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalPlatforms = toSuppressedPlatformsCount(evidence);
  if (totalPlatforms === 0) {
    return 0;
  }
  return Math.round((toSuppressedWithReplacementPlatformsCount(evidence) / totalPlatforms) * 100);
};

const toSuppressedWithoutReplacementPlatformsRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalPlatforms = toSuppressedPlatformsCount(evidence);
  if (totalPlatforms === 0) {
    return 0;
  }
  return Math.round((toSuppressedWithoutReplacementPlatformsCount(evidence) / totalPlatforms) * 100);
};

const toSuppressedNonReplacementPlatformsRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalPlatforms = toSuppressedPlatformsCount(evidence);
  if (totalPlatforms === 0) {
    return 0;
  }
  return Math.round((toSuppressedNonReplacementPlatformsCount(evidence) / totalPlatforms) * 100);
};

const toSuppressedReplacementPlatformsRatioPct = (evidence: AiEvidenceV2_1): number => {
  const totalPlatforms = toSuppressedPlatformsCount(evidence);
  if (totalPlatforms === 0) {
    return 0;
  }
  return Math.round((toSuppressedReplacementPlatformsCount(evidence) / totalPlatforms) * 100);
};

const toSuppressedWithReplacementRatioPct = (evidence: AiEvidenceV2_1): number => {
  const total = evidence.consolidation?.suppressed?.length ?? 0;
  if (total === 0) {
    return 0;
  }
  return Math.round((toSuppressedWithReplacementCount(evidence) / total) * 100);
};

const toSuppressedFindingCoverageRatioPct = (evidence: AiEvidenceV2_1): number => {
  const suppressedFindingsCount = evidence.consolidation?.suppressed?.length ?? 0;
  const findingUniverseSize =
    suppressedFindingsCount + evidence.snapshot.findings.length;
  if (findingUniverseSize === 0) {
    return 0;
  }
  return Math.round((suppressedFindingsCount / findingUniverseSize) * 100);
};

const toSuppressedNonReplacementRatioPct = (evidence: AiEvidenceV2_1): number => {
  const total = evidence.consolidation?.suppressed?.length ?? 0;
  if (total === 0) {
    return 0;
  }
  return Math.round((toSuppressedWithoutReplacementCount(evidence) / total) * 100);
};

const toSuppressedWithoutReplacementRatioPct = (evidence: AiEvidenceV2_1): number => {
  const total = evidence.consolidation?.suppressed?.length ?? 0;
  if (total === 0) {
    return 0;
  }
  return Math.round((toSuppressedWithoutReplacementCount(evidence) / total) * 100);
};

const toSuppressedReasonsCoverageRatioPct = (evidence: AiEvidenceV2_1): number => {
  const suppressedFindingsCount = evidence.consolidation?.suppressed?.length ?? 0;
  const reasonsCount = toSuppressedReasonsCount(evidence);
  if (suppressedFindingsCount === 0) {
    return 0;
  }
  return Math.round((reasonsCount / suppressedFindingsCount) * 100);
};

const toSuppressedWithoutReplacementCount = (evidence: AiEvidenceV2_1): number => {
  let count = 0;
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      count += 1;
    }
  }
  return count;
};

const toSuppressedRuleFilePairsCount = (evidence: AiEvidenceV2_1): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    pairs.add(`${entry.ruleId}:${entry.file}`);
  }
  return pairs.size;
};

const toSuppressedReasonsWithReplacementCount = (evidence: AiEvidenceV2_1): number => {
  const reasons = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      reasons.add(entry.reason);
    }
  }
  return reasons.size;
};

const toSuppressedReasonsWithReplacementRatioPct = (evidence: AiEvidenceV2_1): number => {
  const reasonsWithReplacement = toSuppressedReasonsWithReplacementCount(evidence);
  const reasonsCount = toSuppressedReasonsCount(evidence);
  if (reasonsCount === 0) {
    return 0;
  }
  return Math.round((reasonsWithReplacement / reasonsCount) * 100);
};

const toSuppressedReasonsWithoutReplacementRatioPct = (evidence: AiEvidenceV2_1): number => {
  const reasonsWithoutReplacement = toSuppressedReasonsWithoutReplacementCount(evidence);
  const reasonsCount = toSuppressedReasonsCount(evidence);
  if (reasonsCount === 0) {
    return 0;
  }
  return Math.round((reasonsWithoutReplacement / reasonsCount) * 100);
};

const toSuppressedReasonsWithoutReplacementCount = (evidence: AiEvidenceV2_1): number => {
  const reasons = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      reasons.add(entry.reason);
    }
  }
  return reasons.size;
};

const toSuppressedPlatformRulePairsCount = (evidence: AiEvidenceV2_1): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    pairs.add(`${entry.platform}:${entry.ruleId}`);
  }
  return pairs.size;
};

const toSuppressedPlatformFilePairsCount = (evidence: AiEvidenceV2_1): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    pairs.add(`${entry.platform}:${entry.file}`);
  }
  return pairs.size;
};

const toSuppressedReplacementRuleFilePairsCount = (evidence: AiEvidenceV2_1): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      pairs.add(`${entry.replacementRuleId}:${entry.file}`);
    }
  }
  return pairs.size;
};

const toSuppressedReplacementRulePlatformPairsCount = (evidence: AiEvidenceV2_1): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      pairs.add(`${entry.replacementRuleId}:${entry.platform}`);
    }
  }
  return pairs.size;
};

const toSuppressedReplacementPlatformsCount = (evidence: AiEvidenceV2_1): number => {
  const platforms = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      platforms.add(entry.platform);
    }
  }
  return platforms.size;
};

const toSuppressedNonReplacementPlatformsCount = (evidence: AiEvidenceV2_1): number => {
  const platforms = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      platforms.add(entry.platform);
    }
  }
  return platforms.size;
};

const toSuppressedWithoutReplacementPlatformsCount = (evidence: AiEvidenceV2_1): number => {
  const platforms = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null && entry.replacedByRuleId.length === 0) {
      platforms.add(entry.platform);
    }
  }
  return platforms.size;
};

const toSuppressedNonReplacementReasonFilePairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      pairs.add(`${entry.reason}:${entry.file}`);
    }
  }
  return pairs.size;
};

const toSuppressedNonReplacementRuleFilePairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      pairs.add(`${entry.ruleId}:${entry.file}`);
    }
  }
  return pairs.size;
};

const toSuppressedNonReplacementRuleFilePairsRatioPct = (
  evidence: AiEvidenceV2_1,
): number => {
  const nonReplacementRuleFilePairs = toSuppressedNonReplacementRuleFilePairsCount(evidence);
  const totalRuleFilePairs = toSuppressedRuleFilePairsCount(evidence);
  if (totalRuleFilePairs === 0) {
    return 0;
  }
  return Math.round((nonReplacementRuleFilePairs / totalRuleFilePairs) * 100);
};

const toSuppressedNonReplacementRulePlatformPairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      pairs.add(`${entry.ruleId}:${entry.platform}`);
    }
  }
  return pairs.size;
};

const toSuppressedNonReplacementReasonsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const reasons = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      reasons.add(entry.reason);
    }
  }
  return reasons.size;
};

const toSuppressedReplacementReasonFilePairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      pairs.add(`${entry.reason}:${entry.file}`);
    }
  }
  return pairs.size;
};

const toSuppressedReplacementRuleReasonPairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      pairs.add(`${entry.replacementRuleId}:${entry.reason}`);
    }
  }
  return pairs.size;
};

const toSuppressedReplacementRuleIdsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const ruleIds = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      ruleIds.add(entry.replacementRuleId);
    }
  }
  return ruleIds.size;
};

const toSuppressedReplacementReasonsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const reasons = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      reasons.add(entry.reason);
    }
  }
  return reasons.size;
};

const toSuppressedReplacementRuleFilePlatformTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      triples.add(`${entry.replacementRuleId}:${entry.file}:${entry.platform}`);
    }
  }
  return triples.size;
};

const toSuppressedNonReplacementRuleFilePlatformTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      triples.add(`${entry.ruleId}:${entry.file}:${entry.platform}`);
    }
  }
  return triples.size;
};

const toSuppressedReasonRuleFileTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    triples.add(`${entry.reason}:${entry.ruleId}:${entry.file}`);
  }
  return triples.size;
};

const toSuppressedReasonRulePlatformTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    triples.add(`${entry.reason}:${entry.ruleId}:${entry.platform}`);
  }
  return triples.size;
};

const toSuppressedReasonFilePlatformTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    triples.add(`${entry.reason}:${entry.file}:${entry.platform}`);
  }
  return triples.size;
};

const toSuppressedReasonPlatformPairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    pairs.add(`${entry.reason}:${entry.platform}`);
  }
  return pairs.size;
};

const toSuppressedReasonFilePairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    pairs.add(`${entry.reason}:${entry.file}`);
  }
  return pairs.size;
};

const toSuppressedReplacementReasonPlatformPairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      pairs.add(`${entry.reason}:${entry.platform}`);
    }
  }
  return pairs.size;
};

const toSuppressedNonReplacementReasonPlatformPairsCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const pairs = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      pairs.add(`${entry.reason}:${entry.platform}`);
    }
  }
  return pairs.size;
};

const toSuppressedReplacementReasonRuleFileTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      triples.add(`${entry.reason}:${entry.ruleId}:${entry.file}`);
    }
  }
  return triples.size;
};

const toSuppressedNonReplacementReasonRuleFileTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      triples.add(`${entry.reason}:${entry.ruleId}:${entry.file}`);
    }
  }
  return triples.size;
};

const toSuppressedReplacementReasonRulePlatformTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      triples.add(`${entry.reason}:${entry.ruleId}:${entry.platform}`);
    }
  }
  return triples.size;
};

const toSuppressedNonReplacementReasonRulePlatformTriplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      triples.add(`${entry.reason}:${entry.ruleId}:${entry.platform}`);
    }
  }
  return triples.size;
};

const toSuppressedReasonRuleFilePlatformQuadruplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const quadruples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    quadruples.add(`${entry.reason}:${entry.ruleId}:${entry.file}:${entry.platform}`);
  }
  return quadruples.size;
};

const toSuppressedReplacementReasonRuleFilePlatformQuadruplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const quadruples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      quadruples.add(`${entry.reason}:${entry.ruleId}:${entry.file}:${entry.platform}`);
    }
  }
  return quadruples.size;
};

const toSuppressedNonReplacementReasonRuleFilePlatformQuadruplesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const quadruples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      quadruples.add(`${entry.reason}:${entry.ruleId}:${entry.file}:${entry.platform}`);
    }
  }
  return quadruples.size;
};

const toSuppressedReasonRuleFilePlatformReplacementSplitCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const splits = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    const replacementBucket = entry.replacementRuleId === null ? 'non_replacement' : 'replacement';
    splits.add(`${entry.reason}:${entry.ruleId}:${entry.file}:${entry.platform}:${replacementBucket}`);
  }
  return splits.size;
};

const toSuppressedReplacementSplitModesCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const modes = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    modes.add(entry.replacementRuleId === null ? 'non_replacement' : 'replacement');
  }
  return modes.size;
};

const toSuppressedReplacementSplitModeReplacementCount = (
  evidence: AiEvidenceV2_1,
): number => {
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId !== null) {
      return 1;
    }
  }
  return 0;
};

const toSuppressedReplacementSplitModeNonReplacementCount = (
  evidence: AiEvidenceV2_1,
): number => {
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    if (entry.replacementRuleId === null) {
      return 1;
    }
  }
  return 0;
};

const toSuppressedReasonRuleFilePlatformReplacementDualModeCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const modesByKey = new Map<string, Set<string>>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    const key = `${entry.reason}:${entry.ruleId}:${entry.file}:${entry.platform}`;
    const mode = entry.replacementRuleId === null ? 'non_replacement' : 'replacement';
    const modes = modesByKey.get(key) ?? new Set<string>();
    modes.add(mode);
    modesByKey.set(key, modes);
  }

  let count = 0;
  for (const modes of modesByKey.values()) {
    if (modes.size > 1) {
      count += 1;
    }
  }
  return count;
};

const toSuppressedReplacementRuleFilePlatformDistinctCount = (
  evidence: AiEvidenceV2_1,
): number => {
  return toSuppressedReplacementRuleFilePlatformTriplesCount(evidence);
};

const toSuppressedNonReplacementRuleFilePlatformDistinctCount = (
  evidence: AiEvidenceV2_1,
): number => {
  return toSuppressedNonReplacementRuleFilePlatformTriplesCount(evidence);
};

const toSuppressedRuleFilePlatformDistinctTotalCount = (
  evidence: AiEvidenceV2_1,
): number => {
  const triples = new Set<string>();
  for (const entry of evidence.consolidation?.suppressed ?? []) {
    triples.add(`${entry.ruleId}:${entry.file}:${entry.platform}`);
  }
  return triples.size;
};

const toSuppressedReplacementRuleFilePlatformShareOfTotalPct = (
  evidence: AiEvidenceV2_1,
): number => {
  const replacement = toSuppressedReplacementRuleFilePlatformDistinctCount(evidence);
  const total = toSuppressedRuleFilePlatformDistinctTotalCount(evidence);
  if (total === 0) {
    return 0;
  }
  return Number(((replacement / total) * 100).toFixed(2));
};

const toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct = (
  evidence: AiEvidenceV2_1,
): number => {
  const nonReplacement =
    toSuppressedNonReplacementRuleFilePlatformDistinctCount(evidence);
  const total = toSuppressedRuleFilePlatformDistinctTotalCount(evidence);
  if (total === 0) {
    return 0;
  }
  return Number(((nonReplacement / total) * 100).toFixed(2));
};

const toSuppressedReplacementVsNonReplacementShareGapPct = (
  evidence: AiEvidenceV2_1,
): number => {
  const replacement = toSuppressedReplacementRuleFilePlatformShareOfTotalPct(evidence);
  const nonReplacement =
    toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct(evidence);
  return Number(Math.abs(replacement - nonReplacement).toFixed(2));
};

const toSuppressedReplacementRuleFilePlatformDominancePct = (
  evidence: AiEvidenceV2_1,
): number => {
  const replacement = toSuppressedReplacementRuleFilePlatformShareOfTotalPct(evidence);
  const nonReplacement =
    toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct(evidence);
  return Number(Math.max(replacement, nonReplacement).toFixed(2));
};

const toSuppressedReplacementMinusNonReplacementShareSignedPct = (
  evidence: AiEvidenceV2_1,
): number => {
  const replacement = toSuppressedReplacementRuleFilePlatformShareOfTotalPct(evidence);
  const nonReplacement =
    toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct(evidence);
  return Number((replacement - nonReplacement).toFixed(2));
};

const toSuppressedNonReplacementRuleFilePlatformDominancePct = (
  evidence: AiEvidenceV2_1,
): number => {
  const replacement = toSuppressedReplacementRuleFilePlatformShareOfTotalPct(evidence);
  const nonReplacement =
    toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct(evidence);
  return Number(Math.max(nonReplacement - replacement, 0).toFixed(2));
};

const toSuppressedSharePolarizationIndexPct = (evidence: AiEvidenceV2_1): number => {
  const replacement = toSuppressedReplacementRuleFilePlatformShareOfTotalPct(evidence);
  const nonReplacement =
    toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct(evidence);
  return Number(Math.abs(replacement - nonReplacement).toFixed(2));
};

const toSuppressedShareBalanceScorePct = (evidence: AiEvidenceV2_1): number => {
  const polarization = toSuppressedSharePolarizationIndexPct(evidence);
  return Number(Math.max(100 - polarization, 0).toFixed(2));
};

const toSuppressedShareImbalanceIndexPct = (evidence: AiEvidenceV2_1): number => {
  return toSuppressedSharePolarizationIndexPct(evidence);
};

const toSuppressedSharePolarizationBalanceGapPct = (
  evidence: AiEvidenceV2_1,
): number => {
  const polarization = toSuppressedSharePolarizationIndexPct(evidence);
  const balance = toSuppressedShareBalanceScorePct(evidence);
  return Number(Math.abs(polarization - balance).toFixed(2));
};

const toSuppressedShareNetPolarityPct = (evidence: AiEvidenceV2_1): number => {
  const replacement = toSuppressedReplacementRuleFilePlatformShareOfTotalPct(evidence);
  const nonReplacement =
    toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct(evidence);
  return Number((replacement - nonReplacement).toFixed(2));
};

const toSuppressedShareDirection = (
  evidence: AiEvidenceV2_1,
): 'replacement' | 'non_replacement' | 'balanced' => {
  const netPolarity = toSuppressedShareNetPolarityPct(evidence);
  if (netPolarity > 0) {
    return 'replacement';
  }
  if (netPolarity < 0) {
    return 'non_replacement';
  }
  return 'balanced';
};

const toSuppressedShareDirectionConfidence = (evidence: AiEvidenceV2_1): number => {
  const netPolarity = toSuppressedShareNetPolarityPct(evidence);
  return Number(Math.min(Math.abs(netPolarity), 100).toFixed(2));
};

const toSuppressedShareDirectionStrengthBucket = (
  evidence: AiEvidenceV2_1,
): 'LOW' | 'MEDIUM' | 'HIGH' => {
  const confidence = toSuppressedShareDirectionConfidence(evidence);
  if (confidence >= 66.67) {
    return 'HIGH';
  }
  if (confidence >= 33.34) {
    return 'MEDIUM';
  }
  return 'LOW';
};

const toSuppressedShareDirectionStrengthRank = (evidence: AiEvidenceV2_1): 1 | 2 | 3 => {
  const bucket = toSuppressedShareDirectionStrengthBucket(evidence);
  if (bucket === 'HIGH') {
    return 3;
  }
  if (bucket === 'MEDIUM') {
    return 2;
  }
  return 1;
};

const toSuppressedShareDirectionIsBalanced = (evidence: AiEvidenceV2_1): boolean => {
  return toSuppressedShareDirection(evidence) === 'balanced';
};

const toSuppressedShareDirectionLabel = (evidence: AiEvidenceV2_1): string => {
  const direction = toSuppressedShareDirection(evidence);
  if (direction === 'replacement') {
    return 'Replacement Dominant';
  }
  if (direction === 'non_replacement') {
    return 'Non-Replacement Dominant';
  }
  return 'Balanced';
};

const toSuppressedShareDirectionCode = (evidence: AiEvidenceV2_1): 'R' | 'N' | 'B' => {
  const direction = toSuppressedShareDirection(evidence);
  if (direction === 'replacement') {
    return 'R';
  }
  if (direction === 'non_replacement') {
    return 'N';
  }
  return 'B';
};

const toSuppressedShareDirectionTriageHint = (evidence: AiEvidenceV2_1): string => {
  const direction = toSuppressedShareDirection(evidence);
  const confidence = toSuppressedShareDirectionConfidence(evidence);
  if (direction === 'balanced') {
    return 'Balanced suppression split; inspect replacement and non-replacement paths equally.';
  }
  if (direction === 'replacement') {
    return confidence >= 66.67
      ? 'Replacement-dominant suppression; prioritize replacement rule review first.'
      : 'Replacement-leaning suppression; review replacement paths before non-replacement.';
  }
  return confidence >= 66.67
    ? 'Non-replacement-dominant suppression; prioritize non-replacement suppression review first.'
    : 'Non-replacement-leaning suppression; review non-replacement paths before replacement.';
};

const toSuppressedShareDirectionPriorityScore = (evidence: AiEvidenceV2_1): number => {
  const confidence = toSuppressedShareDirectionConfidence(evidence);
  const direction = toSuppressedShareDirection(evidence);
  if (direction === 'balanced') {
    return 0;
  }
  return Number(confidence.toFixed(2));
};

const toSuppressedShareTriageSummary = (evidence: AiEvidenceV2_1): string => {
  const label = toSuppressedShareDirectionLabel(evidence);
  const bucket = toSuppressedShareDirectionStrengthBucket(evidence);
  const priorityScore = toSuppressedShareDirectionPriorityScore(evidence);
  const triageHint = toSuppressedShareDirectionTriageHint(evidence);
  return `${label} | ${bucket} | priority ${priorityScore} | ${triageHint}`;
};

const toSuppressedShareTriageDigest = (evidence: AiEvidenceV2_1): string => {
  const directionCode = toSuppressedShareDirectionCode(evidence);
  const bucket = toSuppressedShareDirectionStrengthBucket(evidence);
  const priorityScore = toSuppressedShareDirectionPriorityScore(evidence);
  return `${directionCode}:${bucket}:${priorityScore}`;
};

const toSuppressedShareTriageAction = (evidence: AiEvidenceV2_1): string => {
  const direction = toSuppressedShareDirection(evidence);
  const confidence = toSuppressedShareDirectionConfidence(evidence);
  if (direction === 'balanced') {
    return 'review_both_paths';
  }
  if (direction === 'replacement') {
    return confidence >= 66.67
      ? 'review_replacement_first'
      : 'review_replacement_then_non_replacement';
  }
  return confidence >= 66.67
    ? 'review_non_replacement_first'
    : 'review_non_replacement_then_replacement';
};

const toSuppressedShareTriagePlaybook = (evidence: AiEvidenceV2_1): string => {
  const action = toSuppressedShareTriageAction(evidence);
  if (action === 'review_replacement_first') {
    return 'review_replacement_rules>validate_replacements>check_non_replacement_fallbacks';
  }
  if (action === 'review_replacement_then_non_replacement') {
    return 'review_replacement_rules>review_non_replacement_paths>validate_balance_delta';
  }
  if (action === 'review_non_replacement_first') {
    return 'review_non_replacement_paths>validate_suppression_justification>check_replacement_rules';
  }
  if (action === 'review_non_replacement_then_replacement') {
    return 'review_non_replacement_paths>review_replacement_rules>validate_balance_delta';
  }
  return 'review_replacement_rules>review_non_replacement_paths>validate_balance_delta';
};

const toSuppressedShareTriagePriorityBand = (
  evidence: AiEvidenceV2_1,
): 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' => {
  const score = toSuppressedShareDirectionPriorityScore(evidence);
  if (score <= 0) {
    return 'NONE';
  }
  if (score >= 80) {
    return 'HIGH';
  }
  if (score >= 50) {
    return 'MEDIUM';
  }
  return 'LOW';
};

const toSuppressedShareTriageOrder = (evidence: AiEvidenceV2_1): string => {
  const action = toSuppressedShareTriageAction(evidence);
  if (action === 'review_replacement_first') {
    return 'replacement>non_replacement';
  }
  if (action === 'review_replacement_then_non_replacement') {
    return 'replacement>non_replacement';
  }
  if (action === 'review_non_replacement_first') {
    return 'non_replacement>replacement';
  }
  if (action === 'review_non_replacement_then_replacement') {
    return 'non_replacement>replacement';
  }
  return 'replacement=non_replacement';
};

const toSuppressedShareTriagePrimarySide = (
  evidence: AiEvidenceV2_1,
): 'replacement' | 'non_replacement' | 'balanced' => {
  return toSuppressedShareDirection(evidence);
};

const toSuppressedShareTriageSecondarySide = (
  evidence: AiEvidenceV2_1,
): 'replacement' | 'non_replacement' | 'balanced' => {
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  if (primarySide === 'replacement') {
    return 'non_replacement';
  }
  if (primarySide === 'non_replacement') {
    return 'replacement';
  }
  return 'balanced';
};

const toSuppressedShareTriageSidePair = (evidence: AiEvidenceV2_1): string => {
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  const secondarySide = toSuppressedShareTriageSecondarySide(evidence);
  if (primarySide === 'balanced' && secondarySide === 'balanced') {
    return 'balanced=balanced';
  }
  return `${primarySide}>${secondarySide}`;
};

const toSuppressedShareTriageSideAlignment = (
  evidence: AiEvidenceV2_1,
): 'balanced' | 'same' | 'opposed' => {
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  const secondarySide = toSuppressedShareTriageSecondarySide(evidence);
  if (primarySide === 'balanced' && secondarySide === 'balanced') {
    return 'balanced';
  }
  if (primarySide === secondarySide) {
    return 'same';
  }
  return 'opposed';
};

const toSuppressedShareTriageFocusTarget = (evidence: AiEvidenceV2_1): string => {
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  if (primarySide === 'replacement') {
    return 'replacement_rules';
  }
  if (primarySide === 'non_replacement') {
    return 'non_replacement_paths';
  }
  return 'both_paths';
};

const toSuppressedShareTriageFocusOrder = (evidence: AiEvidenceV2_1): string => {
  const focusTarget = toSuppressedShareTriageFocusTarget(evidence);
  if (focusTarget === 'replacement_rules') {
    return 'replacement_rules>non_replacement_paths';
  }
  if (focusTarget === 'non_replacement_paths') {
    return 'non_replacement_paths>replacement_rules';
  }
  return 'replacement_rules=non_replacement_paths';
};

const toSuppressedShareTriageFocusMode = (
  evidence: AiEvidenceV2_1,
): 'single' | 'dual' => {
  const focusTarget = toSuppressedShareTriageFocusTarget(evidence);
  if (focusTarget === 'both_paths') {
    return 'dual';
  }
  return 'single';
};

const toSuppressedShareTriageIntensity = (evidence: AiEvidenceV2_1): number => {
  const priorityScore = toSuppressedShareDirectionPriorityScore(evidence);
  if (priorityScore <= 0) {
    return 0;
  }
  const focusMode = toSuppressedShareTriageFocusMode(evidence);
  const multiplier = focusMode === 'dual' ? 0.5 : 1;
  return Number((priorityScore * multiplier).toFixed(2));
};

const toSuppressedShareTriageLane = (evidence: AiEvidenceV2_1): string => {
  const priorityBand = toSuppressedShareTriagePriorityBand(evidence);
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  if (priorityBand === 'NONE') {
    return 'watch_lane';
  }
  if (primarySide === 'balanced') {
    return `balanced_${priorityBand.toLowerCase()}_lane`;
  }
  if (primarySide === 'replacement') {
    return priorityBand === 'HIGH' ? 'replacement_fast_lane' : 'replacement_standard_lane';
  }
  return priorityBand === 'HIGH'
    ? 'non_replacement_fast_lane'
    : 'non_replacement_standard_lane';
};

const toSuppressedShareTriageRoute = (evidence: AiEvidenceV2_1): string => {
  const lane = toSuppressedShareTriageLane(evidence);
  if (lane === 'watch_lane') {
    return 'watch_lane:observe';
  }
  const focusOrder = toSuppressedShareTriageFocusOrder(evidence);
  return `${lane}:${focusOrder}`;
};

const toSuppressedShareTriageChannel = (
  evidence: AiEvidenceV2_1,
): 'watch' | 'balanced' | 'fast' | 'standard' => {
  const lane = toSuppressedShareTriageLane(evidence);
  if (lane === 'watch_lane') {
    return 'watch';
  }
  if (lane.startsWith('balanced_')) {
    return 'balanced';
  }
  if (lane.endsWith('_fast_lane')) {
    return 'fast';
  }
  return 'standard';
};

const toSuppressedShareTriageTrack = (evidence: AiEvidenceV2_1): string => {
  const channel = toSuppressedShareTriageChannel(evidence);
  if (channel === 'watch') {
    return 'monitor_track';
  }
  if (channel === 'balanced') {
    return 'balanced_track';
  }
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  if (primarySide === 'replacement') {
    return channel === 'fast' ? 'replacement_fast_track' : 'replacement_standard_track';
  }
  if (primarySide === 'non_replacement') {
    return channel === 'fast'
      ? 'non_replacement_fast_track'
      : 'non_replacement_standard_track';
  }
  return 'balanced_track';
};

const toSuppressedShareTriageStream = (evidence: AiEvidenceV2_1): string => {
  const track = toSuppressedShareTriageTrack(evidence);
  if (track === 'monitor_track') {
    return 'observation_stream';
  }
  if (track === 'balanced_track') {
    return 'balanced_stream';
  }
  if (track === 'replacement_fast_track') {
    return 'replacement_priority_stream';
  }
  if (track === 'non_replacement_fast_track') {
    return 'non_replacement_priority_stream';
  }
  if (track === 'replacement_standard_track') {
    return 'replacement_standard_stream';
  }
  return 'non_replacement_standard_stream';
};

const toSuppressedShareTriageStreamClass = (
  evidence: AiEvidenceV2_1,
): 'observation' | 'balanced' | 'priority' | 'standard' => {
  const stream = toSuppressedShareTriageStream(evidence);
  if (stream === 'observation_stream') {
    return 'observation';
  }
  if (stream === 'balanced_stream') {
    return 'balanced';
  }
  if (stream.endsWith('_priority_stream')) {
    return 'priority';
  }
  return 'standard';
};

const toSuppressedShareTriageStreamRank = (
  evidence: AiEvidenceV2_1,
): 0 | 1 | 2 | 3 => {
  const streamClass = toSuppressedShareTriageStreamClass(evidence);
  if (streamClass === 'observation') {
    return 0;
  }
  if (streamClass === 'balanced') {
    return 1;
  }
  if (streamClass === 'standard') {
    return 2;
  }
  return 3;
};

const toSuppressedShareTriageStreamScore = (evidence: AiEvidenceV2_1): number => {
  const rank = toSuppressedShareTriageStreamRank(evidence);
  return Number(((rank / 3) * 100).toFixed(2));
};

const toSuppressedShareTriageStreamScoreBand = (
  evidence: AiEvidenceV2_1,
): 'LOW' | 'MEDIUM' | 'HIGH' => {
  const score = toSuppressedShareTriageStreamScore(evidence);
  if (score >= 80) {
    return 'HIGH';
  }
  if (score >= 40) {
    return 'MEDIUM';
  }
  return 'LOW';
};

const toSuppressedShareTriageStreamSignal = (evidence: AiEvidenceV2_1): string => {
  const streamClass = toSuppressedShareTriageStreamClass(evidence);
  const scoreBand = toSuppressedShareTriageStreamScoreBand(evidence);
  return `${streamClass}:${scoreBand}`;
};

const toSuppressedShareTriageStreamSignalCode = (evidence: AiEvidenceV2_1): string => {
  const streamClass = toSuppressedShareTriageStreamClass(evidence);
  const scoreBand = toSuppressedShareTriageStreamScoreBand(evidence);
  const classCode = (() => {
    if (streamClass === 'observation') {
      return 'OBS';
    }
    if (streamClass === 'balanced') {
      return 'BAL';
    }
    if (streamClass === 'priority') {
      return 'PRI';
    }
    return 'STD';
  })();
  const bandCode = scoreBand === 'HIGH' ? 'H' : scoreBand === 'MEDIUM' ? 'M' : 'L';
  return `${classCode}-${bandCode}`;
};

const toSuppressedShareTriageStreamSignalFamily = (evidence: AiEvidenceV2_1): string => {
  const streamClass = toSuppressedShareTriageStreamClass(evidence);
  if (streamClass === 'observation') {
    return 'observation_family';
  }
  if (streamClass === 'balanced') {
    return 'balanced_family';
  }
  if (streamClass === 'priority') {
    return 'priority_family';
  }
  return 'standard_family';
};

const toSuppressedShareTriageStreamSignalFamilyCode = (evidence: AiEvidenceV2_1): string => {
  const family = toSuppressedShareTriageStreamSignalFamily(evidence);
  if (family === 'observation_family') {
    return 'OBS_FAM';
  }
  if (family === 'balanced_family') {
    return 'BAL_FAM';
  }
  if (family === 'priority_family') {
    return 'PRI_FAM';
  }
  return 'STD_FAM';
};

const toSuppressedShareTriageStreamSignalFamilyRank = (
  evidence: AiEvidenceV2_1,
): 0 | 1 | 2 | 3 => {
  const family = toSuppressedShareTriageStreamSignalFamily(evidence);
  if (family === 'observation_family') {
    return 0;
  }
  if (family === 'balanced_family') {
    return 1;
  }
  if (family === 'standard_family') {
    return 2;
  }
  return 3;
};

const toSuppressedShareTriageStreamSignalFamilyWeight = (
  evidence: AiEvidenceV2_1,
): number => {
  const rank = toSuppressedShareTriageStreamSignalFamilyRank(evidence);
  return Number(((rank / 3) * 100).toFixed(2));
};

const toSuppressedShareTriageStreamSignalFamilyBucket = (
  evidence: AiEvidenceV2_1,
): 'LOW' | 'MEDIUM' | 'HIGH' => {
  const weight = toSuppressedShareTriageStreamSignalFamilyWeight(evidence);
  if (weight >= 80) {
    return 'HIGH';
  }
  if (weight >= 40) {
    return 'MEDIUM';
  }
  return 'LOW';
};

const toSuppressedShareTriageStreamSignalFamilyDigest = (evidence: AiEvidenceV2_1): string => {
  const familyCode = toSuppressedShareTriageStreamSignalFamilyCode(evidence);
  const bucket = toSuppressedShareTriageStreamSignalFamilyBucket(evidence);
  return `${familyCode}:${bucket}`;
};

const toSuppressedShareTriageStreamSignalFamilyDigestCode = (
  evidence: AiEvidenceV2_1,
): string => {
  const familyCode = toSuppressedShareTriageStreamSignalFamilyCode(evidence);
  const bucket = toSuppressedShareTriageStreamSignalFamilyBucket(evidence);
  return `${familyCode}_${bucket}`;
};

const toSuppressedShareTriageStreamSignalFamilyTrace = (evidence: AiEvidenceV2_1): string => {
  const digestCode = toSuppressedShareTriageStreamSignalFamilyDigestCode(evidence);
  const route = toSuppressedShareTriageRoute(evidence);
  return `${digestCode}@${route}`;
};

const toSuppressedShareTriageStreamSignalFamilyTraceCode = (
  evidence: AiEvidenceV2_1,
): string => {
  const trace = toSuppressedShareTriageStreamSignalFamilyTrace(evidence);
  return trace
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const toSuppressedShareTriageStreamSignalFamilyTraceHash = (
  evidence: AiEvidenceV2_1,
): string => {
  const trace = toSuppressedShareTriageStreamSignalFamilyTrace(evidence);
  let hash = 0x811c9dc5;
  for (const character of trace) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).toUpperCase().padStart(8, '0');
};

const toSuppressedShareTriageStreamSignalFamilyTraceHashCode = (
  evidence: AiEvidenceV2_1,
): string => {
  const traceHash = toSuppressedShareTriageStreamSignalFamilyTraceHash(evidence);
  return `TRACE_HASH_${traceHash}`;
};

const toSuppressedShareTriageStreamSignalFamilyTraceHashBucket = (
  evidence: AiEvidenceV2_1,
): 'LOW' | 'MEDIUM' | 'HIGH' => {
  const traceHash = toSuppressedShareTriageStreamSignalFamilyTraceHash(evidence);
  const leadByte = Number.parseInt(traceHash.slice(0, 2), 16);
  if (leadByte >= 170) {
    return 'HIGH';
  }
  if (leadByte >= 85) {
    return 'MEDIUM';
  }
  return 'LOW';
};

const toSuppressedShareTriageStreamSignalFamilyTraceHashRank = (
  evidence: AiEvidenceV2_1,
): 0 | 1 | 2 => {
  const bucket = toSuppressedShareTriageStreamSignalFamilyTraceHashBucket(evidence);
  if (bucket === 'HIGH') {
    return 2;
  }
  if (bucket === 'MEDIUM') {
    return 1;
  }
  return 0;
};

const toSuppressedShareTriageStreamSignalFamilyTraceHashWeight = (
  evidence: AiEvidenceV2_1,
): number => {
  const rank = toSuppressedShareTriageStreamSignalFamilyTraceHashRank(evidence);
  return Number(((rank / 2) * 100).toFixed(2));
};

const toFindingsFilesCount = (findings: AiEvidenceV2_1['snapshot']['findings']): number => {
  const files = new Set<string>();
  for (const finding of findings) {
    files.add(finding.file);
  }
  return files.size;
};

const toFindingsRulesCount = (findings: AiEvidenceV2_1['snapshot']['findings']): number => {
  const rules = new Set<string>();
  for (const finding of findings) {
    rules.add(finding.ruleId);
  }
  return rules.size;
};

const toFindingsWithLinesCount = (findings: AiEvidenceV2_1['snapshot']['findings']): number => {
  let count = 0;
  for (const finding of findings) {
    if (finding.lines && finding.lines.length > 0) {
      count += 1;
    }
  }
  return count;
};

const toPlatformConfidenceCounts = (
  platforms: AiEvidenceV2_1['platforms']
): Record<string, number> => {
  const counts = new Map<string, number>();
  for (const entry of Object.values(platforms)) {
    counts.set(entry.confidence, (counts.get(entry.confidence) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
};

const inferPlatformFromFilePath = (
  filePath: string
): 'ios' | 'backend' | 'frontend' | 'android' | 'generic' => {
  const file = filePath.toLowerCase();
  if (file.startsWith('apps/ios/') || file.endsWith('.swift')) {
    return 'ios';
  }
  if (file.startsWith('apps/backend/')) {
    return 'backend';
  }
  if (file.startsWith('apps/frontend/')) {
    return 'frontend';
  }
  if (file.startsWith('apps/android/') || file.endsWith('.kt') || file.endsWith('.kts')) {
    return 'android';
  }
  return 'generic';
};

const toFindingsByPlatform = (
  findings: AiEvidenceV2_1['snapshot']['findings']
): Record<string, number> => {
  const counts = new Map<string, number>();
  for (const finding of findings) {
    const platform = inferPlatformFromFilePath(finding.file);
    counts.set(platform, (counts.get(platform) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
};

const toLedgerByPlatform = (ledger: AiEvidenceV2_1['ledger']): Record<string, number> => {
  const counts = new Map<string, number>();
  for (const entry of ledger) {
    const platform = inferPlatformFromFilePath(entry.file);
    counts.set(platform, (counts.get(platform) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
};

const toLedgerFilesCount = (ledger: AiEvidenceV2_1['ledger']): number => {
  const files = new Set<string>();
  for (const entry of ledger) {
    files.add(entry.file);
  }
  return files.size;
};

const toLedgerRulesCount = (ledger: AiEvidenceV2_1['ledger']): number => {
  const rules = new Set<string>();
  for (const entry of ledger) {
    rules.add(entry.ruleId);
  }
  return rules.size;
};

const toHighestSeverity = (
  findings: AiEvidenceV2_1['snapshot']['findings']
): string | null => {
  let highest: string | null = null;
  for (const finding of findings) {
    const severity = finding.severity.toUpperCase();
    if (highest === null) {
      highest = severity;
      continue;
    }
    const currentRank = severityRank[severity] ?? Number.MAX_SAFE_INTEGER;
    const highestRank = severityRank[highest] ?? Number.MAX_SAFE_INTEGER;
    if (currentRank < highestRank) {
      highest = severity;
    }
  }
  return highest;
};

const toBlockingFindingsCount = (findings: AiEvidenceV2_1['snapshot']['findings']): number => {
  let count = 0;
  for (const finding of findings) {
    const rank = severityRank[finding.severity.toUpperCase()] ?? Number.MAX_SAFE_INTEGER;
    if (rank <= severityRank.ERROR) {
      count += 1;
    }
  }
  return count;
};

const toSummaryPayload = (evidence: AiEvidenceV2_1) => {
  const sortedPlatforms = sortPlatforms(evidence.platforms);
  const detectedPlatforms = sortedPlatforms.filter((entry) => entry.detected);
  const suppressedFindingsCount = evidence.consolidation?.suppressed?.length ?? 0;
  const findingsWithLinesCount = toFindingsWithLinesCount(evidence.snapshot.findings);
  return {
    version: evidence.version,
    timestamp: evidence.timestamp,
    snapshot: {
      stage: evidence.snapshot.stage,
      outcome: evidence.snapshot.outcome,
      has_findings: evidence.snapshot.findings.length > 0,
      findings_count: evidence.snapshot.findings.length,
      findings_files_count: toFindingsFilesCount(evidence.snapshot.findings),
      findings_rules_count: toFindingsRulesCount(evidence.snapshot.findings),
      findings_with_lines_count: findingsWithLinesCount,
      findings_without_lines_count: evidence.snapshot.findings.length - findingsWithLinesCount,
      severity_counts: toSeverityCounts(evidence.snapshot.findings),
      findings_by_platform: toFindingsByPlatform(evidence.snapshot.findings),
      highest_severity: toHighestSeverity(evidence.snapshot.findings),
      blocking_findings_count: toBlockingFindingsCount(evidence.snapshot.findings),
    },
    ledger_count: evidence.ledger.length,
    ledger_files_count: toLedgerFilesCount(evidence.ledger),
    ledger_rules_count: toLedgerRulesCount(evidence.ledger),
    ledger_by_platform: toLedgerByPlatform(evidence.ledger),
    rulesets_count: evidence.rulesets.length,
    rulesets_platforms_count: toRulesetsPlatformsCount(evidence.rulesets),
    rulesets_bundles_count: toRulesetsBundlesCount(evidence.rulesets),
    rulesets_hashes_count: toRulesetsHashesCount(evidence.rulesets),
    rulesets_by_platform: toRulesetsByPlatform(evidence.rulesets),
    rulesets_fingerprint: toRulesetsFingerprint(evidence.rulesets),
    platform_confidence_counts: toPlatformConfidenceCounts(evidence.platforms),
    suppressed_findings_count: suppressedFindingsCount,
    suppressed_replacement_rules_count: toSuppressedReplacementRulesCount(evidence),
    suppressed_platforms_count: toSuppressedPlatformsCount(evidence),
    suppressed_files_count: toSuppressedFilesCount(evidence),
    suppressed_rules_count: toSuppressedRulesCount(evidence),
    suppressed_reasons_count: toSuppressedReasonsCount(evidence),
    suppressed_non_replacement_rules_count: toSuppressedNonReplacementRulesCount(evidence),
    suppressed_with_replacement_files_count: toSuppressedWithReplacementFilesCount(evidence),
    suppressed_with_replacement_files_ratio_pct: toSuppressedWithReplacementFilesRatioPct(evidence),
    suppressed_replacement_files_ratio_pct: toSuppressedReplacementFilesRatioPct(evidence),
    suppressed_with_replacement_platforms_ratio_pct: toSuppressedWithReplacementPlatformsRatioPct(evidence),
    suppressed_without_replacement_platforms_ratio_pct: toSuppressedWithoutReplacementPlatformsRatioPct(evidence),
    suppressed_non_replacement_platforms_ratio_pct: toSuppressedNonReplacementPlatformsRatioPct(evidence),
    suppressed_with_replacement_count: toSuppressedWithReplacementCount(evidence),
    suppressed_without_replacement_files_count: toSuppressedWithoutReplacementFilesCount(evidence),
    suppressed_without_replacement_files_ratio_pct: toSuppressedWithoutReplacementFilesRatioPct(evidence),
    suppressed_non_replacement_files_ratio_pct: toSuppressedNonReplacementFilesRatioPct(evidence),
    suppressed_with_replacement_ratio_pct: toSuppressedWithReplacementRatioPct(evidence),
    suppressed_reasons_with_replacement_ratio_pct: toSuppressedReasonsWithReplacementRatioPct(evidence),
    suppressed_reasons_without_replacement_ratio_pct: toSuppressedReasonsWithoutReplacementRatioPct(evidence),
    suppressed_finding_coverage_ratio_pct: toSuppressedFindingCoverageRatioPct(evidence),
    suppressed_reasons_coverage_ratio_pct: toSuppressedReasonsCoverageRatioPct(evidence),
    suppressed_replacement_rules_ratio_pct: toSuppressedReplacementRulesRatioPct(evidence),
    suppressed_non_replacement_rules_ratio_pct: toSuppressedNonReplacementRulesRatioPct(evidence),
    suppressed_replacement_platforms_ratio_pct: toSuppressedReplacementPlatformsRatioPct(evidence),
    suppressed_with_replacement_platforms_count: toSuppressedWithReplacementPlatformsCount(evidence),
    suppressed_without_replacement_platforms_count: toSuppressedWithoutReplacementPlatformsCount(evidence),
    suppressed_non_replacement_files_count: toSuppressedNonReplacementFilesCount(evidence),
    suppressed_without_replacement_count: toSuppressedWithoutReplacementCount(evidence),
    suppressed_non_replacement_ratio_pct: toSuppressedNonReplacementRatioPct(evidence),
    suppressed_without_replacement_ratio_pct: toSuppressedWithoutReplacementRatioPct(evidence),
    suppressed_rule_file_pairs_count: toSuppressedRuleFilePairsCount(evidence),
    suppressed_reasons_with_replacement_count: toSuppressedReasonsWithReplacementCount(evidence),
    suppressed_reasons_without_replacement_count: toSuppressedReasonsWithoutReplacementCount(evidence),
    suppressed_platform_rule_pairs_count: toSuppressedPlatformRulePairsCount(evidence),
    suppressed_platform_file_pairs_count: toSuppressedPlatformFilePairsCount(evidence),
    suppressed_replacement_rule_file_pairs_count: toSuppressedReplacementRuleFilePairsCount(evidence),
    suppressed_replacement_rule_platform_pairs_count: toSuppressedReplacementRulePlatformPairsCount(evidence),
    suppressed_replacement_platforms_count: toSuppressedReplacementPlatformsCount(evidence),
    suppressed_non_replacement_platforms_count: toSuppressedNonReplacementPlatformsCount(evidence),
    suppressed_non_replacement_reason_file_pairs_count: toSuppressedNonReplacementReasonFilePairsCount(evidence),
    suppressed_non_replacement_rule_file_pairs_count: toSuppressedNonReplacementRuleFilePairsCount(evidence),
    suppressed_non_replacement_rule_file_pairs_ratio_pct:
      toSuppressedNonReplacementRuleFilePairsRatioPct(evidence),
    suppressed_non_replacement_rule_platform_pairs_count: toSuppressedNonReplacementRulePlatformPairsCount(evidence),
    suppressed_non_replacement_reasons_count: toSuppressedNonReplacementReasonsCount(evidence),
    suppressed_replacement_reason_file_pairs_count: toSuppressedReplacementReasonFilePairsCount(evidence),
    suppressed_replacement_rule_reason_pairs_count: toSuppressedReplacementRuleReasonPairsCount(evidence),
    suppressed_replacement_rule_ids_count: toSuppressedReplacementRuleIdsCount(evidence),
    suppressed_replacement_reasons_count: toSuppressedReplacementReasonsCount(evidence),
    suppressed_replacement_rule_file_platform_triples_count:
      toSuppressedReplacementRuleFilePlatformTriplesCount(evidence),
    suppressed_non_replacement_rule_file_platform_triples_count:
      toSuppressedNonReplacementRuleFilePlatformTriplesCount(evidence),
    suppressed_reason_rule_file_triples_count:
      toSuppressedReasonRuleFileTriplesCount(evidence),
    suppressed_reason_rule_platform_triples_count:
      toSuppressedReasonRulePlatformTriplesCount(evidence),
    suppressed_reason_file_platform_triples_count:
      toSuppressedReasonFilePlatformTriplesCount(evidence),
    suppressed_reason_platform_pairs_count:
      toSuppressedReasonPlatformPairsCount(evidence),
    suppressed_reason_file_pairs_count:
      toSuppressedReasonFilePairsCount(evidence),
    suppressed_replacement_reason_platform_pairs_count:
      toSuppressedReplacementReasonPlatformPairsCount(evidence),
    suppressed_non_replacement_reason_platform_pairs_count:
      toSuppressedNonReplacementReasonPlatformPairsCount(evidence),
    suppressed_replacement_reason_rule_file_triples_count:
      toSuppressedReplacementReasonRuleFileTriplesCount(evidence),
    suppressed_non_replacement_reason_rule_file_triples_count:
      toSuppressedNonReplacementReasonRuleFileTriplesCount(evidence),
    suppressed_replacement_reason_rule_platform_triples_count:
      toSuppressedReplacementReasonRulePlatformTriplesCount(evidence),
    suppressed_non_replacement_reason_rule_platform_triples_count:
      toSuppressedNonReplacementReasonRulePlatformTriplesCount(evidence),
    suppressed_reason_rule_file_platform_quadruples_count:
      toSuppressedReasonRuleFilePlatformQuadruplesCount(evidence),
    suppressed_replacement_reason_rule_file_platform_quadruples_count:
      toSuppressedReplacementReasonRuleFilePlatformQuadruplesCount(evidence),
    suppressed_non_replacement_reason_rule_file_platform_quadruples_count:
      toSuppressedNonReplacementReasonRuleFilePlatformQuadruplesCount(evidence),
    suppressed_reason_rule_file_platform_replacement_split_count:
      toSuppressedReasonRuleFilePlatformReplacementSplitCount(evidence),
    suppressed_replacement_split_modes_count:
      toSuppressedReplacementSplitModesCount(evidence),
    suppressed_replacement_split_mode_replacement_count:
      toSuppressedReplacementSplitModeReplacementCount(evidence),
    suppressed_replacement_split_mode_non_replacement_count:
      toSuppressedReplacementSplitModeNonReplacementCount(evidence),
    suppressed_reason_rule_file_platform_replacement_dual_mode_count:
      toSuppressedReasonRuleFilePlatformReplacementDualModeCount(evidence),
    suppressed_replacement_rule_file_platform_distinct_count:
      toSuppressedReplacementRuleFilePlatformDistinctCount(evidence),
    suppressed_non_replacement_rule_file_platform_distinct_count:
      toSuppressedNonReplacementRuleFilePlatformDistinctCount(evidence),
    suppressed_rule_file_platform_distinct_total_count:
      toSuppressedRuleFilePlatformDistinctTotalCount(evidence),
    suppressed_replacement_rule_file_platform_share_of_total_pct:
      toSuppressedReplacementRuleFilePlatformShareOfTotalPct(evidence),
    suppressed_non_replacement_rule_file_platform_share_of_total_pct:
      toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct(evidence),
    suppressed_replacement_vs_non_replacement_share_gap_pct:
      toSuppressedReplacementVsNonReplacementShareGapPct(evidence),
    suppressed_replacement_rule_file_platform_dominance_pct:
      toSuppressedReplacementRuleFilePlatformDominancePct(evidence),
    suppressed_replacement_minus_non_replacement_share_signed_pct:
      toSuppressedReplacementMinusNonReplacementShareSignedPct(evidence),
    suppressed_non_replacement_rule_file_platform_dominance_pct:
      toSuppressedNonReplacementRuleFilePlatformDominancePct(evidence),
    suppressed_share_polarization_index_pct:
      toSuppressedSharePolarizationIndexPct(evidence),
    suppressed_share_balance_score_pct:
      toSuppressedShareBalanceScorePct(evidence),
    suppressed_share_imbalance_index_pct:
      toSuppressedShareImbalanceIndexPct(evidence),
    suppressed_share_polarization_balance_gap_pct:
      toSuppressedSharePolarizationBalanceGapPct(evidence),
    suppressed_share_net_polarity_pct:
      toSuppressedShareNetPolarityPct(evidence),
    suppressed_share_direction:
      toSuppressedShareDirection(evidence),
    suppressed_share_direction_confidence:
      toSuppressedShareDirectionConfidence(evidence),
    suppressed_share_direction_strength_bucket:
      toSuppressedShareDirectionStrengthBucket(evidence),
    suppressed_share_direction_strength_rank:
      toSuppressedShareDirectionStrengthRank(evidence),
    suppressed_share_direction_is_balanced:
      toSuppressedShareDirectionIsBalanced(evidence),
    suppressed_share_direction_label:
      toSuppressedShareDirectionLabel(evidence),
    suppressed_share_direction_code:
      toSuppressedShareDirectionCode(evidence),
    suppressed_share_direction_triage_hint:
      toSuppressedShareDirectionTriageHint(evidence),
    suppressed_share_direction_priority_score:
      toSuppressedShareDirectionPriorityScore(evidence),
    suppressed_share_triage_summary:
      toSuppressedShareTriageSummary(evidence),
    suppressed_share_triage_digest:
      toSuppressedShareTriageDigest(evidence),
    suppressed_share_triage_action:
      toSuppressedShareTriageAction(evidence),
    suppressed_share_triage_playbook:
      toSuppressedShareTriagePlaybook(evidence),
    suppressed_share_triage_priority_band:
      toSuppressedShareTriagePriorityBand(evidence),
    suppressed_share_triage_order:
      toSuppressedShareTriageOrder(evidence),
    suppressed_share_triage_primary_side:
      toSuppressedShareTriagePrimarySide(evidence),
    suppressed_share_triage_secondary_side:
      toSuppressedShareTriageSecondarySide(evidence),
    suppressed_share_triage_side_pair:
      toSuppressedShareTriageSidePair(evidence),
    suppressed_share_triage_side_alignment:
      toSuppressedShareTriageSideAlignment(evidence),
    suppressed_share_triage_focus_target:
      toSuppressedShareTriageFocusTarget(evidence),
    suppressed_share_triage_focus_order:
      toSuppressedShareTriageFocusOrder(evidence),
    suppressed_share_triage_focus_mode:
      toSuppressedShareTriageFocusMode(evidence),
    suppressed_share_triage_intensity:
      toSuppressedShareTriageIntensity(evidence),
    suppressed_share_triage_lane:
      toSuppressedShareTriageLane(evidence),
    suppressed_share_triage_route:
      toSuppressedShareTriageRoute(evidence),
    suppressed_share_triage_channel:
      toSuppressedShareTriageChannel(evidence),
    suppressed_share_triage_track:
      toSuppressedShareTriageTrack(evidence),
    suppressed_share_triage_stream:
      toSuppressedShareTriageStream(evidence),
    suppressed_share_triage_stream_class:
      toSuppressedShareTriageStreamClass(evidence),
    suppressed_share_triage_stream_rank:
      toSuppressedShareTriageStreamRank(evidence),
    suppressed_share_triage_stream_score:
      toSuppressedShareTriageStreamScore(evidence),
    suppressed_share_triage_stream_score_band:
      toSuppressedShareTriageStreamScoreBand(evidence),
    suppressed_share_triage_stream_signal:
      toSuppressedShareTriageStreamSignal(evidence),
    suppressed_share_triage_stream_signal_code:
      toSuppressedShareTriageStreamSignalCode(evidence),
    suppressed_share_triage_stream_signal_family:
      toSuppressedShareTriageStreamSignalFamily(evidence),
    suppressed_share_triage_stream_signal_family_code:
      toSuppressedShareTriageStreamSignalFamilyCode(evidence),
    suppressed_share_triage_stream_signal_family_rank:
      toSuppressedShareTriageStreamSignalFamilyRank(evidence),
    suppressed_share_triage_stream_signal_family_weight:
      toSuppressedShareTriageStreamSignalFamilyWeight(evidence),
    suppressed_share_triage_stream_signal_family_bucket:
      toSuppressedShareTriageStreamSignalFamilyBucket(evidence),
    suppressed_share_triage_stream_signal_family_digest:
      toSuppressedShareTriageStreamSignalFamilyDigest(evidence),
    suppressed_share_triage_stream_signal_family_digest_code:
      toSuppressedShareTriageStreamSignalFamilyDigestCode(evidence),
    suppressed_share_triage_stream_signal_family_trace:
      toSuppressedShareTriageStreamSignalFamilyTrace(evidence),
    suppressed_share_triage_stream_signal_family_trace_code:
      toSuppressedShareTriageStreamSignalFamilyTraceCode(evidence),
    suppressed_share_triage_stream_signal_family_trace_hash:
      toSuppressedShareTriageStreamSignalFamilyTraceHash(evidence),
    suppressed_share_triage_stream_signal_family_trace_hash_code:
      toSuppressedShareTriageStreamSignalFamilyTraceHashCode(evidence),
    suppressed_share_triage_stream_signal_family_trace_hash_bucket:
      toSuppressedShareTriageStreamSignalFamilyTraceHashBucket(evidence),
    suppressed_share_triage_stream_signal_family_trace_hash_rank:
      toSuppressedShareTriageStreamSignalFamilyTraceHashRank(evidence),
    suppressed_share_triage_stream_signal_family_trace_hash_weight:
      toSuppressedShareTriageStreamSignalFamilyTraceHashWeight(evidence),
    tracked_platforms_count: sortedPlatforms.length,
    detected_platforms_count: detectedPlatforms.length,
    non_detected_platforms_count: sortedPlatforms.length - detectedPlatforms.length,
    platforms: detectedPlatforms,
  };
};

const toRulesetsPayload = (evidence: AiEvidenceV2_1, requestUrl: URL) => {
  const platformFilter = normalizeQueryToken(requestUrl.searchParams.get('platform'));
  const bundleFilter = normalizeQueryToken(requestUrl.searchParams.get('bundle'));
  const requestedLimit = parseNonNegativeIntQuery(requestUrl.searchParams.get('limit'));
  const limit =
    requestedLimit === undefined ? undefined : Math.min(requestedLimit, MAX_RULESETS_LIMIT);
  const offset = parseNonNegativeIntQuery(requestUrl.searchParams.get('offset')) ?? 0;

  const filteredRulesets = sortRulesets(evidence.rulesets).filter((ruleset) => {
    if (platformFilter && ruleset.platform.toLowerCase() !== platformFilter) {
      return false;
    }
    if (bundleFilter && ruleset.bundle.toLowerCase() !== bundleFilter) {
      return false;
    }
    return true;
  });
  const rulesets =
    limit === undefined
      ? filteredRulesets.slice(offset)
      : filteredRulesets.slice(offset, offset + limit);

  return {
    version: evidence.version,
    timestamp: evidence.timestamp,
    total_count: filteredRulesets.length,
    filters: {
      platform: platformFilter ?? null,
      bundle: bundleFilter ?? null,
    },
    pagination: {
      requested_limit: requestedLimit ?? null,
      max_limit: MAX_RULESETS_LIMIT,
      limit: limit ?? null,
      offset,
      ...(requestedLimit !== undefined
        ? { has_more: offset + rulesets.length < filteredRulesets.length }
        : {}),
    },
    rulesets,
  };
};

const toPlatformsPayload = (evidence: AiEvidenceV2_1, requestUrl: URL) => {
  const detectedOnly = parseBooleanQuery(requestUrl.searchParams.get('detectedOnly')) ?? true;
  const confidenceFilter = normalizeQueryToken(requestUrl.searchParams.get('confidence'));
  const requestedLimit = parseNonNegativeIntQuery(requestUrl.searchParams.get('limit'));
  const limit =
    requestedLimit === undefined ? undefined : Math.min(requestedLimit, MAX_PLATFORMS_LIMIT);
  const offset = parseNonNegativeIntQuery(requestUrl.searchParams.get('offset')) ?? 0;
  const filteredPlatforms = sortPlatforms(evidence.platforms).filter((entry) => {
    if (detectedOnly && !entry.detected) {
      return false;
    }
    if (confidenceFilter && entry.confidence.toLowerCase() !== confidenceFilter) {
      return false;
    }
    return true;
  });
  const platforms =
    limit === undefined
      ? filteredPlatforms.slice(offset)
      : filteredPlatforms.slice(offset, offset + limit);
  return {
    version: evidence.version,
    timestamp: evidence.timestamp,
    total_count: filteredPlatforms.length,
    filters: {
      detectedOnly,
      confidence: confidenceFilter ?? null,
    },
    pagination: {
      requested_limit: requestedLimit ?? null,
      max_limit: MAX_PLATFORMS_LIMIT,
      limit: limit ?? null,
      offset,
      ...(requestedLimit !== undefined
        ? { has_more: offset + platforms.length < filteredPlatforms.length }
        : {}),
    },
    platforms,
  };
};

const sortLedger = (ledger: AiEvidenceV2_1['ledger']): AiEvidenceV2_1['ledger'] => {
  return [...ledger].sort((left, right) => {
    const byRule = left.ruleId.localeCompare(right.ruleId);
    if (byRule !== 0) {
      return byRule;
    }
    const byFile = left.file.localeCompare(right.file);
    if (byFile !== 0) {
      return byFile;
    }
    const leftLines = left.lines ? left.lines.join(',') : '';
    const rightLines = right.lines ? right.lines.join(',') : '';
    const byLines = leftLines.localeCompare(rightLines);
    if (byLines !== 0) {
      return byLines;
    }
    const byFirstSeen = left.firstSeen.localeCompare(right.firstSeen);
    if (byFirstSeen !== 0) {
      return byFirstSeen;
    }
    return left.lastSeen.localeCompare(right.lastSeen);
  });
};

const toLedgerPayload = (evidence: AiEvidenceV2_1) => {
  const ledger = sortLedger(evidence.ledger);
  return {
    version: evidence.version,
    timestamp: evidence.timestamp,
    total_count: ledger.length,
    filters: {
      lastSeenAfter: null,
      lastSeenBefore: null,
    },
    pagination: {
      requested_limit: null,
      max_limit: MAX_LEDGER_LIMIT,
      limit: null,
      offset: 0,
    },
    ledger,
  };
};

const toLedgerPayloadWithFilters = (evidence: AiEvidenceV2_1, requestUrl: URL) => {
  const lastSeenAfter = normalizeQueryToken(requestUrl.searchParams.get('lastSeenAfter'));
  const lastSeenBefore = normalizeQueryToken(requestUrl.searchParams.get('lastSeenBefore'));
  const requestedLimit = parseNonNegativeIntQuery(requestUrl.searchParams.get('limit'));
  const limit = requestedLimit === undefined ? undefined : Math.min(requestedLimit, MAX_LEDGER_LIMIT);
  const offset = parseNonNegativeIntQuery(requestUrl.searchParams.get('offset')) ?? 0;
  const filteredLedger = sortLedger(evidence.ledger).filter((entry) => {
    if (lastSeenAfter && entry.lastSeen.toLowerCase() < lastSeenAfter) {
      return false;
    }
    if (lastSeenBefore && entry.lastSeen.toLowerCase() > lastSeenBefore) {
      return false;
    }
    return true;
  });
  const ledger =
    limit === undefined
      ? filteredLedger.slice(offset)
      : filteredLedger.slice(offset, offset + limit);

  return {
    version: evidence.version,
    timestamp: evidence.timestamp,
    total_count: filteredLedger.length,
    filters: {
      lastSeenAfter: lastSeenAfter ?? null,
      lastSeenBefore: lastSeenBefore ?? null,
    },
    pagination: {
      requested_limit: requestedLimit ?? null,
      max_limit: MAX_LEDGER_LIMIT,
      limit: limit ?? null,
      offset,
      ...(requestedLimit !== undefined
        ? { has_more: offset + ledger.length < filteredLedger.length }
        : {}),
    },
    ledger,
  };
};

const sortSnapshotFindings = (
  findings: AiEvidenceV2_1['snapshot']['findings']
): AiEvidenceV2_1['snapshot']['findings'] => {
  return [...findings].sort((left, right) => {
    const byRule = left.ruleId.localeCompare(right.ruleId);
    if (byRule !== 0) {
      return byRule;
    }
    const byFile = left.file.localeCompare(right.file);
    if (byFile !== 0) {
      return byFile;
    }
    const leftLines = left.lines ? left.lines.join(',') : '';
    const rightLines = right.lines ? right.lines.join(',') : '';
    const byLines = leftLines.localeCompare(rightLines);
    if (byLines !== 0) {
      return byLines;
    }
    const byCode = left.code.localeCompare(right.code);
    if (byCode !== 0) {
      return byCode;
    }
    const bySeverity = left.severity.localeCompare(right.severity);
    if (bySeverity !== 0) {
      return bySeverity;
    }
    return left.message.localeCompare(right.message);
  });
};

const toSnapshotPayload = (evidence: AiEvidenceV2_1) => {
  return {
    version: evidence.version,
    timestamp: evidence.timestamp,
    snapshot: {
      stage: evidence.snapshot.stage,
      outcome: evidence.snapshot.outcome,
      findings_count: evidence.snapshot.findings.length,
      findings: sortSnapshotFindings(evidence.snapshot.findings),
    },
  };
};

const normalizeQueryToken = (value: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
};

const inferFindingPlatform = (
  finding: AiEvidenceV2_1['snapshot']['findings'][number]
): 'ios' | 'backend' | 'frontend' | 'android' | 'generic' => {
  return inferPlatformFromFilePath(finding.file);
};

const toFindingsPayload = (evidence: AiEvidenceV2_1, requestUrl: URL) => {
  const severityFilter = normalizeQueryToken(requestUrl.searchParams.get('severity'));
  const ruleIdFilter = normalizeQueryToken(requestUrl.searchParams.get('ruleId'));
  const platformFilter = normalizeQueryToken(requestUrl.searchParams.get('platform'));

  const requestedLimit = parseNonNegativeIntQuery(requestUrl.searchParams.get('limit'));
  const limit =
    requestedLimit === undefined ? undefined : Math.min(requestedLimit, MAX_FINDINGS_LIMIT);
  const offset = parseNonNegativeIntQuery(requestUrl.searchParams.get('offset')) ?? 0;

  const filteredFindings = sortSnapshotFindings(evidence.snapshot.findings).filter((finding) => {
    if (severityFilter && finding.severity.toLowerCase() !== severityFilter) {
      return false;
    }
    if (ruleIdFilter && finding.ruleId.toLowerCase() !== ruleIdFilter) {
      return false;
    }
    if (platformFilter && inferFindingPlatform(finding) !== platformFilter) {
      return false;
    }
    return true;
  });
  const findings =
    limit === undefined
      ? filteredFindings.slice(offset)
      : filteredFindings.slice(offset, offset + limit);

  return {
    version: evidence.version,
    timestamp: evidence.timestamp,
    snapshot: {
      stage: evidence.snapshot.stage,
      outcome: evidence.snapshot.outcome,
    },
    findings_count: findings.length,
    total_count: filteredFindings.length,
    filters: {
      severity: severityFilter ?? null,
      ruleId: ruleIdFilter ?? null,
      platform: platformFilter ?? null,
    },
    pagination: {
      requested_limit: requestedLimit ?? null,
      max_limit: MAX_FINDINGS_LIMIT,
      limit: limit ?? null,
      offset,
      ...(requestedLimit !== undefined
        ? { has_more: offset + findings.length < filteredFindings.length }
        : {}),
    },
    findings,
  };
};

const toResponsePayload = (evidence: AiEvidenceV2_1, requestUrl: URL): unknown => {
  if (includeSuppressedFromQuery(requestUrl)) {
    return evidence;
  }
  const { consolidation: _ignored, ...rest } = evidence;
  return rest;
};

const toStatusPayload = (repoRoot: string): unknown => {
  const readResult = readEvidenceResult(repoRoot);
  const evidencePath = resolve(repoRoot, '.ai_evidence.json');

  if (readResult.kind === 'missing') {
    return {
      status: 'degraded',
      context_api: CONTEXT_API_CAPABILITIES,
      evidence: {
        path: evidencePath,
        present: false,
        valid: false,
        version: null,
      },
    };
  }

  if (readResult.kind === 'invalid') {
    return {
      status: 'degraded',
      context_api: CONTEXT_API_CAPABILITIES,
      evidence: {
        path: evidencePath,
        present: true,
        valid: false,
        version: readResult.version ?? null,
      },
    };
  }

  const { evidence } = readResult;
  const sortedPlatforms = sortPlatforms(evidence.platforms);
  const detectedPlatformsCount = sortedPlatforms.filter((entry) => entry.detected).length;
  const suppressedFindingsCount = evidence.consolidation?.suppressed?.length ?? 0;
  const findingsWithLinesCount = toFindingsWithLinesCount(evidence.snapshot.findings);
  return {
    status: 'ok',
    context_api: CONTEXT_API_CAPABILITIES,
    evidence: {
      path: evidencePath,
      present: true,
      valid: true,
      version: evidence.version,
      timestamp: evidence.timestamp,
      stage: evidence.snapshot.stage,
      outcome: evidence.snapshot.outcome,
      has_findings: evidence.snapshot.findings.length > 0,
      findings_count: evidence.snapshot.findings.length,
      findings_files_count: toFindingsFilesCount(evidence.snapshot.findings),
      findings_rules_count: toFindingsRulesCount(evidence.snapshot.findings),
      findings_with_lines_count: findingsWithLinesCount,
      findings_without_lines_count: evidence.snapshot.findings.length - findingsWithLinesCount,
      severity_counts: toSeverityCounts(evidence.snapshot.findings),
      findings_by_platform: toFindingsByPlatform(evidence.snapshot.findings),
      highest_severity: toHighestSeverity(evidence.snapshot.findings),
      blocking_findings_count: toBlockingFindingsCount(evidence.snapshot.findings),
      ledger_count: evidence.ledger.length,
      ledger_files_count: toLedgerFilesCount(evidence.ledger),
      ledger_rules_count: toLedgerRulesCount(evidence.ledger),
      ledger_by_platform: toLedgerByPlatform(evidence.ledger),
      rulesets_count: evidence.rulesets.length,
      rulesets_platforms_count: toRulesetsPlatformsCount(evidence.rulesets),
      rulesets_bundles_count: toRulesetsBundlesCount(evidence.rulesets),
      rulesets_hashes_count: toRulesetsHashesCount(evidence.rulesets),
      rulesets_by_platform: toRulesetsByPlatform(evidence.rulesets),
      rulesets_fingerprint: toRulesetsFingerprint(evidence.rulesets),
      platform_confidence_counts: toPlatformConfidenceCounts(evidence.platforms),
      suppressed_findings_count: suppressedFindingsCount,
      suppressed_replacement_rules_count: toSuppressedReplacementRulesCount(evidence),
      suppressed_platforms_count: toSuppressedPlatformsCount(evidence),
      suppressed_files_count: toSuppressedFilesCount(evidence),
      suppressed_rules_count: toSuppressedRulesCount(evidence),
      suppressed_reasons_count: toSuppressedReasonsCount(evidence),
      suppressed_non_replacement_rules_count: toSuppressedNonReplacementRulesCount(evidence),
      suppressed_with_replacement_files_count: toSuppressedWithReplacementFilesCount(evidence),
      suppressed_with_replacement_files_ratio_pct: toSuppressedWithReplacementFilesRatioPct(evidence),
      suppressed_replacement_files_ratio_pct: toSuppressedReplacementFilesRatioPct(evidence),
      suppressed_with_replacement_platforms_ratio_pct: toSuppressedWithReplacementPlatformsRatioPct(evidence),
      suppressed_without_replacement_platforms_ratio_pct: toSuppressedWithoutReplacementPlatformsRatioPct(evidence),
      suppressed_non_replacement_platforms_ratio_pct: toSuppressedNonReplacementPlatformsRatioPct(evidence),
      suppressed_with_replacement_count: toSuppressedWithReplacementCount(evidence),
      suppressed_without_replacement_files_count: toSuppressedWithoutReplacementFilesCount(evidence),
      suppressed_without_replacement_files_ratio_pct: toSuppressedWithoutReplacementFilesRatioPct(evidence),
      suppressed_non_replacement_files_ratio_pct: toSuppressedNonReplacementFilesRatioPct(evidence),
      suppressed_with_replacement_ratio_pct: toSuppressedWithReplacementRatioPct(evidence),
      suppressed_reasons_with_replacement_ratio_pct: toSuppressedReasonsWithReplacementRatioPct(evidence),
      suppressed_reasons_without_replacement_ratio_pct: toSuppressedReasonsWithoutReplacementRatioPct(evidence),
      suppressed_finding_coverage_ratio_pct: toSuppressedFindingCoverageRatioPct(evidence),
      suppressed_reasons_coverage_ratio_pct: toSuppressedReasonsCoverageRatioPct(evidence),
      suppressed_replacement_rules_ratio_pct: toSuppressedReplacementRulesRatioPct(evidence),
      suppressed_non_replacement_rules_ratio_pct: toSuppressedNonReplacementRulesRatioPct(evidence),
      suppressed_replacement_platforms_ratio_pct: toSuppressedReplacementPlatformsRatioPct(evidence),
      suppressed_with_replacement_platforms_count: toSuppressedWithReplacementPlatformsCount(evidence),
      suppressed_without_replacement_platforms_count: toSuppressedWithoutReplacementPlatformsCount(evidence),
      suppressed_non_replacement_files_count: toSuppressedNonReplacementFilesCount(evidence),
      suppressed_without_replacement_count: toSuppressedWithoutReplacementCount(evidence),
      suppressed_non_replacement_ratio_pct: toSuppressedNonReplacementRatioPct(evidence),
      suppressed_without_replacement_ratio_pct: toSuppressedWithoutReplacementRatioPct(evidence),
      suppressed_rule_file_pairs_count: toSuppressedRuleFilePairsCount(evidence),
      suppressed_reasons_with_replacement_count: toSuppressedReasonsWithReplacementCount(evidence),
      suppressed_reasons_without_replacement_count: toSuppressedReasonsWithoutReplacementCount(evidence),
      suppressed_platform_rule_pairs_count: toSuppressedPlatformRulePairsCount(evidence),
      suppressed_platform_file_pairs_count: toSuppressedPlatformFilePairsCount(evidence),
      suppressed_replacement_rule_file_pairs_count: toSuppressedReplacementRuleFilePairsCount(evidence),
      suppressed_replacement_rule_platform_pairs_count: toSuppressedReplacementRulePlatformPairsCount(evidence),
      suppressed_replacement_platforms_count: toSuppressedReplacementPlatformsCount(evidence),
      suppressed_non_replacement_platforms_count: toSuppressedNonReplacementPlatformsCount(evidence),
      suppressed_non_replacement_reason_file_pairs_count: toSuppressedNonReplacementReasonFilePairsCount(evidence),
      suppressed_non_replacement_rule_file_pairs_count: toSuppressedNonReplacementRuleFilePairsCount(evidence),
      suppressed_non_replacement_rule_file_pairs_ratio_pct:
        toSuppressedNonReplacementRuleFilePairsRatioPct(evidence),
      suppressed_non_replacement_rule_platform_pairs_count: toSuppressedNonReplacementRulePlatformPairsCount(evidence),
      suppressed_non_replacement_reasons_count: toSuppressedNonReplacementReasonsCount(evidence),
      suppressed_replacement_reason_file_pairs_count: toSuppressedReplacementReasonFilePairsCount(evidence),
      suppressed_replacement_rule_reason_pairs_count: toSuppressedReplacementRuleReasonPairsCount(evidence),
      suppressed_replacement_rule_ids_count: toSuppressedReplacementRuleIdsCount(evidence),
      suppressed_replacement_reasons_count: toSuppressedReplacementReasonsCount(evidence),
      suppressed_replacement_rule_file_platform_triples_count:
        toSuppressedReplacementRuleFilePlatformTriplesCount(evidence),
      suppressed_non_replacement_rule_file_platform_triples_count:
        toSuppressedNonReplacementRuleFilePlatformTriplesCount(evidence),
      suppressed_reason_rule_file_triples_count:
        toSuppressedReasonRuleFileTriplesCount(evidence),
      suppressed_reason_rule_platform_triples_count:
        toSuppressedReasonRulePlatformTriplesCount(evidence),
      suppressed_reason_file_platform_triples_count:
        toSuppressedReasonFilePlatformTriplesCount(evidence),
      suppressed_reason_platform_pairs_count:
        toSuppressedReasonPlatformPairsCount(evidence),
      suppressed_reason_file_pairs_count:
        toSuppressedReasonFilePairsCount(evidence),
      suppressed_replacement_reason_platform_pairs_count:
        toSuppressedReplacementReasonPlatformPairsCount(evidence),
      suppressed_non_replacement_reason_platform_pairs_count:
        toSuppressedNonReplacementReasonPlatformPairsCount(evidence),
      suppressed_replacement_reason_rule_file_triples_count:
        toSuppressedReplacementReasonRuleFileTriplesCount(evidence),
      suppressed_non_replacement_reason_rule_file_triples_count:
        toSuppressedNonReplacementReasonRuleFileTriplesCount(evidence),
      suppressed_replacement_reason_rule_platform_triples_count:
        toSuppressedReplacementReasonRulePlatformTriplesCount(evidence),
      suppressed_non_replacement_reason_rule_platform_triples_count:
        toSuppressedNonReplacementReasonRulePlatformTriplesCount(evidence),
      suppressed_reason_rule_file_platform_quadruples_count:
        toSuppressedReasonRuleFilePlatformQuadruplesCount(evidence),
      suppressed_replacement_reason_rule_file_platform_quadruples_count:
        toSuppressedReplacementReasonRuleFilePlatformQuadruplesCount(evidence),
      suppressed_non_replacement_reason_rule_file_platform_quadruples_count:
        toSuppressedNonReplacementReasonRuleFilePlatformQuadruplesCount(evidence),
      suppressed_reason_rule_file_platform_replacement_split_count:
        toSuppressedReasonRuleFilePlatformReplacementSplitCount(evidence),
      suppressed_replacement_split_modes_count:
        toSuppressedReplacementSplitModesCount(evidence),
      suppressed_replacement_split_mode_replacement_count:
        toSuppressedReplacementSplitModeReplacementCount(evidence),
      suppressed_replacement_split_mode_non_replacement_count:
        toSuppressedReplacementSplitModeNonReplacementCount(evidence),
      suppressed_reason_rule_file_platform_replacement_dual_mode_count:
        toSuppressedReasonRuleFilePlatformReplacementDualModeCount(evidence),
      suppressed_replacement_rule_file_platform_distinct_count:
        toSuppressedReplacementRuleFilePlatformDistinctCount(evidence),
      suppressed_non_replacement_rule_file_platform_distinct_count:
        toSuppressedNonReplacementRuleFilePlatformDistinctCount(evidence),
      suppressed_rule_file_platform_distinct_total_count:
        toSuppressedRuleFilePlatformDistinctTotalCount(evidence),
      suppressed_replacement_rule_file_platform_share_of_total_pct:
        toSuppressedReplacementRuleFilePlatformShareOfTotalPct(evidence),
      suppressed_non_replacement_rule_file_platform_share_of_total_pct:
        toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct(evidence),
      suppressed_replacement_vs_non_replacement_share_gap_pct:
        toSuppressedReplacementVsNonReplacementShareGapPct(evidence),
      suppressed_replacement_rule_file_platform_dominance_pct:
        toSuppressedReplacementRuleFilePlatformDominancePct(evidence),
      suppressed_replacement_minus_non_replacement_share_signed_pct:
        toSuppressedReplacementMinusNonReplacementShareSignedPct(evidence),
      suppressed_non_replacement_rule_file_platform_dominance_pct:
        toSuppressedNonReplacementRuleFilePlatformDominancePct(evidence),
      suppressed_share_polarization_index_pct:
        toSuppressedSharePolarizationIndexPct(evidence),
      suppressed_share_balance_score_pct:
        toSuppressedShareBalanceScorePct(evidence),
      suppressed_share_imbalance_index_pct:
        toSuppressedShareImbalanceIndexPct(evidence),
      suppressed_share_polarization_balance_gap_pct:
        toSuppressedSharePolarizationBalanceGapPct(evidence),
      suppressed_share_net_polarity_pct:
        toSuppressedShareNetPolarityPct(evidence),
      suppressed_share_direction:
        toSuppressedShareDirection(evidence),
      suppressed_share_direction_confidence:
        toSuppressedShareDirectionConfidence(evidence),
      suppressed_share_direction_strength_bucket:
        toSuppressedShareDirectionStrengthBucket(evidence),
      suppressed_share_direction_strength_rank:
        toSuppressedShareDirectionStrengthRank(evidence),
      suppressed_share_direction_is_balanced:
        toSuppressedShareDirectionIsBalanced(evidence),
      suppressed_share_direction_label:
        toSuppressedShareDirectionLabel(evidence),
      suppressed_share_direction_code:
        toSuppressedShareDirectionCode(evidence),
      suppressed_share_direction_triage_hint:
        toSuppressedShareDirectionTriageHint(evidence),
      suppressed_share_direction_priority_score:
        toSuppressedShareDirectionPriorityScore(evidence),
      suppressed_share_triage_summary:
        toSuppressedShareTriageSummary(evidence),
      suppressed_share_triage_digest:
        toSuppressedShareTriageDigest(evidence),
      suppressed_share_triage_action:
        toSuppressedShareTriageAction(evidence),
      suppressed_share_triage_playbook:
        toSuppressedShareTriagePlaybook(evidence),
      suppressed_share_triage_priority_band:
        toSuppressedShareTriagePriorityBand(evidence),
      suppressed_share_triage_order:
        toSuppressedShareTriageOrder(evidence),
      suppressed_share_triage_primary_side:
        toSuppressedShareTriagePrimarySide(evidence),
      suppressed_share_triage_secondary_side:
        toSuppressedShareTriageSecondarySide(evidence),
      suppressed_share_triage_side_pair:
        toSuppressedShareTriageSidePair(evidence),
      suppressed_share_triage_side_alignment:
        toSuppressedShareTriageSideAlignment(evidence),
      suppressed_share_triage_focus_target:
        toSuppressedShareTriageFocusTarget(evidence),
      suppressed_share_triage_focus_order:
        toSuppressedShareTriageFocusOrder(evidence),
      suppressed_share_triage_focus_mode:
        toSuppressedShareTriageFocusMode(evidence),
      suppressed_share_triage_intensity:
        toSuppressedShareTriageIntensity(evidence),
      suppressed_share_triage_lane:
        toSuppressedShareTriageLane(evidence),
      suppressed_share_triage_route:
        toSuppressedShareTriageRoute(evidence),
      suppressed_share_triage_channel:
        toSuppressedShareTriageChannel(evidence),
      suppressed_share_triage_track:
        toSuppressedShareTriageTrack(evidence),
      suppressed_share_triage_stream:
        toSuppressedShareTriageStream(evidence),
      suppressed_share_triage_stream_class:
        toSuppressedShareTriageStreamClass(evidence),
      suppressed_share_triage_stream_rank:
        toSuppressedShareTriageStreamRank(evidence),
      suppressed_share_triage_stream_score:
        toSuppressedShareTriageStreamScore(evidence),
      suppressed_share_triage_stream_score_band:
        toSuppressedShareTriageStreamScoreBand(evidence),
      suppressed_share_triage_stream_signal:
        toSuppressedShareTriageStreamSignal(evidence),
      suppressed_share_triage_stream_signal_code:
        toSuppressedShareTriageStreamSignalCode(evidence),
      suppressed_share_triage_stream_signal_family:
        toSuppressedShareTriageStreamSignalFamily(evidence),
      suppressed_share_triage_stream_signal_family_code:
        toSuppressedShareTriageStreamSignalFamilyCode(evidence),
      suppressed_share_triage_stream_signal_family_rank:
        toSuppressedShareTriageStreamSignalFamilyRank(evidence),
      suppressed_share_triage_stream_signal_family_weight:
        toSuppressedShareTriageStreamSignalFamilyWeight(evidence),
      suppressed_share_triage_stream_signal_family_bucket:
        toSuppressedShareTriageStreamSignalFamilyBucket(evidence),
      suppressed_share_triage_stream_signal_family_digest:
        toSuppressedShareTriageStreamSignalFamilyDigest(evidence),
      suppressed_share_triage_stream_signal_family_digest_code:
        toSuppressedShareTriageStreamSignalFamilyDigestCode(evidence),
      suppressed_share_triage_stream_signal_family_trace:
        toSuppressedShareTriageStreamSignalFamilyTrace(evidence),
      suppressed_share_triage_stream_signal_family_trace_code:
        toSuppressedShareTriageStreamSignalFamilyTraceCode(evidence),
      suppressed_share_triage_stream_signal_family_trace_hash:
        toSuppressedShareTriageStreamSignalFamilyTraceHash(evidence),
      suppressed_share_triage_stream_signal_family_trace_hash_code:
        toSuppressedShareTriageStreamSignalFamilyTraceHashCode(evidence),
      suppressed_share_triage_stream_signal_family_trace_hash_bucket:
        toSuppressedShareTriageStreamSignalFamilyTraceHashBucket(evidence),
      suppressed_share_triage_stream_signal_family_trace_hash_rank:
        toSuppressedShareTriageStreamSignalFamilyTraceHashRank(evidence),
      suppressed_share_triage_stream_signal_family_trace_hash_weight:
        toSuppressedShareTriageStreamSignalFamilyTraceHashWeight(evidence),
      tracked_platforms_count: sortedPlatforms.length,
      detected_platforms_count: detectedPlatformsCount,
      non_detected_platforms_count: sortedPlatforms.length - detectedPlatformsCount,
      platforms: Object.keys(evidence.platforms).sort(),
    },
  };
};

export const startEvidenceContextServer = (options: EvidenceServerOptions = {}) => {
  const host = options.host ?? '127.0.0.1';
  const port = options.port ?? 7341;
  const route = normalizeRoute(options.route ?? DEFAULT_ROUTE);
  const repoRoot = options.repoRoot ?? process.cwd();
  const summaryRoute = `${route}/summary`;
  const rulesetsRoute = `${route}/rulesets`;
  const platformsRoute = `${route}/platforms`;
  const ledgerRoute = `${route}/ledger`;
  const snapshotRoute = `${route}/snapshot`;
  const findingsRoute = `${route}/findings`;

  const server = createServer((req, res) => {
    const method = req.method ?? 'GET';
    const rawUrl = req.url ?? '/';
    const requestUrl = new URL(rawUrl, `http://${req.headers.host ?? '127.0.0.1'}`);
    const path = requestUrl.pathname;

    if (method === 'GET' && path === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(json({ status: 'ok' }));
      return;
    }

    if (method === 'GET' && path === '/status') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(json(toStatusPayload(repoRoot)));
      return;
    }

    if (method === 'GET' && path === route) {
      const evidence = readEvidence(repoRoot);
      if (!evidence) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(json({ error: '.ai_evidence.json not found or invalid v2.1 file' }));
        return;
      }

      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(json(toResponsePayload(evidence, requestUrl)));
      return;
    }

    if (method === 'GET' && path === summaryRoute) {
      const evidence = readEvidence(repoRoot);
      if (!evidence) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(json({ error: '.ai_evidence.json not found or invalid v2.1 file' }));
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(json(toSummaryPayload(evidence)));
      return;
    }

    if (method === 'GET' && path === rulesetsRoute) {
      const evidence = readEvidence(repoRoot);
      if (!evidence) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(json({ error: '.ai_evidence.json not found or invalid v2.1 file' }));
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(json(toRulesetsPayload(evidence, requestUrl)));
      return;
    }

    if (method === 'GET' && path === platformsRoute) {
      const evidence = readEvidence(repoRoot);
      if (!evidence) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(json({ error: '.ai_evidence.json not found or invalid v2.1 file' }));
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(json(toPlatformsPayload(evidence, requestUrl)));
      return;
    }

    if (method === 'GET' && path === ledgerRoute) {
      const evidence = readEvidence(repoRoot);
      if (!evidence) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(json({ error: '.ai_evidence.json not found or invalid v2.1 file' }));
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      const hasLedgerFilters =
        requestUrl.searchParams.has('lastSeenAfter') ||
        requestUrl.searchParams.has('lastSeenBefore') ||
        requestUrl.searchParams.has('limit') ||
        requestUrl.searchParams.has('offset');
      res.end(json(hasLedgerFilters ? toLedgerPayloadWithFilters(evidence, requestUrl) : toLedgerPayload(evidence)));
      return;
    }

    if (method === 'GET' && path === snapshotRoute) {
      const evidence = readEvidence(repoRoot);
      if (!evidence) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(json({ error: '.ai_evidence.json not found or invalid v2.1 file' }));
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(json(toSnapshotPayload(evidence)));
      return;
    }

    if (method === 'GET' && path === findingsRoute) {
      const evidence = readEvidence(repoRoot);
      if (!evidence) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(json({ error: '.ai_evidence.json not found or invalid v2.1 file' }));
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(json(toFindingsPayload(evidence, requestUrl)));
      return;
    }

    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(json({ error: 'Not found' }));
  });

  server.listen(port, host);
  return {
    server,
    host,
    port,
    route,
  };
};
