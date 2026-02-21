import type { Severity } from '../../core/rules/Severity';

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
};

type PlatformSummaryFinding = {
  ruleId: string;
  severity: Severity;
  file: string;
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

const detectPlatformByRuleId = (ruleId: string): LegacyPlatformName | undefined => {
  const normalized = ruleId.toLowerCase();
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
  if (normalized.startsWith('heuristics.ts.')) {
    return 'Backend';
  }
  return undefined;
};

const detectPlatform = (filePath: string, ruleId: string): LegacyPlatformName => {
  const normalized = filePath.toLowerCase();
  if (normalized.startsWith('apps/ios/') || normalized.endsWith('.swift')) {
    return 'iOS';
  }
  if (
    normalized.startsWith('apps/android/')
    || normalized.endsWith('.kt')
    || normalized.endsWith('.kts')
  ) {
    return 'Android';
  }
  if (normalized.startsWith('apps/backend/')) {
    return 'Backend';
  }
  if (
    normalized.startsWith('apps/web/')
    || normalized.startsWith('apps/frontend/')
    || normalized.endsWith('.tsx')
    || normalized.endsWith('.jsx')
  ) {
    return 'Frontend';
  }
  const rulePlatform = detectPlatformByRuleId(ruleId);
  return rulePlatform ?? 'Other';
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
  findings: ReadonlyArray<PlatformSummaryFinding>
): SnapshotPlatformSummary[] => {
  const byPlatform = new Map<LegacyPlatformName, PlatformSummaryFinding[]>();
  for (const platform of PLATFORM_ORDER) {
    byPlatform.set(platform, []);
  }

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
      files.add(finding.file);
    }
    return {
      platform,
      files_affected: files.size,
      by_severity: bySeverity,
      top_violations: countTopViolations(platformFindings),
    };
  });
};
