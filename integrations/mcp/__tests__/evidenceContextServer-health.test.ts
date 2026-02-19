import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createEvidencePayload, test, withEvidenceServer, withTempDir } from './evidenceContextServerFixtures';

test('serves health endpoint', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`);
      assert.equal(response.status, 200);
      const payload = (await response.json()) as { status?: string };
      assert.equal(payload.status, 'ok');
    });
  });
});

test('returns 404 when evidence file is missing', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence`);
      assert.equal(response.status, 404);
    });
  });
});

test('returns degraded status when evidence file is missing', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/status`);
      assert.equal(response.status, 200);
      const payload = (await response.json()) as {
        status?: string;
        context_api?: {
          endpoints?: string[];
          filters?: {
            findings?: string[];
            rulesets?: string[];
            platforms?: string[];
            ledger?: string[];
          };
          pagination_bounds?: {
            findings?: { max_limit?: number };
            rulesets?: { max_limit?: number };
            platforms?: { max_limit?: number };
            ledger?: { max_limit?: number };
          };
        };
        evidence?: {
          exists?: boolean;
          present?: boolean;
          valid?: boolean;
          version?: string | null;
          findings_count?: number;
        };
      };
      assert.equal(payload.status, 'degraded');
      assert.ok(payload.context_api?.endpoints?.includes('/ai-evidence/findings'));
      assert.deepEqual(payload.context_api?.filters?.rulesets, [
        'platform',
        'bundle',
        'limit',
        'offset',
        'maxLimit',
      ]);
      assert.equal(payload.context_api?.pagination_bounds?.findings?.max_limit, 100);
      assert.equal(payload.context_api?.pagination_bounds?.rulesets?.max_limit, 100);
      assert.equal(payload.context_api?.pagination_bounds?.platforms?.max_limit, 100);
      assert.equal(payload.context_api?.pagination_bounds?.ledger?.max_limit, 100);
      assert.equal(payload.evidence?.exists, false);
      assert.equal(payload.evidence?.present, false);
      assert.equal(payload.evidence?.valid, false);
      assert.equal(payload.evidence?.version, null);
      assert.equal(payload.evidence?.findings_count, 0);
    });
  });
});

test('returns summary status payload when evidence file is valid v2.1', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      `${JSON.stringify(createEvidencePayload(), null, 2)}\n`,
      'utf8'
    );

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/status`);
      assert.equal(response.status, 200);
      const payload = (await response.json()) as {
        status?: string;
        context_api?: {
          endpoints?: string[];
          filters?: {
            findings?: string[];
            rulesets?: string[];
            platforms?: string[];
            ledger?: string[];
          };
          pagination_bounds?: {
            findings?: { max_limit?: number };
            rulesets?: { max_limit?: number };
            platforms?: { max_limit?: number };
            ledger?: { max_limit?: number };
          };
        };
        evidence?: {
          exists?: boolean;
          present?: boolean;
          valid?: boolean;
          version?: string;
          stage?: string;
          outcome?: string;
          has_findings?: boolean;
          findings_count?: number;
          findings_files_count?: number;
          findings_rules_count?: number;
          findings_with_lines_count?: number;
          findings_without_lines_count?: number;
          severity_counts?: Record<string, number>;
          findings_by_platform?: Record<string, number>;
          highest_severity?: string | null;
          blocking_findings_count?: number;
          ledger_count?: number;
          ledger_files_count?: number;
          ledger_rules_count?: number;
          ledger_by_platform?: Record<string, number>;
          rulesets_count?: number;
          rulesets_platforms_count?: number;
          rulesets_bundles_count?: number;
          rulesets_hashes_count?: number;
          rulesets_by_platform?: Record<string, number>;
          rulesets_fingerprint?: string;
          platform_confidence_counts?: Record<string, number>;
          suppressed_findings_count?: number;
          suppressed_replacement_rules_count?: number;
          suppressed_platforms_count?: number;
          suppressed_files_count?: number;
          suppressed_rules_count?: number;
          suppressed_reasons_count?: number;
          suppressed_non_replacement_rules_count?: number;
          suppressed_with_replacement_files_count?: number;
          suppressed_with_replacement_files_ratio_pct?: number;
          suppressed_replacement_files_ratio_pct?: number;
          suppressed_with_replacement_platforms_ratio_pct?: number;
          suppressed_without_replacement_platforms_ratio_pct?: number;
          suppressed_non_replacement_platforms_ratio_pct?: number;
          suppressed_without_replacement_files_count?: number;
          suppressed_non_replacement_files_count?: number;
          suppressed_without_replacement_files_ratio_pct?: number;
          suppressed_non_replacement_files_ratio_pct?: number;
          suppressed_with_replacement_count?: number;
          suppressed_with_replacement_ratio_pct?: number;
          suppressed_reasons_with_replacement_ratio_pct?: number;
          suppressed_reasons_without_replacement_ratio_pct?: number;
          suppressed_finding_coverage_ratio_pct?: number;
          suppressed_reasons_coverage_ratio_pct?: number;
          suppressed_replacement_rules_ratio_pct?: number;
          suppressed_non_replacement_rules_ratio_pct?: number;
          suppressed_replacement_platforms_ratio_pct?: number;
          suppressed_without_replacement_count?: number;
          suppressed_non_replacement_ratio_pct?: number;
          suppressed_without_replacement_ratio_pct?: number;
          suppressed_rule_file_pairs_count?: number;
          suppressed_reasons_with_replacement_count?: number;
          suppressed_reasons_without_replacement_count?: number;
          suppressed_platform_rule_pairs_count?: number;
          suppressed_platform_file_pairs_count?: number;
          suppressed_replacement_rule_file_pairs_count?: number;
          suppressed_replacement_rule_file_pairs_ratio_pct?: number;
          suppressed_replacement_rule_platform_pairs_ratio_pct?: number;
          suppressed_replacement_rule_platform_pairs_count?: number;
          suppressed_non_replacement_rule_platform_pairs_ratio_pct?: number;
          suppressed_replacement_platforms_count?: number;
          suppressed_with_replacement_platforms_count?: number;
          suppressed_non_replacement_platforms_count?: number;
          suppressed_without_replacement_platforms_count?: number;
          suppressed_non_replacement_reason_file_pairs_count?: number;
          suppressed_non_replacement_rule_file_pairs_count?: number;
          suppressed_non_replacement_rule_file_pairs_ratio_pct?: number;
          suppressed_non_replacement_rule_platform_pairs_count?: number;
          suppressed_non_replacement_reasons_count?: number;
          suppressed_replacement_reason_file_pairs_count?: number;
          suppressed_replacement_rule_reason_pairs_count?: number;
          suppressed_replacement_rule_ids_count?: number;
          suppressed_replacement_reasons_count?: number;
          suppressed_replacement_rule_file_platform_triples_count?: number;
          suppressed_non_replacement_rule_file_platform_triples_count?: number;
          suppressed_reason_rule_file_triples_count?: number;
          suppressed_reason_rule_platform_triples_count?: number;
          suppressed_reason_file_platform_triples_count?: number;
          suppressed_reason_platform_pairs_count?: number;
          suppressed_reason_file_pairs_count?: number;
          suppressed_replacement_reason_platform_pairs_count?: number;
          suppressed_non_replacement_reason_platform_pairs_count?: number;
          suppressed_replacement_reason_rule_file_triples_count?: number;
          suppressed_non_replacement_reason_rule_file_triples_count?: number;
          suppressed_replacement_reason_rule_platform_triples_count?: number;
          suppressed_non_replacement_reason_rule_platform_triples_count?: number;
          suppressed_reason_rule_file_platform_quadruples_count?: number;
          suppressed_replacement_reason_rule_file_platform_quadruples_count?: number;
          suppressed_non_replacement_reason_rule_file_platform_quadruples_count?: number;
          suppressed_reason_rule_file_platform_replacement_split_count?: number;
          suppressed_replacement_split_modes_count?: number;
          suppressed_replacement_split_mode_replacement_count?: number;
          suppressed_replacement_split_mode_non_replacement_count?: number;
          suppressed_reason_rule_file_platform_replacement_dual_mode_count?: number;
          suppressed_replacement_rule_file_platform_distinct_count?: number;
          suppressed_non_replacement_rule_file_platform_distinct_count?: number;
          suppressed_rule_file_platform_distinct_total_count?: number;
          suppressed_replacement_rule_file_platform_share_of_total_pct?: number;
          suppressed_non_replacement_rule_file_platform_share_of_total_pct?: number;
          suppressed_replacement_vs_non_replacement_share_gap_pct?: number;
          suppressed_replacement_rule_file_platform_dominance_pct?: number;
          suppressed_replacement_minus_non_replacement_share_signed_pct?: number;
          suppressed_non_replacement_rule_file_platform_dominance_pct?: number;
          suppressed_share_polarization_index_pct?: number;
          suppressed_share_balance_score_pct?: number;
          suppressed_share_imbalance_index_pct?: number;
          suppressed_share_polarization_balance_gap_pct?: number;
          suppressed_share_net_polarity_pct?: number;
          suppressed_share_direction?: 'replacement' | 'non_replacement' | 'balanced';
          suppressed_share_direction_confidence?: number;
          suppressed_share_direction_strength_bucket?: 'LOW' | 'MEDIUM' | 'HIGH';
          suppressed_share_direction_strength_rank?: 1 | 2 | 3;
          suppressed_share_direction_is_balanced?: boolean;
          suppressed_share_direction_label?: string;
          suppressed_share_direction_code?: 'R' | 'N' | 'B';
          suppressed_share_direction_triage_hint?: string;
          suppressed_share_direction_priority_score?: number;
          suppressed_share_triage_summary?: string;
          suppressed_share_triage_digest?: string;
          suppressed_share_triage_action?: string;
          suppressed_share_triage_playbook?: string;
          suppressed_share_triage_priority_band?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
          suppressed_share_triage_order?: string;
          suppressed_share_triage_primary_side?: 'replacement' | 'non_replacement' | 'balanced';
          suppressed_share_triage_secondary_side?: 'replacement' | 'non_replacement' | 'balanced';
          suppressed_share_triage_side_pair?: string;
          suppressed_share_triage_side_alignment?: 'balanced' | 'same' | 'opposed';
          suppressed_share_triage_focus_target?: string;
          suppressed_share_triage_focus_order?: string;
          suppressed_share_triage_focus_mode?: 'single' | 'dual';
          suppressed_share_triage_intensity?: number;
          suppressed_share_triage_lane?: string;
          suppressed_share_triage_route?: string;
          suppressed_share_triage_channel?: 'watch' | 'balanced' | 'fast' | 'standard';
          suppressed_share_triage_track?: string;
          suppressed_share_triage_stream?: string;
          suppressed_share_triage_stream_class?: 'observation' | 'balanced' | 'priority' | 'standard';
          suppressed_share_triage_stream_rank?: 0 | 1 | 2 | 3;
          suppressed_share_triage_stream_score?: number;
          suppressed_share_triage_stream_score_band?: 'LOW' | 'MEDIUM' | 'HIGH';
          suppressed_share_triage_stream_signal?: string;
          suppressed_share_triage_stream_signal_code?: string;
          suppressed_share_triage_stream_signal_family?: string;
          suppressed_share_triage_stream_signal_family_code?: string;
          suppressed_share_triage_stream_signal_family_rank?: 0 | 1 | 2 | 3;
          suppressed_share_triage_stream_signal_family_weight?: number;
          suppressed_share_triage_stream_signal_family_bucket?: 'LOW' | 'MEDIUM' | 'HIGH';
          suppressed_share_triage_stream_signal_family_digest?: string;
          suppressed_share_triage_stream_signal_family_digest_code?: string;
          suppressed_share_triage_stream_signal_family_trace?: string;
          suppressed_share_triage_stream_signal_family_trace_code?: string;
          suppressed_share_triage_stream_signal_family_trace_hash?: string;
          suppressed_share_triage_stream_signal_family_trace_hash_code?: string;
          suppressed_share_triage_stream_signal_family_trace_hash_bucket?: 'LOW' | 'MEDIUM' | 'HIGH';
          suppressed_share_triage_stream_signal_family_trace_hash_rank?: 0 | 1 | 2;
          suppressed_share_triage_stream_signal_family_trace_hash_weight?: number;
          tracked_platforms_count?: number;
          detected_platforms_count?: number;
          non_detected_platforms_count?: number;
          platforms?: string[];
        };
      };
      assert.equal(payload.status, 'ok');
      assert.ok(payload.context_api?.endpoints?.includes('/ai-evidence/rulesets'));
      assert.deepEqual(payload.context_api?.filters?.findings, [
        'severity',
        'ruleId',
        'platform',
        'limit',
        'offset',
        'maxLimit',
      ]);
      assert.equal(payload.context_api?.pagination_bounds?.findings?.max_limit, 100);
      assert.equal(payload.context_api?.pagination_bounds?.rulesets?.max_limit, 100);
      assert.equal(payload.context_api?.pagination_bounds?.platforms?.max_limit, 100);
      assert.equal(payload.context_api?.pagination_bounds?.ledger?.max_limit, 100);
      assert.equal(payload.evidence?.valid, true);
      assert.equal(payload.evidence?.exists, true);
      assert.equal(payload.evidence?.present, true);
      assert.equal(payload.evidence?.version, '2.1');
      assert.equal(payload.evidence?.stage, 'CI');
      assert.equal(payload.evidence?.outcome, 'PASS');
      assert.equal(payload.evidence?.has_findings, false);
      assert.equal(payload.evidence?.findings_count, 0);
      assert.equal(payload.evidence?.findings_files_count, 0);
      assert.equal(payload.evidence?.findings_rules_count, 0);
      assert.equal(payload.evidence?.findings_with_lines_count, 0);
      assert.equal(payload.evidence?.findings_without_lines_count, 0);
      assert.deepEqual(payload.evidence?.severity_counts, {});
      assert.deepEqual(payload.evidence?.findings_by_platform, {});
      assert.equal(payload.evidence?.highest_severity, null);
      assert.equal(payload.evidence?.blocking_findings_count, 0);
      assert.equal(payload.evidence?.ledger_count, 0);
      assert.equal(payload.evidence?.ledger_files_count, 0);
      assert.equal(payload.evidence?.ledger_rules_count, 0);
      assert.deepEqual(payload.evidence?.ledger_by_platform, {});
      assert.equal(payload.evidence?.rulesets_count, 0);
      assert.equal(payload.evidence?.rulesets_platforms_count, 0);
      assert.equal(payload.evidence?.rulesets_bundles_count, 0);
      assert.equal(payload.evidence?.rulesets_hashes_count, 0);
      assert.deepEqual(payload.evidence?.rulesets_by_platform, {});
      assert.equal(payload.evidence?.rulesets_fingerprint, '');
      assert.deepEqual(payload.evidence?.platform_confidence_counts, {});
      assert.equal(payload.evidence?.suppressed_findings_count, 1);
      assert.equal(payload.evidence?.suppressed_replacement_rules_count, 1);
      assert.equal(payload.evidence?.suppressed_platforms_count, 1);
      assert.equal(payload.evidence?.suppressed_files_count, 1);
      assert.equal(payload.evidence?.suppressed_rules_count, 1);
      assert.equal(payload.evidence?.suppressed_reasons_count, 1);
      assert.equal(payload.evidence?.suppressed_non_replacement_rules_count, 0);
      assert.equal(payload.evidence?.suppressed_with_replacement_files_count, 1);
      assert.equal(payload.evidence?.suppressed_with_replacement_files_ratio_pct, 100);
      assert.equal(payload.evidence?.suppressed_replacement_files_ratio_pct, 100);
      assert.equal(payload.evidence?.suppressed_with_replacement_platforms_ratio_pct, 100);
      assert.equal(payload.evidence?.suppressed_without_replacement_platforms_ratio_pct, 0);
      assert.equal(payload.evidence?.suppressed_non_replacement_platforms_ratio_pct, 0);
      assert.equal(payload.evidence?.suppressed_without_replacement_files_count, 0);
      assert.equal(payload.evidence?.suppressed_non_replacement_files_count, 0);
      assert.equal(payload.evidence?.suppressed_without_replacement_files_ratio_pct, 0);
      assert.equal(payload.evidence?.suppressed_non_replacement_files_ratio_pct, 0);
      assert.equal(payload.evidence?.suppressed_with_replacement_count, 1);
      assert.equal(payload.evidence?.suppressed_with_replacement_ratio_pct, 100);
      assert.equal(payload.evidence?.suppressed_reasons_with_replacement_ratio_pct, 100);
      assert.equal(payload.evidence?.suppressed_reasons_without_replacement_ratio_pct, 0);
      assert.equal(payload.evidence?.suppressed_finding_coverage_ratio_pct, 100);
      assert.equal(payload.evidence?.suppressed_reasons_coverage_ratio_pct, 100);
      assert.equal(payload.evidence?.suppressed_replacement_rules_ratio_pct, 100);
      assert.equal(payload.evidence?.suppressed_non_replacement_rules_ratio_pct, 0);
      assert.equal(payload.evidence?.suppressed_replacement_platforms_ratio_pct, 100);
      assert.equal(payload.evidence?.suppressed_with_replacement_platforms_count, 1);
      assert.equal(payload.evidence?.suppressed_without_replacement_platforms_count, 0);
      assert.equal(payload.evidence?.suppressed_without_replacement_count, 0);
      assert.equal(payload.evidence?.suppressed_non_replacement_ratio_pct, 0);
      assert.equal(payload.evidence?.suppressed_without_replacement_ratio_pct, 0);
      assert.equal(payload.evidence?.suppressed_rule_file_pairs_count, 1);
      assert.equal(payload.evidence?.suppressed_non_replacement_rule_file_pairs_ratio_pct, 0);
      assert.equal(payload.evidence?.suppressed_reasons_with_replacement_count, 1);
      assert.equal(payload.evidence?.suppressed_reasons_without_replacement_count, 0);
      assert.equal(payload.evidence?.suppressed_platform_rule_pairs_count, 1);
      assert.equal(payload.evidence?.suppressed_platform_file_pairs_count, 1);
      assert.equal(payload.evidence?.suppressed_replacement_rule_file_pairs_count, 1);
      assert.equal(payload.evidence?.suppressed_replacement_rule_file_pairs_ratio_pct, 100);
      assert.equal(payload.evidence?.suppressed_replacement_rule_platform_pairs_ratio_pct, 100);
      assert.equal(payload.evidence?.suppressed_non_replacement_rule_platform_pairs_ratio_pct, 0);
      assert.equal(payload.evidence?.suppressed_replacement_rule_platform_pairs_count, 1);
      assert.equal(payload.evidence?.suppressed_replacement_platforms_count, 1);
      assert.equal(payload.evidence?.suppressed_non_replacement_platforms_count, 0);
      assert.equal(payload.evidence?.suppressed_non_replacement_reason_file_pairs_count, 0);
      assert.equal(payload.evidence?.suppressed_non_replacement_rule_file_pairs_count, 0);
      assert.equal(payload.evidence?.suppressed_non_replacement_rule_platform_pairs_count, 0);
      assert.equal(payload.evidence?.suppressed_non_replacement_reasons_count, 0);
      assert.equal(payload.evidence?.suppressed_replacement_reason_file_pairs_count, 1);
      assert.equal(payload.evidence?.suppressed_replacement_rule_reason_pairs_count, 1);
      assert.equal(payload.evidence?.suppressed_replacement_rule_ids_count, 1);
      assert.equal(payload.evidence?.suppressed_replacement_reasons_count, 1);
      assert.equal(payload.evidence?.suppressed_replacement_rule_file_platform_triples_count, 1);
      assert.equal(payload.evidence?.suppressed_non_replacement_rule_file_platform_triples_count, 0);
      assert.equal(payload.evidence?.suppressed_reason_rule_file_triples_count, 1);
      assert.equal(payload.evidence?.suppressed_reason_rule_platform_triples_count, 1);
      assert.equal(payload.evidence?.suppressed_reason_file_platform_triples_count, 1);
      assert.equal(payload.evidence?.suppressed_reason_platform_pairs_count, 1);
      assert.equal(payload.evidence?.suppressed_reason_file_pairs_count, 1);
      assert.equal(payload.evidence?.suppressed_replacement_reason_platform_pairs_count, 1);
      assert.equal(payload.evidence?.suppressed_non_replacement_reason_platform_pairs_count, 0);
      assert.equal(payload.evidence?.suppressed_replacement_reason_rule_file_triples_count, 1);
      assert.equal(payload.evidence?.suppressed_non_replacement_reason_rule_file_triples_count, 0);
      assert.equal(payload.evidence?.suppressed_replacement_reason_rule_platform_triples_count, 1);
      assert.equal(payload.evidence?.suppressed_non_replacement_reason_rule_platform_triples_count, 0);
      assert.equal(payload.evidence?.suppressed_reason_rule_file_platform_quadruples_count, 1);
      assert.equal(payload.evidence?.suppressed_replacement_reason_rule_file_platform_quadruples_count, 1);
      assert.equal(payload.evidence?.suppressed_non_replacement_reason_rule_file_platform_quadruples_count, 0);
      assert.equal(payload.evidence?.suppressed_reason_rule_file_platform_replacement_split_count, 1);
      assert.equal(payload.evidence?.suppressed_replacement_split_modes_count, 1);
      assert.equal(payload.evidence?.suppressed_replacement_split_mode_replacement_count, 1);
      assert.equal(payload.evidence?.suppressed_replacement_split_mode_non_replacement_count, 0);
      assert.equal(payload.evidence?.suppressed_reason_rule_file_platform_replacement_dual_mode_count, 0);
      assert.equal(payload.evidence?.suppressed_replacement_rule_file_platform_distinct_count, 1);
      assert.equal(payload.evidence?.suppressed_non_replacement_rule_file_platform_distinct_count, 0);
      assert.equal(payload.evidence?.suppressed_rule_file_platform_distinct_total_count, 1);
      assert.equal(payload.evidence?.suppressed_replacement_rule_file_platform_share_of_total_pct, 100);
      assert.equal(payload.evidence?.suppressed_non_replacement_rule_file_platform_share_of_total_pct, 0);
      assert.equal(payload.evidence?.suppressed_replacement_vs_non_replacement_share_gap_pct, 100);
      assert.equal(payload.evidence?.suppressed_replacement_rule_file_platform_dominance_pct, 100);
      assert.equal(
        payload.evidence?.suppressed_replacement_minus_non_replacement_share_signed_pct,
        100,
      );
      assert.equal(payload.evidence?.suppressed_non_replacement_rule_file_platform_dominance_pct, 0);
      assert.equal(payload.evidence?.suppressed_share_polarization_index_pct, 100);
      assert.equal(payload.evidence?.suppressed_share_balance_score_pct, 0);
      assert.equal(payload.evidence?.suppressed_share_imbalance_index_pct, 100);
      assert.equal(payload.evidence?.suppressed_share_polarization_balance_gap_pct, 100);
      assert.equal(payload.evidence?.suppressed_share_net_polarity_pct, 100);
      assert.equal(payload.evidence?.suppressed_share_direction, 'replacement');
      assert.equal(payload.evidence?.suppressed_share_direction_confidence, 100);
      assert.equal(payload.evidence?.suppressed_share_direction_strength_bucket, 'HIGH');
      assert.equal(payload.evidence?.suppressed_share_direction_strength_rank, 3);
      assert.equal(payload.evidence?.suppressed_share_direction_is_balanced, false);
      assert.equal(payload.evidence?.suppressed_share_direction_label, 'Replacement Dominant');
      assert.equal(payload.evidence?.suppressed_share_direction_code, 'R');
      assert.equal(
        payload.evidence?.suppressed_share_direction_triage_hint,
        'Replacement-dominant suppression; prioritize replacement rule review first.',
      );
      assert.equal(payload.evidence?.suppressed_share_direction_priority_score, 100);
      assert.equal(
        payload.evidence?.suppressed_share_triage_summary,
        'Replacement Dominant | HIGH | priority 100 | Replacement-dominant suppression; prioritize replacement rule review first.',
      );
      assert.equal(payload.evidence?.suppressed_share_triage_digest, 'R:HIGH:100');
      assert.equal(payload.evidence?.suppressed_share_triage_action, 'review_replacement_first');
      assert.equal(
        payload.evidence?.suppressed_share_triage_playbook,
        'review_replacement_rules>validate_replacements>check_non_replacement_fallbacks',
      );
      assert.equal(payload.evidence?.suppressed_share_triage_priority_band, 'HIGH');
      assert.equal(payload.evidence?.suppressed_share_triage_order, 'replacement>non_replacement');
      assert.equal(payload.evidence?.suppressed_share_triage_primary_side, 'replacement');
      assert.equal(payload.evidence?.suppressed_share_triage_secondary_side, 'non_replacement');
      assert.equal(payload.evidence?.suppressed_share_triage_side_pair, 'replacement>non_replacement');
      assert.equal(payload.evidence?.suppressed_share_triage_side_alignment, 'opposed');
      assert.equal(payload.evidence?.suppressed_share_triage_focus_target, 'replacement_rules');
      assert.equal(
        payload.evidence?.suppressed_share_triage_focus_order,
        'replacement_rules>non_replacement_paths',
      );
      assert.equal(payload.evidence?.suppressed_share_triage_focus_mode, 'single');
      assert.equal(payload.evidence?.suppressed_share_triage_intensity, 100);
      assert.equal(payload.evidence?.suppressed_share_triage_lane, 'replacement_fast_lane');
      assert.equal(
        payload.evidence?.suppressed_share_triage_route,
        'replacement_fast_lane:replacement_rules>non_replacement_paths',
      );
      assert.equal(payload.evidence?.suppressed_share_triage_channel, 'fast');
      assert.equal(payload.evidence?.suppressed_share_triage_track, 'replacement_fast_track');
      assert.equal(payload.evidence?.suppressed_share_triage_stream, 'replacement_priority_stream');
      assert.equal(payload.evidence?.suppressed_share_triage_stream_class, 'priority');
      assert.equal(payload.evidence?.suppressed_share_triage_stream_rank, 3);
      assert.equal(payload.evidence?.suppressed_share_triage_stream_score, 100);
      assert.equal(payload.evidence?.suppressed_share_triage_stream_score_band, 'HIGH');
      assert.equal(payload.evidence?.suppressed_share_triage_stream_signal, 'priority:HIGH');
      assert.equal(payload.evidence?.suppressed_share_triage_stream_signal_code, 'PRI-H');
      assert.equal(payload.evidence?.suppressed_share_triage_stream_signal_family, 'priority_family');
      assert.equal(payload.evidence?.suppressed_share_triage_stream_signal_family_code, 'PRI_FAM');
      assert.equal(payload.evidence?.suppressed_share_triage_stream_signal_family_rank, 3);
      assert.equal(payload.evidence?.suppressed_share_triage_stream_signal_family_weight, 100);
      assert.equal(payload.evidence?.suppressed_share_triage_stream_signal_family_bucket, 'HIGH');
      assert.equal(payload.evidence?.suppressed_share_triage_stream_signal_family_digest, 'PRI_FAM:HIGH');
      assert.equal(payload.evidence?.suppressed_share_triage_stream_signal_family_digest_code, 'PRI_FAM_HIGH');
      assert.equal(
        payload.evidence?.suppressed_share_triage_stream_signal_family_trace,
        'PRI_FAM_HIGH@replacement_fast_lane:replacement_rules>non_replacement_paths',
      );
      assert.equal(
        payload.evidence?.suppressed_share_triage_stream_signal_family_trace_code,
        'PRI_FAM_HIGH_REPLACEMENT_FAST_LANE_REPLACEMENT_RULES_NON_REPLACEMENT_PATHS',
      );
      assert.equal(payload.evidence?.suppressed_share_triage_stream_signal_family_trace_hash, '00CD08A7');
      assert.equal(
        payload.evidence?.suppressed_share_triage_stream_signal_family_trace_hash_code,
        'TRACE_HASH_00CD08A7',
      );
      assert.equal(payload.evidence?.suppressed_share_triage_stream_signal_family_trace_hash_bucket, 'LOW');
      assert.equal(payload.evidence?.suppressed_share_triage_stream_signal_family_trace_hash_rank, 0);
      assert.equal(payload.evidence?.suppressed_share_triage_stream_signal_family_trace_hash_weight, 0);
      assert.equal(payload.evidence?.tracked_platforms_count, 0);
      assert.equal(payload.evidence?.detected_platforms_count, 0);
      assert.equal(payload.evidence?.non_detected_platforms_count, 0);
      assert.deepEqual(payload.evidence?.platforms, []);
    });
  });
});
