import { resolve } from 'node:path';
import type { AiEvidenceV2_1 } from '../evidence/schema';
import { readEvidenceResult, readEvidence } from '../evidence/readEvidence';
export type { EvidenceReadResult } from '../evidence/readEvidence';
import {
  inferPlatformFromFilePath,
  severityRank,
  sortPlatforms,
  sortRulesets,
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
  toSuppressedFilesCount,
  toSuppressedFindingCoverageRatioPct,
  toSuppressedNonReplacementFilesCount,
  toSuppressedNonReplacementFilesRatioPct,
  toSuppressedNonReplacementPlatformsCount,
  toSuppressedNonReplacementPlatformsRatioPct,
  toSuppressedNonReplacementRatioPct,
  toSuppressedNonReplacementReasonFilePairsCount,
  toSuppressedNonReplacementReasonPlatformPairsCount,
  toSuppressedNonReplacementReasonRuleFilePlatformQuadruplesCount,
  toSuppressedNonReplacementReasonRuleFileTriplesCount,
  toSuppressedNonReplacementReasonRulePlatformTriplesCount,
  toSuppressedNonReplacementRuleFilePairsCount,
  toSuppressedNonReplacementRuleFilePairsRatioPct,
  toSuppressedNonReplacementRuleFilePlatformDistinctCount,
  toSuppressedNonReplacementRuleFilePlatformDominancePct,
  toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct,
  toSuppressedNonReplacementRuleFilePlatformTriplesCount,
  toSuppressedNonReplacementRulePlatformPairsCount,
  toSuppressedNonReplacementRulePlatformPairsRatioPct,
  toSuppressedNonReplacementReasonsCount,
  toSuppressedNonReplacementRulesCount,
  toSuppressedNonReplacementRulesRatioPct,
  toSuppressedPlatformFilePairsCount,
  toSuppressedPlatformRulePairsCount,
  toSuppressedPlatformsCount,
  toSuppressedReasonFilePairsCount,
  toSuppressedReasonFilePlatformTriplesCount,
  toSuppressedReasonPlatformPairsCount,
  toSuppressedReasonRuleFilePlatformQuadruplesCount,
  toSuppressedReasonRuleFilePlatformReplacementDualModeCount,
  toSuppressedReasonRuleFilePlatformReplacementSplitCount,
  toSuppressedReasonRuleFileTriplesCount,
  toSuppressedReasonRulePlatformTriplesCount,
  toSuppressedReasonsCount,
  toSuppressedReasonsCoverageRatioPct,
  toSuppressedReasonsWithReplacementCount,
  toSuppressedReasonsWithReplacementRatioPct,
  toSuppressedReasonsWithoutReplacementCount,
  toSuppressedReasonsWithoutReplacementRatioPct,
  toSuppressedReplacementFilesRatioPct,
  toSuppressedReplacementMinusNonReplacementShareSignedPct,
  toSuppressedReplacementPlatformsCount,
  toSuppressedReplacementPlatformsRatioPct,
  toSuppressedReplacementReasonFilePairsCount,
  toSuppressedReplacementReasonPlatformPairsCount,
  toSuppressedReplacementReasonRuleFilePlatformQuadruplesCount,
  toSuppressedReplacementReasonRuleFileTriplesCount,
  toSuppressedReplacementReasonRulePlatformTriplesCount,
  toSuppressedReplacementRuleFilePairsCount,
  toSuppressedReplacementRuleFilePairsRatioPct,
  toSuppressedReplacementRuleFilePlatformDistinctCount,
  toSuppressedReplacementRuleFilePlatformDominancePct,
  toSuppressedReplacementRuleFilePlatformShareOfTotalPct,
  toSuppressedReplacementRuleFilePlatformTriplesCount,
  toSuppressedReplacementRuleIdsCount,
  toSuppressedReplacementRulePlatformPairsCount,
  toSuppressedReplacementRulePlatformPairsRatioPct,
  toSuppressedReplacementRuleReasonPairsCount,
  toSuppressedReplacementReasonsCount,
  toSuppressedReplacementRulesCount,
  toSuppressedReplacementRulesRatioPct,
  toSuppressedReplacementSplitModeNonReplacementCount,
  toSuppressedReplacementSplitModeReplacementCount,
  toSuppressedReplacementSplitModesCount,
  toSuppressedReplacementVsNonReplacementShareGapPct,
  toSuppressedRuleFilePairsCount,
  toSuppressedRuleFilePlatformDistinctTotalCount,
  toSuppressedRulesCount,
  toSuppressedShareBalanceScorePct,
  toSuppressedShareDirection,
  toSuppressedShareDirectionCode,
  toSuppressedShareDirectionConfidence,
  toSuppressedShareDirectionIsBalanced,
  toSuppressedShareDirectionLabel,
  toSuppressedShareDirectionPriorityScore,
  toSuppressedShareDirectionStrengthBucket,
  toSuppressedShareDirectionStrengthRank,
  toSuppressedShareDirectionTriageHint,
  toSuppressedShareImbalanceIndexPct,
  toSuppressedShareNetPolarityPct,
  toSuppressedSharePolarizationBalanceGapPct,
  toSuppressedSharePolarizationIndexPct,
  toSuppressedShareTriageAction,
  toSuppressedShareTriageChannel,
  toSuppressedShareTriageDigest,
  toSuppressedShareTriageFocusMode,
  toSuppressedShareTriageFocusOrder,
  toSuppressedShareTriageFocusTarget,
  toSuppressedShareTriageIntensity,
  toSuppressedShareTriageLane,
  toSuppressedShareTriageOrder,
  toSuppressedShareTriagePlaybook,
  toSuppressedShareTriagePrimarySide,
  toSuppressedShareTriagePriorityBand,
  toSuppressedShareTriageRoute,
  toSuppressedShareTriageSecondarySide,
  toSuppressedShareTriageSideAlignment,
  toSuppressedShareTriageSidePair,
  toSuppressedShareTriageStream,
  toSuppressedShareTriageStreamClass,
  toSuppressedShareTriageStreamRank,
  toSuppressedShareTriageStreamScore,
  toSuppressedShareTriageStreamScoreBand,
  toSuppressedShareTriageStreamSignal,
  toSuppressedShareTriageStreamSignalCode,
  toSuppressedShareTriageStreamSignalFamily,
  toSuppressedShareTriageStreamSignalFamilyBucket,
  toSuppressedShareTriageStreamSignalFamilyCode,
  toSuppressedShareTriageStreamSignalFamilyDigest,
  toSuppressedShareTriageStreamSignalFamilyDigestCode,
  toSuppressedShareTriageStreamSignalFamilyRank,
  toSuppressedShareTriageStreamSignalFamilyTrace,
  toSuppressedShareTriageStreamSignalFamilyTraceCode,
  toSuppressedShareTriageStreamSignalFamilyTraceHash,
  toSuppressedShareTriageStreamSignalFamilyTraceHashBucket,
  toSuppressedShareTriageStreamSignalFamilyTraceHashCode,
  toSuppressedShareTriageStreamSignalFamilyTraceHashRank,
  toSuppressedShareTriageStreamSignalFamilyTraceHashWeight,
  toSuppressedShareTriageStreamSignalFamilyWeight,
  toSuppressedShareTriageSummary,
  toSuppressedShareTriageTrack,
  toSuppressedWithReplacementCount,
  toSuppressedWithReplacementFilesCount,
  toSuppressedWithReplacementFilesRatioPct,
  toSuppressedWithReplacementPlatformsCount,
  toSuppressedWithReplacementPlatformsRatioPct,
  toSuppressedWithReplacementRatioPct,
  toSuppressedWithoutReplacementCount,
  toSuppressedWithoutReplacementFilesCount,
  toSuppressedWithoutReplacementFilesRatioPct,
  toSuppressedWithoutReplacementPlatformsCount,
  toSuppressedWithoutReplacementPlatformsRatioPct,
  toSuppressedWithoutReplacementRatioPct,
} from './evidenceFacets';

