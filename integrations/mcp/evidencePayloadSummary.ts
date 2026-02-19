import type { AiEvidenceV2_1 } from '../evidence/schema';
import {
  sortPlatforms,
  toBlockingFindingsCount,
  toFindingsByPlatform,
  toFindingsFilesCount,
  toFindingsRulesCount,
  toFindingsWithLinesCount,
  toHighestSeverity,
  toLedgerByPlatform,
  toLedgerFilesCount,
  toLedgerRulesCount,
  toPlatformConfidenceCounts,
  toRulesetsBundlesCount,
  toRulesetsByPlatform,
  toRulesetsFingerprint,
  toRulesetsHashesCount,
  toRulesetsPlatformsCount,
  toSeverityCounts,
} from './evidenceFacets';
import { toSuppressedSummaryFields } from './evidencePayloadSummarySuppressed';

export const toSummaryPayload = (evidence: AiEvidenceV2_1) => {
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
    ...toSuppressedSummaryFields(evidence),
    tracked_platforms_count: sortedPlatforms.length,
    detected_platforms_count: detectedPlatforms.length,
    non_detected_platforms_count: sortedPlatforms.length - detectedPlatforms.length,
    platforms: detectedPlatforms,
  };
};
