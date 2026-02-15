import type { AiEvidenceV2_1 } from '../evidence/schema';
import {
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

export const toSuppressedSummaryFields = (evidence: AiEvidenceV2_1) => ({
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
});
