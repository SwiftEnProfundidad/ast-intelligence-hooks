import type { Severity } from '../../core/rules/Severity';
import { listSkillsDetectorBindings } from '../config/skillsDetectorRegistry';
import { loadSkillsLock, type SkillsCompiledRule } from '../config/skillsLock';

export type LegacyPlatformName = 'iOS' | 'Android' | 'Backend' | 'Frontend' | 'Other';
export type LegacySeverityBand = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type SnapshotPlatformTopViolation = {
  rule_id: string;
  count: number;
};

export type SnapshotPlatformSummary = {
  platform: LegacyPlatformName;
  files_affected: number;
  by_severity: Record<LegacySeverityBand, number>;
  top_violations: SnapshotPlatformTopViolation[];
  active_rules?: number;
  evaluated_rules?: number;
};

type PlatformSummaryFinding = {
  ruleId: string;
  severity: Severity;
  file: string;
};

type PlatformRuleIndex = {
  byRuleId: Map<string, Set<LegacyPlatformName>>;
  byHeuristicRuleId: Map<string, Set<LegacyPlatformName>>;
};

type PlatformSummaryOptions = {
  activeRuleIds?: ReadonlyArray<string>;
  evaluatedRuleIds?: ReadonlyArray<string>;
};

const PLATFORM_ORDER: ReadonlyArray<LegacyPlatformName> = [
  'iOS',
  'Android',
  'Backend',
  'Frontend',
  'Other',
];

const emptyLegacySeverity = (): Record<LegacySeverityBand, number> => ({
  CRITICAL: 0,
  HIGH: 0,
  MEDIUM: 0,
  LOW: 0,
});

const toLegacySeverity = (severity: Severity): LegacySeverityBand => {
  if (severity === 'CRITICAL') {
    return 'CRITICAL';
  }
  if (severity === 'ERROR') {
    return 'HIGH';
  }
  if (severity === 'WARN') {
    return 'MEDIUM';
  }
  return 'LOW';
};

const normalizePath = (filePath: string): string => filePath.replace(/\\/g, '/').trim();

const normalizeRuleId = (ruleId: string): string => ruleId.trim().toLowerCase();

const hasPathSegment = (filePath: string, segment: string): boolean => {
  const normalized = filePath.toLowerCase();
  const token = `/${segment.toLowerCase()}/`;
  return (
    normalized === segment.toLowerCase()
    || normalized.startsWith(`${segment.toLowerCase()}/`)
    || normalized.endsWith(`/${segment.toLowerCase()}`)
    || normalized.includes(token)
  );
};

const toLegacyPlatform = (platform: SkillsCompiledRule['platform']): LegacyPlatformName => {
  if (platform === 'ios') {
    return 'iOS';
  }
  if (platform === 'android') {
    return 'Android';
  }
  if (platform === 'backend') {
    return 'Backend';
  }
  if (platform === 'frontend') {
    return 'Frontend';
  }
  return 'Other';
};

const addPlatform = (
  bucket: Map<string, Set<LegacyPlatformName>>,
  ruleId: string,
  platform: LegacyPlatformName
): void => {
  const normalized = normalizeRuleId(ruleId);
  const current = bucket.get(normalized) ?? new Set<LegacyPlatformName>();
  current.add(platform);
  bucket.set(normalized, current);
};

