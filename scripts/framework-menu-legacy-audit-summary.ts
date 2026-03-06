import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  LegacyAuditSummary,
} from './framework-menu-legacy-audit-types';
import type { LegacyAuditEvidencePayload } from './framework-menu-legacy-audit-summary-types';
import {
  asFindings,
  asRulesets,
  asString,
  computeLegacySeverity,
  emptyLegacySeverity,
  toNormalizedFindings,
} from './framework-menu-legacy-audit-summary-normalize';
import {
  buildPlatformSummaries,
  buildRulesetSummaries,
  parseSnapshotPlatformSummaries,
} from './framework-menu-legacy-audit-summary-platforms';
import {
  buildTopFindings,
  countFiles,
  countViolations,
} from './framework-menu-legacy-audit-summary-ranked';
import {
  computeCodeHealthScore,
  computeEslintCounts,
  computePatternChecks,
} from './framework-menu-legacy-audit-summary-metrics';

const EVIDENCE_PATH = '.ai_evidence.json';

const emptySummary = (status: 'missing' | 'invalid', stage: string, outcome: string, codeHealthScore: number): LegacyAuditSummary => ({
  status,
  stage,
  outcome,
  totalViolations: 0,
  filesScanned: 0,
  filesAffected: 0,
  bySeverity: emptyLegacySeverity(),
  patternChecks: { todoFixme: 0, consoleLog: 0, anyType: 0, sqlRaw: 0 },
  eslint: { errors: 0, warnings: 0 },
  platforms: [],
  rulesets: [],
  topViolations: [],
  topFiles: [],
  topFileLocations: [],
  topFindings: [],
  codeHealthScore,
});

export const readLegacyAuditSummary = (repoRoot: string = process.cwd()): LegacyAuditSummary => {
  const evidencePath = join(repoRoot, EVIDENCE_PATH);
  if (!existsSync(evidencePath)) {
    return emptySummary('missing', 'unknown', 'unknown', 100);
  }

  try {
    const parsed = JSON.parse(readFileSync(evidencePath, 'utf8')) as LegacyAuditEvidencePayload;
    const normalizedFindings = toNormalizedFindings(
      asFindings(parsed.snapshot?.findings),
      repoRoot
    );
    const availableBundles = asRulesets(parsed.rulesets)
      .map((ruleset) => asString(ruleset.bundle, ''))
      .filter((bundle) => bundle.length > 0);
    const files = new Set(normalizedFindings.map((finding) => finding.file));
    const declaredFilesScanned = Number(parsed.snapshot?.files_scanned ?? parsed.snapshot?.filesScanned);
    const filesScanned = Number.isFinite(declaredFilesScanned)
      ? Math.max(0, Math.trunc(declaredFilesScanned))
      : files.size;
    const declaredFilesAffected = Number(
      parsed.snapshot?.files_affected ?? parsed.snapshot?.filesAffected
    );
    const filesAffected = Number.isFinite(declaredFilesAffected)
      ? Math.max(0, Math.trunc(declaredFilesAffected))
      : files.size;
    const bySeverity = computeLegacySeverity(normalizedFindings, parsed.severity_metrics);
    const totalViolations = normalizedFindings.length;
    const snapshotPlatforms = parseSnapshotPlatformSummaries(parsed.snapshot?.platforms);
    const topFilesWithLocations = countFiles(normalizedFindings).slice(0, 10);
    return {
      status: 'ok',
      stage: asString(parsed.snapshot?.stage, 'unknown'),
      outcome: asString(parsed.snapshot?.outcome, 'unknown'),
      totalViolations,
      filesScanned,
      filesAffected,
      bySeverity,
      patternChecks: computePatternChecks(normalizedFindings),
      eslint: computeEslintCounts(normalizedFindings),
      platforms: snapshotPlatforms.length > 0
        ? snapshotPlatforms
        : buildPlatformSummaries(normalizedFindings),
      rulesets: buildRulesetSummaries(normalizedFindings, availableBundles),
      topViolations: countViolations(normalizedFindings).slice(0, 7),
      topFiles: topFilesWithLocations.map((entry) => ({ file: entry.file, count: entry.count })),
      topFileLocations: topFilesWithLocations.map((entry) => ({ file: entry.file, line: entry.line })),
      topFindings: buildTopFindings(normalizedFindings, 10),
      codeHealthScore: computeCodeHealthScore(bySeverity, filesScanned, totalViolations),
    };
  } catch {
    return emptySummary('invalid', 'invalid', 'invalid', 0);
  }
};
