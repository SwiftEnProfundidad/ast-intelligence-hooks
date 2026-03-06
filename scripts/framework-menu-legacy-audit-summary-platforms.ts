import { buildSnapshotPlatformSummaries } from '../integrations/evidence/platformSummary';
import type {
  LegacySeverity,
  PlatformName,
  PlatformSummary,
  RulesetSummary,
} from './framework-menu-legacy-audit-types';
import type { NormalizedFinding } from './framework-menu-legacy-audit-summary-types';
import {
  asNonNegativeInt,
  asPlatformName,
  asString,
  emptyLegacySeverity,
  mapLegacySeverity,
} from './framework-menu-legacy-audit-summary-normalize';

export const parseSnapshotPlatformSummaries = (value: unknown): PlatformSummary[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const order: ReadonlyArray<PlatformName> = ['iOS', 'Android', 'Backend', 'Frontend', 'Other'];
  const byPlatform = new Map<PlatformName, PlatformSummary>();
  for (const platform of order) {
    byPlatform.set(platform, {
      platform,
      filesAffected: 0,
      bySeverity: emptyLegacySeverity(),
      topViolations: [],
    });
  }

  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) {
      continue;
    }
    const current = entry as {
      platform?: unknown;
      files_affected?: unknown;
      by_severity?: unknown;
      top_violations?: unknown;
    };
    const platform = asPlatformName(current.platform);
    if (!platform) {
      continue;
    }
    const bySeverityRaw =
      typeof current.by_severity === 'object' && current.by_severity !== null
        ? current.by_severity as Record<string, unknown>
        : {};
    const topViolations = Array.isArray(current.top_violations)
      ? current.top_violations
        .map((item) => {
          if (typeof item !== 'object' || item === null) {
            return null;
          }
          const row = item as { rule_id?: unknown; count?: unknown };
          const ruleId = typeof row.rule_id === 'string' ? row.rule_id : '';
          if (ruleId.length === 0) {
            return null;
          }
          return {
            ruleId,
            count: asNonNegativeInt(row.count),
          };
        })
        .filter((item): item is { ruleId: string; count: number } => item !== null)
      : [];
    byPlatform.set(platform, {
      platform,
      filesAffected: asNonNegativeInt(current.files_affected),
      bySeverity: {
        CRITICAL: asNonNegativeInt(bySeverityRaw.CRITICAL),
        HIGH: asNonNegativeInt(bySeverityRaw.HIGH),
        MEDIUM: asNonNegativeInt(bySeverityRaw.MEDIUM),
        LOW: asNonNegativeInt(bySeverityRaw.LOW),
      },
      topViolations,
    });
  }

  return order.map((platform) => byPlatform.get(platform) ?? {
    platform,
    filesAffected: 0,
    bySeverity: emptyLegacySeverity(),
    topViolations: [],
  });
};

const inferRulesetBundle = (
  ruleId: string,
  availableBundles: ReadonlyArray<string>
): string => {
  const findBundle = (predicate: (bundle: string) => boolean): string | null => {
    const match = availableBundles.find(predicate);
    return typeof match === 'string' && match.length > 0 ? match : null;
  };

  const normalized = ruleId.toLowerCase();
  if (normalized.startsWith('heuristics.')) {
    return findBundle((bundle) => bundle.startsWith('astHeuristicsRuleSet@'))
      ?? 'astHeuristicsRuleSet (inferred)';
  }
  if (normalized.startsWith('ios.')) {
    return findBundle((bundle) => bundle.startsWith('iosEnterpriseRuleSet@'))
      ?? 'iosEnterpriseRuleSet (inferred)';
  }
  if (normalized.startsWith('android.')) {
    return findBundle((bundle) => bundle.startsWith('androidRuleSet@'))
      ?? 'androidRuleSet (inferred)';
  }
  if (normalized.startsWith('backend.')) {
    return findBundle((bundle) => bundle.startsWith('backendRuleSet@'))
      ?? 'backendRuleSet (inferred)';
  }
  if (normalized.startsWith('frontend.')) {
    return findBundle((bundle) => bundle.startsWith('frontendRuleSet@'))
      ?? 'frontendRuleSet (inferred)';
  }
  if (normalized.startsWith('skills.ios.')) {
    return findBundle((bundle) => bundle.startsWith('ios-') && bundle.includes('guidelines@'))
      ?? 'ios-guidelines (inferred)';
  }
  if (normalized.startsWith('skills.android.')) {
    return findBundle((bundle) => bundle.startsWith('android-guidelines@'))
      ?? 'android-guidelines (inferred)';
  }
  if (normalized.startsWith('skills.backend.')) {
    return findBundle((bundle) => bundle.startsWith('backend-guidelines@'))
      ?? 'backend-guidelines (inferred)';
  }
  if (normalized.startsWith('skills.frontend.')) {
    return findBundle((bundle) => bundle.startsWith('frontend-guidelines@'))
      ?? 'frontend-guidelines (inferred)';
  }
  if (normalized.startsWith('methodology.') || normalized.startsWith('project.')) {
    return findBundle((bundle) => bundle === 'project-rules') ?? 'project-rules (inferred)';
  }
  return 'unknown-ruleset';
};

export const buildRulesetSummaries = (
  findings: ReadonlyArray<NormalizedFinding>,
  availableBundles: ReadonlyArray<string>
): ReadonlyArray<RulesetSummary> => {
  const bucket = new Map<string, { findings: number; bySeverity: Record<LegacySeverity, number> }>();
  for (const finding of findings) {
    const bundle = inferRulesetBundle(finding.ruleId, availableBundles);
    const current = bucket.get(bundle) ?? {
      findings: 0,
      bySeverity: emptyLegacySeverity(),
    };
    current.findings += 1;
    current.bySeverity[mapLegacySeverity(finding.severity)] += 1;
    bucket.set(bundle, current);
  }
  return [...bucket.entries()]
    .sort((left, right) => right[1].findings - left[1].findings || left[0].localeCompare(right[0]))
    .map(([bundle, entry]) => ({
      bundle,
      findings: entry.findings,
      bySeverity: entry.bySeverity,
    }));
};

export const buildPlatformSummaries = (
  findings: ReadonlyArray<NormalizedFinding>
): ReadonlyArray<PlatformSummary> => {
  return buildSnapshotPlatformSummaries(
    findings.map((finding) => ({
      ruleId: finding.ruleId,
      severity: finding.severity,
      file: finding.file,
    }))
  ).map((platform) => ({
    platform: platform.platform,
    filesAffected: platform.files_affected,
    bySeverity: platform.by_severity,
    topViolations: platform.top_violations
      .map((violation) => ({ ruleId: violation.rule_id, count: violation.count }))
      .slice(0, 5),
  }));
};