const buildPlatformRuleIndex = (): PlatformRuleIndex => {
  const byRuleId = new Map<string, Set<LegacyPlatformName>>();
  const byHeuristicRuleId = new Map<string, Set<LegacyPlatformName>>();
  const lock = loadSkillsLock();

  for (const bundle of lock?.bundles ?? []) {
    for (const rule of bundle.rules) {
      const platform = toLegacyPlatform(rule.platform);
      addPlatform(byRuleId, rule.id, platform);
    }
  }

  const directRulePlatforms = new Map<string, LegacyPlatformName>();
  for (const [ruleId, platforms] of byRuleId.entries()) {
    if (platforms.size === 1) {
      directRulePlatforms.set(ruleId, [...platforms][0] ?? 'Other');
    }
  }

  for (const { ruleId, binding } of listSkillsDetectorBindings()) {
    const platform = directRulePlatforms.get(normalizeRuleId(ruleId)) ?? detectPlatformByRuleId(ruleId);
    if (!platform || platform === 'Other') {
      continue;
    }
    addPlatform(byRuleId, ruleId, platform);
    for (const heuristicRuleId of binding.mappedHeuristicRuleIds) {
      addPlatform(byHeuristicRuleId, heuristicRuleId, platform);
    }
  }

  return { byRuleId, byHeuristicRuleId };
};

let cachedPlatformRuleIndex: PlatformRuleIndex | undefined;

const getPlatformRuleIndex = (): PlatformRuleIndex => {
  cachedPlatformRuleIndex ??= buildPlatformRuleIndex();
  return cachedPlatformRuleIndex;
};

const detectPlatformByRuleId = (ruleId: string): LegacyPlatformName | undefined => {
  const normalized = normalizeRuleId(ruleId);
  if (
    normalized === 'heuristics.ts.inner-html.ast'
    || normalized === 'heuristics.ts.document-write.ast'
    || normalized === 'heuristics.ts.insert-adjacent-html.ast'
  ) {
    return 'Frontend';
  }
  if (
    normalized.startsWith('ios.')
    || normalized.startsWith('skills.ios.')
    || normalized.startsWith('heuristics.ios.')
  ) {
    return 'iOS';
  }
  if (
    normalized.startsWith('android.')
    || normalized.startsWith('skills.android.')
    || normalized.startsWith('heuristics.android.')
  ) {
    return 'Android';
  }
  if (
    normalized.startsWith('backend.')
    || normalized.startsWith('skills.backend.')
    || normalized.startsWith('heuristics.backend.')
    || normalized.includes('.backend.')
  ) {
    return 'Backend';
  }
  if (
    normalized.startsWith('frontend.')
    || normalized.startsWith('skills.frontend.')
    || normalized.startsWith('heuristics.frontend.')
    || normalized.includes('.frontend.')
  ) {
    return 'Frontend';
  }
  return undefined;
};

const detectPlatformByPath = (filePath: string): LegacyPlatformName | undefined => {
  const normalized = normalizePath(filePath).toLowerCase();
  if (
    normalized.startsWith('apps/ios/')
    || hasPathSegment(normalized, 'ios')
    || normalized.endsWith('/ios.ts')
    || normalized.endsWith('/ios.js')
    || normalized.includes('iosswift')
    || normalized.includes('swiftui')
    || normalized.endsWith('.swift')
  ) {
    return 'iOS';
  }
  if (
    normalized.startsWith('apps/android/')
    || hasPathSegment(normalized, 'android')
    || normalized.endsWith('/android.ts')
    || normalized.endsWith('/android.js')
    || normalized.endsWith('.kt')
    || normalized.endsWith('.kts')
  ) {
    return 'Android';
  }
  if (normalized.startsWith('apps/backend/') || hasPathSegment(normalized, 'backend')) {
    return 'Backend';
  }
  if (
    normalized.startsWith('apps/web/')
    || normalized.startsWith('apps/frontend/')
    || hasPathSegment(normalized, 'web')
    || hasPathSegment(normalized, 'frontend')
    || normalized.endsWith('.tsx')
    || normalized.endsWith('.jsx')
  ) {
    return 'Frontend';
  }
  return undefined;
};

const choosePlatformFromCandidates = (
  candidates: ReadonlySet<LegacyPlatformName> | undefined,
  pathPlatform: LegacyPlatformName | undefined
): LegacyPlatformName | undefined => {
  if (!candidates || candidates.size === 0) {
    return undefined;
  }
  if (candidates.size === 1) {
    return [...candidates][0];
  }
  if (pathPlatform && candidates.has(pathPlatform)) {
    return pathPlatform;
  }
  return undefined;
};