export const MAX_FINDINGS_LIMIT = 100;
export const MAX_RULESETS_LIMIT = 100;
export const MAX_PLATFORMS_LIMIT = 100;
export const MAX_LEDGER_LIMIT = 100;

export const truthyQueryValues = new Set(['1', 'true', 'yes', 'on']);
export const falsyQueryValues = new Set(['0', 'false', 'no', 'off']);

export const CONTEXT_API_CAPABILITIES = {
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

export { readEvidenceResult, readEvidence };

export const parseBooleanQuery = (value: string | null): boolean | undefined => {
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

export const parseNonNegativeIntQuery = (value: string | null): number | undefined => {
  if (!value) {
    return undefined;
  }
  if (!/^\d+$/.test(value.trim())) {
    return undefined;
  }
  return Number.parseInt(value.trim(), 10);
};

export const includeSuppressedFromQuery = (requestUrl: URL): boolean => {
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

export const normalizeQueryToken = (value: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
};

export const sortSnapshotFindings = (
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
    const leftLines = left.lines ? (Array.isArray(left.lines) ? left.lines.join(',') : String(left.lines)) : '';
    const rightLines = right.lines ? (Array.isArray(right.lines) ? right.lines.join(',') : String(right.lines)) : '';
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

export const sortLedger = (ledger: AiEvidenceV2_1['ledger']): AiEvidenceV2_1['ledger'] => {
  return [...ledger].sort((left, right) => {
    const byRule = left.ruleId.localeCompare(right.ruleId);
    if (byRule !== 0) {
      return byRule;
    }
    const byFile = left.file.localeCompare(right.file);
    if (byFile !== 0) {
      return byFile;
    }
    const leftLines = left.lines ? (Array.isArray(left.lines) ? left.lines.join(',') : String(left.lines)) : '';
    const rightLines = right.lines ? (Array.isArray(right.lines) ? right.lines.join(',') : String(right.lines)) : '';
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

export const inferFindingPlatform = (
  finding: AiEvidenceV2_1['snapshot']['findings'][number]
): 'ios' | 'backend' | 'frontend' | 'android' | 'generic' => {
  return inferPlatformFromFilePath(finding.file);
};

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
    suppressed_replacement_rule_file_pairs_ratio_pct:
      toSuppressedReplacementRuleFilePairsRatioPct(evidence),
    suppressed_replacement_rule_platform_pairs_ratio_pct:
      toSuppressedReplacementRulePlatformPairsRatioPct(evidence),
    suppressed_non_replacement_rule_platform_pairs_ratio_pct:
      toSuppressedNonReplacementRulePlatformPairsRatioPct(evidence),
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

export const toRulesetsPayload = (evidence: AiEvidenceV2_1, requestUrl: URL) => {
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

export const toPlatformsPayload = (evidence: AiEvidenceV2_1, requestUrl: URL) => {
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

export const toLedgerPayload = (evidence: AiEvidenceV2_1) => {
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

export const toLedgerPayloadWithFilters = (evidence: AiEvidenceV2_1, requestUrl: URL) => {
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

export const toSnapshotPayload = (evidence: AiEvidenceV2_1) => {
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

export const toFindingsPayload = (evidence: AiEvidenceV2_1, requestUrl: URL) => {
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

export const toResponsePayload = (evidence: AiEvidenceV2_1, requestUrl: URL): unknown => {
  if (includeSuppressedFromQuery(requestUrl)) {
    return evidence;
  }
  const { consolidation: _ignored, ...rest } = evidence;
  return rest;
};

export const toStatusPayload = (repoRoot: string): unknown => {
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
      suppressed_replacement_rule_file_pairs_ratio_pct:
        toSuppressedReplacementRuleFilePairsRatioPct(evidence),
      suppressed_replacement_rule_platform_pairs_ratio_pct:
        toSuppressedReplacementRulePlatformPairsRatioPct(evidence),
      suppressed_non_replacement_rule_platform_pairs_ratio_pct:
        toSuppressedNonReplacementRulePlatformPairsRatioPct(evidence),
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