const detectPlatform = (filePath: string, ruleId: string): LegacyPlatformName => {
  const index = getPlatformRuleIndex();
  const normalizedRuleId = normalizeRuleId(ruleId);
  const pathPlatform = detectPlatformByPath(filePath);
  const directPlatform = choosePlatformFromCandidates(index.byRuleId.get(normalizedRuleId), pathPlatform);
  if (directPlatform) {
    return directPlatform;
  }

  const heuristicPlatform = choosePlatformFromCandidates(
    index.byHeuristicRuleId.get(normalizedRuleId),
    pathPlatform
  );
  if (heuristicPlatform) {
    return heuristicPlatform;
  }

  const rulePlatform = detectPlatformByRuleId(ruleId);
  return rulePlatform ?? pathPlatform ?? 'Other';
};

const detectRuleCoveragePlatform = (ruleId: string): LegacyPlatformName => {
  const index = getPlatformRuleIndex();
  const normalizedRuleId = normalizeRuleId(ruleId);
  const directPlatform = choosePlatformFromCandidates(index.byRuleId.get(normalizedRuleId), undefined);
  if (directPlatform) {
    return directPlatform;
  }
  const heuristicPlatform = choosePlatformFromCandidates(
    index.byHeuristicRuleId.get(normalizedRuleId),
    undefined
  );
  if (heuristicPlatform) {
    return heuristicPlatform;
  }
  return detectPlatformByRuleId(ruleId) ?? 'Other';
};

const countRuleCoverageByPlatform = (
  ruleIds: ReadonlyArray<string> | undefined
): Map<LegacyPlatformName, number> => {
  const counts = new Map<LegacyPlatformName, number>();
  for (const platform of PLATFORM_ORDER) {
    counts.set(platform, 0);
  }
  for (const ruleId of ruleIds ?? []) {
    const platform = detectRuleCoveragePlatform(ruleId);
    counts.set(platform, (counts.get(platform) ?? 0) + 1);
  }
  return counts;
};

const countTopViolations = (
  findings: ReadonlyArray<PlatformSummaryFinding>
): SnapshotPlatformTopViolation[] => {
  const bucket = new Map<string, number>();
  for (const finding of findings) {
    bucket.set(finding.ruleId, (bucket.get(finding.ruleId) ?? 0) + 1);
  }
  return [...bucket.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([rule_id, count]) => ({ rule_id, count }))
    .slice(0, 7);
};

export const buildSnapshotPlatformSummaries = (
  findings: ReadonlyArray<PlatformSummaryFinding>,
  options: PlatformSummaryOptions = {}
): SnapshotPlatformSummary[] => {
  const byPlatform = new Map<LegacyPlatformName, PlatformSummaryFinding[]>();
  for (const platform of PLATFORM_ORDER) {
    byPlatform.set(platform, []);
  }
  const activeRuleCounts = countRuleCoverageByPlatform(options.activeRuleIds);
  const evaluatedRuleCounts = countRuleCoverageByPlatform(options.evaluatedRuleIds);

  for (const finding of findings) {
    const platform = detectPlatform(finding.file, finding.ruleId);
    byPlatform.get(platform)?.push(finding);
  }

  return PLATFORM_ORDER.map((platform) => {
    const platformFindings = byPlatform.get(platform) ?? [];
    const bySeverity = emptyLegacySeverity();
    const files = new Set<string>();
    for (const finding of platformFindings) {
      bySeverity[toLegacySeverity(finding.severity)] += 1;
      files.add(normalizePath(finding.file));
    }
    return {
      platform,
      files_affected: files.size,
      by_severity: bySeverity,
      top_violations: countTopViolations(platformFindings),
      active_rules: activeRuleCounts.get(platform) ?? 0,
      evaluated_rules: evaluatedRuleCounts.get(platform) ?? 0,
    };
  });
};
