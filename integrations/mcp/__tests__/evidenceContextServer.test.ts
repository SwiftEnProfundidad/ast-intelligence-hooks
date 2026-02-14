import assert from 'node:assert/strict';
import { once } from 'node:events';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { startEvidenceContextServer } from '../evidenceContextServer';

const createEvidencePayload = () => {
  return {
    version: '2.1',
    timestamp: '2026-02-01T10:00:00.000Z',
    snapshot: {
      stage: 'CI',
      outcome: 'PASS',
      findings: [],
    },
    ledger: [],
    platforms: {},
    rulesets: [],
    human_intent: null,
    ai_gate: {
      status: 'ALLOWED',
      violations: [],
      human_intent: null,
    },
    severity_metrics: {
      gate_status: 'ALLOWED',
      total_violations: 0,
      by_severity: {
        CRITICAL: 0,
        ERROR: 0,
        WARN: 0,
        INFO: 0,
      },
    },
    consolidation: {
      suppressed: [
        {
          ruleId: 'heuristics.ts.explicit-any.ast',
          file: 'apps/backend/src/main.ts',
          replacedByRuleId: 'backend.avoid-explicit-any',
          reason: 'semantic-family-precedence',
        },
      ],
    },
  };
};

const withEvidenceServer = async (
  repoRoot: string,
  callback: (baseUrl: string) => Promise<void>
): Promise<void> => {
  const started = startEvidenceContextServer({
    host: '127.0.0.1',
    port: 0,
    repoRoot,
  });

  try {
    await once(started.server, 'listening');
    const address = started.server.address();
    assert.ok(address && typeof address === 'object');
    const baseUrl = `http://127.0.0.1:${address.port}`;
    await callback(baseUrl);
  } finally {
    await new Promise<void>((resolve) => {
      started.server.close(() => resolve());
    });
  }
};

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
        evidence?: { present?: boolean; valid?: boolean; version?: string | null };
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
      assert.equal(payload.evidence?.present, false);
      assert.equal(payload.evidence?.valid, false);
      assert.equal(payload.evidence?.version, null);
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
          suppressed_with_replacement_count?: number;
          suppressed_without_replacement_count?: number;
          suppressed_rule_file_pairs_count?: number;
          suppressed_reasons_with_replacement_count?: number;
          suppressed_reasons_without_replacement_count?: number;
          suppressed_platform_rule_pairs_count?: number;
          suppressed_platform_file_pairs_count?: number;
          suppressed_replacement_rule_file_pairs_count?: number;
          suppressed_replacement_rule_platform_pairs_count?: number;
          suppressed_replacement_platforms_count?: number;
          suppressed_non_replacement_platforms_count?: number;
          suppressed_non_replacement_reason_file_pairs_count?: number;
          suppressed_non_replacement_rule_file_pairs_count?: number;
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
      assert.equal(payload.evidence?.suppressed_with_replacement_count, 1);
      assert.equal(payload.evidence?.suppressed_without_replacement_count, 0);
      assert.equal(payload.evidence?.suppressed_rule_file_pairs_count, 1);
      assert.equal(payload.evidence?.suppressed_reasons_with_replacement_count, 1);
      assert.equal(payload.evidence?.suppressed_reasons_without_replacement_count, 0);
      assert.equal(payload.evidence?.suppressed_platform_rule_pairs_count, 1);
      assert.equal(payload.evidence?.suppressed_platform_file_pairs_count, 1);
      assert.equal(payload.evidence?.suppressed_replacement_rule_file_pairs_count, 1);
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
      assert.equal(payload.evidence?.tracked_platforms_count, 0);
      assert.equal(payload.evidence?.detected_platforms_count, 0);
      assert.equal(payload.evidence?.non_detected_platforms_count, 0);
      assert.deepEqual(payload.evidence?.platforms, []);
    });
  });
});

test('returns evidence payload when version is v2.1', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      `${JSON.stringify(createEvidencePayload(), null, 2)}\n`,
      'utf8'
    );

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence`);
      assert.equal(response.status, 200);
      const payload = (await response.json()) as {
        version?: string;
        consolidation?: { suppressed?: unknown[] };
      };
      assert.equal(payload.version, '2.1');
      assert.equal(payload.consolidation?.suppressed?.length, 1);
    });
  });
});

test('returns summary payload from dedicated summary endpoint', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    const payload = createEvidencePayload();
    payload.snapshot.findings.push({
      ruleId: 'backend.avoid-explicit-any',
      severity: 'ERROR',
      code: 'backend.avoid-explicit-any',
      message: 'Avoid explicit any',
      file: 'apps/backend/src/main.ts',
      lines: [10, 11],
    });
    payload.platforms = {
      ios: { detected: true, confidence: 'HIGH' },
      backend: { detected: true, confidence: 'HIGH' },
      frontend: { detected: false, confidence: 'LOW' },
    };
    payload.rulesets = [
      { platform: 'backend', bundle: 'backend', hash: '222' },
      { platform: 'ios', bundle: 'ios', hash: '111' },
    ];
    payload.ledger = [
      {
        ruleId: 'backend.avoid-explicit-any',
        file: 'apps/backend/src/main.ts',
        firstSeen: '2026-02-01T10:00:00.000Z',
        lastSeen: '2026-02-01T10:00:00.000Z',
      },
      {
        ruleId: 'ios.force-unwrap',
        file: 'apps/ios/Feature/View.swift',
        firstSeen: '2026-02-01T10:00:00.000Z',
        lastSeen: '2026-02-01T10:00:00.000Z',
      },
    ];
    writeFileSync(join(repoRoot, '.ai_evidence.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence/summary`);
      assert.equal(response.status, 200);
      const summary = (await response.json()) as {
        version?: string;
        snapshot?: {
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
        };
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
        suppressed_with_replacement_count?: number;
        suppressed_without_replacement_count?: number;
        suppressed_rule_file_pairs_count?: number;
        suppressed_reasons_with_replacement_count?: number;
        suppressed_reasons_without_replacement_count?: number;
        suppressed_platform_rule_pairs_count?: number;
        suppressed_platform_file_pairs_count?: number;
        suppressed_replacement_rule_file_pairs_count?: number;
        suppressed_replacement_rule_platform_pairs_count?: number;
        suppressed_replacement_platforms_count?: number;
        suppressed_non_replacement_platforms_count?: number;
        suppressed_non_replacement_reason_file_pairs_count?: number;
        suppressed_non_replacement_rule_file_pairs_count?: number;
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
        tracked_platforms_count?: number;
        detected_platforms_count?: number;
        non_detected_platforms_count?: number;
        platforms?: Array<{ platform: string; detected: boolean; confidence: string }>;
      };
      assert.equal(summary.version, '2.1');
      assert.equal(summary.snapshot?.stage, 'CI');
      assert.equal(summary.snapshot?.outcome, 'PASS');
      assert.equal(summary.snapshot?.has_findings, true);
      assert.equal(summary.snapshot?.findings_count, 1);
      assert.equal(summary.snapshot?.findings_files_count, 1);
      assert.equal(summary.snapshot?.findings_rules_count, 1);
      assert.equal(summary.snapshot?.findings_with_lines_count, 1);
      assert.equal(summary.snapshot?.findings_without_lines_count, 0);
      assert.deepEqual(summary.snapshot?.severity_counts, { ERROR: 1 });
      assert.deepEqual(summary.snapshot?.findings_by_platform, { backend: 1 });
      assert.equal(summary.snapshot?.highest_severity, 'ERROR');
      assert.equal(summary.snapshot?.blocking_findings_count, 1);
      assert.equal(summary.ledger_count, 2);
      assert.equal(summary.ledger_files_count, 2);
      assert.equal(summary.ledger_rules_count, 2);
      assert.deepEqual(summary.ledger_by_platform, { backend: 1, ios: 1 });
      assert.equal(summary.rulesets_count, 2);
      assert.equal(summary.rulesets_platforms_count, 2);
      assert.equal(summary.rulesets_bundles_count, 2);
      assert.equal(summary.rulesets_hashes_count, 2);
      assert.deepEqual(summary.rulesets_by_platform, { backend: 1, ios: 1 });
      assert.equal(summary.rulesets_fingerprint, '222|111');
      assert.deepEqual(summary.platform_confidence_counts, { HIGH: 2, LOW: 1 });
      assert.equal(summary.suppressed_findings_count, 1);
      assert.equal(summary.suppressed_replacement_rules_count, 1);
      assert.equal(summary.suppressed_platforms_count, 1);
      assert.equal(summary.suppressed_files_count, 1);
      assert.equal(summary.suppressed_rules_count, 1);
      assert.equal(summary.suppressed_reasons_count, 1);
      assert.equal(summary.suppressed_with_replacement_count, 1);
      assert.equal(summary.suppressed_without_replacement_count, 0);
      assert.equal(summary.suppressed_rule_file_pairs_count, 1);
      assert.equal(summary.suppressed_reasons_with_replacement_count, 1);
      assert.equal(summary.suppressed_reasons_without_replacement_count, 0);
      assert.equal(summary.suppressed_platform_rule_pairs_count, 1);
      assert.equal(summary.suppressed_platform_file_pairs_count, 1);
      assert.equal(summary.suppressed_replacement_rule_file_pairs_count, 1);
      assert.equal(summary.suppressed_replacement_rule_platform_pairs_count, 1);
      assert.equal(summary.suppressed_replacement_platforms_count, 1);
      assert.equal(summary.suppressed_non_replacement_platforms_count, 0);
      assert.equal(summary.suppressed_non_replacement_reason_file_pairs_count, 0);
      assert.equal(summary.suppressed_non_replacement_rule_file_pairs_count, 0);
      assert.equal(summary.suppressed_non_replacement_rule_platform_pairs_count, 0);
      assert.equal(summary.suppressed_non_replacement_reasons_count, 0);
      assert.equal(summary.suppressed_replacement_reason_file_pairs_count, 1);
      assert.equal(summary.suppressed_replacement_rule_reason_pairs_count, 1);
      assert.equal(summary.suppressed_replacement_rule_ids_count, 1);
      assert.equal(summary.suppressed_replacement_reasons_count, 1);
      assert.equal(summary.suppressed_replacement_rule_file_platform_triples_count, 1);
      assert.equal(summary.suppressed_non_replacement_rule_file_platform_triples_count, 0);
      assert.equal(summary.suppressed_reason_rule_file_triples_count, 1);
      assert.equal(summary.suppressed_reason_rule_platform_triples_count, 1);
      assert.equal(summary.suppressed_reason_file_platform_triples_count, 1);
      assert.equal(summary.suppressed_reason_platform_pairs_count, 1);
      assert.equal(summary.suppressed_reason_file_pairs_count, 1);
      assert.equal(summary.suppressed_replacement_reason_platform_pairs_count, 1);
      assert.equal(summary.suppressed_non_replacement_reason_platform_pairs_count, 0);
      assert.equal(summary.suppressed_replacement_reason_rule_file_triples_count, 1);
      assert.equal(summary.suppressed_non_replacement_reason_rule_file_triples_count, 0);
      assert.equal(summary.suppressed_replacement_reason_rule_platform_triples_count, 1);
      assert.equal(summary.suppressed_non_replacement_reason_rule_platform_triples_count, 0);
      assert.equal(summary.suppressed_reason_rule_file_platform_quadruples_count, 1);
      assert.equal(summary.suppressed_replacement_reason_rule_file_platform_quadruples_count, 1);
      assert.equal(summary.suppressed_non_replacement_reason_rule_file_platform_quadruples_count, 0);
      assert.equal(summary.suppressed_reason_rule_file_platform_replacement_split_count, 1);
      assert.equal(summary.suppressed_replacement_split_modes_count, 1);
      assert.equal(summary.suppressed_replacement_split_mode_replacement_count, 1);
      assert.equal(summary.suppressed_replacement_split_mode_non_replacement_count, 0);
      assert.equal(summary.suppressed_reason_rule_file_platform_replacement_dual_mode_count, 0);
      assert.equal(summary.suppressed_replacement_rule_file_platform_distinct_count, 1);
      assert.equal(summary.suppressed_non_replacement_rule_file_platform_distinct_count, 0);
      assert.equal(summary.suppressed_rule_file_platform_distinct_total_count, 1);
      assert.equal(summary.suppressed_replacement_rule_file_platform_share_of_total_pct, 100);
      assert.equal(summary.suppressed_non_replacement_rule_file_platform_share_of_total_pct, 0);
      assert.equal(summary.suppressed_replacement_vs_non_replacement_share_gap_pct, 100);
      assert.equal(summary.suppressed_replacement_rule_file_platform_dominance_pct, 100);
      assert.equal(summary.suppressed_replacement_minus_non_replacement_share_signed_pct, 100);
      assert.equal(summary.suppressed_non_replacement_rule_file_platform_dominance_pct, 0);
      assert.equal(summary.suppressed_share_polarization_index_pct, 100);
      assert.equal(summary.suppressed_share_balance_score_pct, 0);
      assert.equal(summary.suppressed_share_imbalance_index_pct, 100);
      assert.equal(summary.suppressed_share_polarization_balance_gap_pct, 100);
      assert.equal(summary.suppressed_share_net_polarity_pct, 100);
      assert.equal(summary.suppressed_share_direction, 'replacement');
      assert.equal(summary.suppressed_share_direction_confidence, 100);
      assert.equal(summary.suppressed_share_direction_strength_bucket, 'HIGH');
      assert.equal(summary.suppressed_share_direction_strength_rank, 3);
      assert.equal(summary.suppressed_share_direction_is_balanced, false);
      assert.equal(summary.suppressed_share_direction_label, 'Replacement Dominant');
      assert.equal(summary.suppressed_share_direction_code, 'R');
      assert.equal(
        summary.suppressed_share_direction_triage_hint,
        'Replacement-dominant suppression; prioritize replacement rule review first.',
      );
      assert.equal(summary.suppressed_share_direction_priority_score, 100);
      assert.equal(
        summary.suppressed_share_triage_summary,
        'Replacement Dominant | HIGH | priority 100 | Replacement-dominant suppression; prioritize replacement rule review first.',
      );
      assert.equal(summary.suppressed_share_triage_digest, 'R:HIGH:100');
      assert.equal(summary.suppressed_share_triage_action, 'review_replacement_first');
      assert.equal(
        summary.suppressed_share_triage_playbook,
        'review_replacement_rules>validate_replacements>check_non_replacement_fallbacks',
      );
      assert.equal(summary.suppressed_share_triage_priority_band, 'HIGH');
      assert.equal(summary.suppressed_share_triage_order, 'replacement>non_replacement');
      assert.equal(summary.suppressed_share_triage_primary_side, 'replacement');
      assert.equal(summary.suppressed_share_triage_secondary_side, 'non_replacement');
      assert.equal(summary.tracked_platforms_count, 3);
      assert.equal(summary.detected_platforms_count, 2);
      assert.equal(summary.non_detected_platforms_count, 1);
      assert.deepEqual(summary.platforms, [
        { platform: 'backend', detected: true, confidence: 'HIGH' },
        { platform: 'ios', detected: true, confidence: 'HIGH' },
      ]);
    });
  });
});

test('returns rulesets endpoint sorted deterministically', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    const payload = createEvidencePayload();
    payload.rulesets = [
      { platform: 'ios', bundle: 'shared', hash: 'zzz' },
      { platform: 'backend', bundle: 'backend', hash: 'bbb' },
      { platform: 'ios', bundle: 'ios', hash: 'aaa' },
    ];
    writeFileSync(join(repoRoot, '.ai_evidence.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence/rulesets`);
      assert.equal(response.status, 200);
      const body = (await response.json()) as {
        version?: string;
        total_count?: number;
        filters?: { platform?: string | null; bundle?: string | null };
        pagination?: {
          requested_limit?: number | null;
          max_limit?: number;
          limit?: number | null;
          offset?: number;
        };
        rulesets?: Array<{ platform: string; bundle: string; hash: string }>;
      };
      assert.equal(body.version, '2.1');
      assert.equal(body.total_count, 3);
      assert.deepEqual(body.filters, { platform: null, bundle: null });
      assert.deepEqual(body.pagination, {
        requested_limit: null,
        max_limit: 100,
        limit: null,
        offset: 0,
      });
      assert.deepEqual(body.rulesets, [
        { platform: 'backend', bundle: 'backend', hash: 'bbb' },
        { platform: 'ios', bundle: 'ios', hash: 'aaa' },
        { platform: 'ios', bundle: 'shared', hash: 'zzz' },
      ]);

      const filteredResponse = await fetch(`${baseUrl}/ai-evidence/rulesets?platform=ios&bundle=shared`);
      assert.equal(filteredResponse.status, 200);
      const filteredBody = (await filteredResponse.json()) as {
        total_count?: number;
        filters?: { platform?: string | null; bundle?: string | null };
        pagination?: {
          requested_limit?: number | null;
          max_limit?: number;
          limit?: number | null;
          offset?: number;
        };
        rulesets?: Array<{ platform: string; bundle: string; hash: string }>;
      };
      assert.equal(filteredBody.total_count, 1);
      assert.deepEqual(filteredBody.filters, { platform: 'ios', bundle: 'shared' });
      assert.deepEqual(filteredBody.pagination, {
        requested_limit: null,
        max_limit: 100,
        limit: null,
        offset: 0,
      });
      assert.deepEqual(filteredBody.rulesets, [
        { platform: 'ios', bundle: 'shared', hash: 'zzz' },
      ]);

      const pagedResponse = await fetch(`${baseUrl}/ai-evidence/rulesets?limit=1&offset=1`);
      assert.equal(pagedResponse.status, 200);
      const pagedBody = (await pagedResponse.json()) as {
        total_count?: number;
        pagination?: {
          requested_limit?: number | null;
          max_limit?: number;
          limit?: number | null;
          offset?: number;
        };
        rulesets?: Array<{ platform: string; bundle: string; hash: string }>;
      };
      assert.equal(pagedBody.total_count, 3);
      assert.deepEqual(pagedBody.pagination, {
        requested_limit: 1,
        max_limit: 100,
        limit: 1,
        offset: 1,
        has_more: true,
      });
      assert.deepEqual(pagedBody.rulesets, [{ platform: 'ios', bundle: 'ios', hash: 'aaa' }]);

      const cappedResponse = await fetch(`${baseUrl}/ai-evidence/rulesets?limit=9999`);
      assert.equal(cappedResponse.status, 200);
      const cappedBody = (await cappedResponse.json()) as {
        pagination?: {
          requested_limit?: number | null;
          max_limit?: number;
          limit?: number | null;
          offset?: number;
        };
      };
      assert.deepEqual(cappedBody.pagination, {
        requested_limit: 9999,
        max_limit: 100,
        limit: 100,
        offset: 0,
        has_more: false,
      });
    });
  });
});

test('returns platforms endpoint with detectedOnly toggle', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    const payload = createEvidencePayload();
    payload.platforms = {
      android: { detected: false, confidence: 'LOW' },
      backend: { detected: true, confidence: 'HIGH' },
      ios: { detected: true, confidence: 'MEDIUM' },
    };
    writeFileSync(join(repoRoot, '.ai_evidence.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const detectedOnlyResponse = await fetch(`${baseUrl}/ai-evidence/platforms`);
      assert.equal(detectedOnlyResponse.status, 200);
      const detectedOnly = (await detectedOnlyResponse.json()) as {
        filters?: { detectedOnly?: boolean; confidence?: string | null };
        total_count?: number;
        pagination?: {
          requested_limit?: number | null;
          max_limit?: number;
          limit?: number | null;
          offset?: number;
        };
        platforms?: Array<{ platform: string; detected: boolean; confidence: string }>;
      };
      assert.equal(detectedOnly.total_count, 2);
      assert.deepEqual(detectedOnly.filters, { detectedOnly: true, confidence: null });
      assert.deepEqual(detectedOnly.pagination, {
        requested_limit: null,
        max_limit: 100,
        limit: null,
        offset: 0,
      });
      assert.deepEqual(detectedOnly.platforms, [
        { platform: 'backend', detected: true, confidence: 'HIGH' },
        { platform: 'ios', detected: true, confidence: 'MEDIUM' },
      ]);

      const allPlatformsResponse = await fetch(`${baseUrl}/ai-evidence/platforms?detectedOnly=false`);
      assert.equal(allPlatformsResponse.status, 200);
      const allPlatforms = (await allPlatformsResponse.json()) as {
        filters?: { detectedOnly?: boolean; confidence?: string | null };
        total_count?: number;
        pagination?: {
          requested_limit?: number | null;
          max_limit?: number;
          limit?: number | null;
          offset?: number;
        };
        platforms?: Array<{ platform: string; detected: boolean; confidence: string }>;
      };
      assert.equal(allPlatforms.total_count, 3);
      assert.deepEqual(allPlatforms.filters, { detectedOnly: false, confidence: null });
      assert.deepEqual(allPlatforms.pagination, {
        requested_limit: null,
        max_limit: 100,
        limit: null,
        offset: 0,
      });
      assert.deepEqual(allPlatforms.platforms, [
        { platform: 'android', detected: false, confidence: 'LOW' },
        { platform: 'backend', detected: true, confidence: 'HIGH' },
        { platform: 'ios', detected: true, confidence: 'MEDIUM' },
      ]);

      const confidenceResponse = await fetch(`${baseUrl}/ai-evidence/platforms?detectedOnly=false&confidence=LOW`);
      assert.equal(confidenceResponse.status, 200);
      const confidenceFiltered = (await confidenceResponse.json()) as {
        filters?: { detectedOnly?: boolean; confidence?: string | null };
        total_count?: number;
        pagination?: {
          requested_limit?: number | null;
          max_limit?: number;
          limit?: number | null;
          offset?: number;
        };
        platforms?: Array<{ platform: string; detected: boolean; confidence: string }>;
      };
      assert.equal(confidenceFiltered.total_count, 1);
      assert.deepEqual(confidenceFiltered.filters, { detectedOnly: false, confidence: 'low' });
      assert.deepEqual(confidenceFiltered.pagination, {
        requested_limit: null,
        max_limit: 100,
        limit: null,
        offset: 0,
      });
      assert.deepEqual(confidenceFiltered.platforms, [
        { platform: 'android', detected: false, confidence: 'LOW' },
      ]);

      const pagedResponse = await fetch(
        `${baseUrl}/ai-evidence/platforms?detectedOnly=false&limit=1&offset=1`
      );
      assert.equal(pagedResponse.status, 200);
      const pagedBody = (await pagedResponse.json()) as {
        total_count?: number;
        pagination?: {
          requested_limit?: number | null;
          max_limit?: number;
          limit?: number | null;
          offset?: number;
        };
        platforms?: Array<{ platform: string; detected: boolean; confidence: string }>;
      };
      assert.equal(pagedBody.total_count, 3);
      assert.deepEqual(pagedBody.pagination, {
        requested_limit: 1,
        max_limit: 100,
        limit: 1,
        offset: 1,
        has_more: true,
      });
      assert.deepEqual(pagedBody.platforms, [
        { platform: 'backend', detected: true, confidence: 'HIGH' },
      ]);
    });
  });
});

test('returns ledger endpoint sorted deterministically', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    const payload = createEvidencePayload();
    payload.ledger = [
      {
        ruleId: 'backend.avoid-explicit-any',
        file: 'apps/backend/src/b.ts',
        lines: [30, 31],
        firstSeen: '2026-02-01T10:00:00.000Z',
        lastSeen: '2026-02-02T10:00:00.000Z',
      },
      {
        ruleId: 'backend.avoid-explicit-any',
        file: 'apps/backend/src/a.ts',
        lines: [10, 11],
        firstSeen: '2026-02-01T10:00:00.000Z',
        lastSeen: '2026-02-02T10:00:00.000Z',
      },
      {
        ruleId: 'backend.no-console-log',
        file: 'apps/backend/src/c.ts',
        firstSeen: '2026-02-01T10:00:00.000Z',
        lastSeen: '2026-02-01T10:00:00.000Z',
      },
    ];
    writeFileSync(join(repoRoot, '.ai_evidence.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence/ledger`);
      assert.equal(response.status, 200);
      const body = (await response.json()) as {
        version?: string;
        filters?: { lastSeenAfter?: string | null; lastSeenBefore?: string | null };
        total_count?: number;
        pagination?: {
          requested_limit?: number | null;
          max_limit?: number;
          limit?: number | null;
          offset?: number;
        };
        ledger?: Array<{ ruleId: string; file: string }>;
      };
      assert.equal(body.version, '2.1');
      assert.equal(body.total_count, 3);
      assert.deepEqual(body.filters, { lastSeenAfter: null, lastSeenBefore: null });
      assert.deepEqual(body.pagination, {
        requested_limit: null,
        max_limit: 100,
        limit: null,
        offset: 0,
      });
      assert.deepEqual(body.ledger, [
        {
          ruleId: 'backend.avoid-explicit-any',
          file: 'apps/backend/src/a.ts',
          lines: [10, 11],
          firstSeen: '2026-02-01T10:00:00.000Z',
          lastSeen: '2026-02-02T10:00:00.000Z',
        },
        {
          ruleId: 'backend.avoid-explicit-any',
          file: 'apps/backend/src/b.ts',
          lines: [30, 31],
          firstSeen: '2026-02-01T10:00:00.000Z',
          lastSeen: '2026-02-02T10:00:00.000Z',
        },
        {
          ruleId: 'backend.no-console-log',
          file: 'apps/backend/src/c.ts',
          firstSeen: '2026-02-01T10:00:00.000Z',
          lastSeen: '2026-02-01T10:00:00.000Z',
        },
      ]);

      const filteredResponse = await fetch(
        `${baseUrl}/ai-evidence/ledger?lastSeenAfter=2026-02-02t10:00:00.000z`
      );
      assert.equal(filteredResponse.status, 200);
      const filteredBody = (await filteredResponse.json()) as {
        filters?: { lastSeenAfter?: string | null; lastSeenBefore?: string | null };
        total_count?: number;
        pagination?: {
          requested_limit?: number | null;
          max_limit?: number;
          limit?: number | null;
          offset?: number;
        };
        ledger?: Array<{ ruleId: string; file: string }>;
      };
      assert.equal(filteredBody.total_count, 2);
      assert.deepEqual(filteredBody.filters, {
        lastSeenAfter: '2026-02-02t10:00:00.000z',
        lastSeenBefore: null,
      });
      assert.deepEqual(filteredBody.pagination, {
        requested_limit: null,
        max_limit: 100,
        limit: null,
        offset: 0,
      });
      assert.deepEqual(filteredBody.ledger, [
        {
          ruleId: 'backend.avoid-explicit-any',
          file: 'apps/backend/src/a.ts',
          lines: [10, 11],
          firstSeen: '2026-02-01T10:00:00.000Z',
          lastSeen: '2026-02-02T10:00:00.000Z',
        },
        {
          ruleId: 'backend.avoid-explicit-any',
          file: 'apps/backend/src/b.ts',
          lines: [30, 31],
          firstSeen: '2026-02-01T10:00:00.000Z',
          lastSeen: '2026-02-02T10:00:00.000Z',
        },
      ]);

      const pagedResponse = await fetch(`${baseUrl}/ai-evidence/ledger?limit=1&offset=1`);
      assert.equal(pagedResponse.status, 200);
      const pagedBody = (await pagedResponse.json()) as {
        total_count?: number;
        pagination?: {
          requested_limit?: number | null;
          max_limit?: number;
          limit?: number | null;
          offset?: number;
        };
        ledger?: Array<{ ruleId: string; file: string }>;
      };
      assert.equal(pagedBody.total_count, 3);
      assert.deepEqual(pagedBody.pagination, {
        requested_limit: 1,
        max_limit: 100,
        limit: 1,
        offset: 1,
        has_more: true,
      });
      assert.deepEqual(pagedBody.ledger, [
        {
          ruleId: 'backend.avoid-explicit-any',
          file: 'apps/backend/src/b.ts',
          lines: [30, 31],
          firstSeen: '2026-02-01T10:00:00.000Z',
          lastSeen: '2026-02-02T10:00:00.000Z',
        },
      ]);
    });
  });
});

test('returns snapshot endpoint with deterministic findings ordering', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    const payload = createEvidencePayload();
    payload.snapshot.findings = [
      {
        ruleId: 'backend.no-console-log',
        severity: 'WARN',
        code: 'backend.no-console-log',
        message: 'Avoid console.log',
        file: 'apps/backend/src/z.ts',
      },
      {
        ruleId: 'backend.avoid-explicit-any',
        severity: 'ERROR',
        code: 'backend.avoid-explicit-any',
        message: 'Avoid explicit any',
        file: 'apps/backend/src/a.ts',
        lines: [10],
      },
    ];
    writeFileSync(join(repoRoot, '.ai_evidence.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence/snapshot`);
      assert.equal(response.status, 200);
      const body = (await response.json()) as {
        version?: string;
        snapshot?: {
          stage?: string;
          outcome?: string;
          findings_count?: number;
          findings?: Array<{ ruleId: string; file: string }>;
        };
      };
      assert.equal(body.version, '2.1');
      assert.equal(body.snapshot?.stage, 'CI');
      assert.equal(body.snapshot?.outcome, 'PASS');
      assert.equal(body.snapshot?.findings_count, 2);
      assert.deepEqual(body.snapshot?.findings, [
        {
          ruleId: 'backend.avoid-explicit-any',
          severity: 'ERROR',
          code: 'backend.avoid-explicit-any',
          message: 'Avoid explicit any',
          file: 'apps/backend/src/a.ts',
          lines: [10],
        },
        {
          ruleId: 'backend.no-console-log',
          severity: 'WARN',
          code: 'backend.no-console-log',
          message: 'Avoid console.log',
          file: 'apps/backend/src/z.ts',
        },
      ]);
    });
  });
});

test('returns findings endpoint with deterministic ordering and filters', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    const payload = createEvidencePayload();
    payload.snapshot.findings = [
      {
        ruleId: 'backend.no-console-log',
        severity: 'WARN',
        code: 'backend.no-console-log',
        message: 'Avoid console.log',
        file: 'apps/backend/src/z.ts',
      },
      {
        ruleId: 'heuristics.ios.force-unwrap.ast',
        severity: 'ERROR',
        code: 'HEURISTICS_IOS_FORCE_UNWRAP_AST',
        message: 'Force unwrap detected.',
        file: 'apps/ios/Feature/View.swift',
      },
      {
        ruleId: 'backend.avoid-explicit-any',
        severity: 'ERROR',
        code: 'backend.avoid-explicit-any',
        message: 'Avoid explicit any',
        file: 'apps/backend/src/a.ts',
        lines: [10],
      },
    ];
    writeFileSync(join(repoRoot, '.ai_evidence.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence/findings`);
      assert.equal(response.status, 200);
      const body = (await response.json()) as {
        findings_count?: number;
        total_count?: number;
        pagination?: {
          requested_limit?: number | null;
          max_limit?: number;
          limit?: number | null;
          offset?: number;
        };
        findings?: Array<{ ruleId: string; file: string }>;
      };
      assert.equal(body.findings_count, 3);
      assert.equal(body.total_count, 3);
      assert.deepEqual(body.pagination, {
        requested_limit: null,
        max_limit: 100,
        limit: null,
        offset: 0,
      });
      assert.deepEqual(body.findings, [
        {
          ruleId: 'backend.avoid-explicit-any',
          severity: 'ERROR',
          code: 'backend.avoid-explicit-any',
          message: 'Avoid explicit any',
          file: 'apps/backend/src/a.ts',
          lines: [10],
        },
        {
          ruleId: 'backend.no-console-log',
          severity: 'WARN',
          code: 'backend.no-console-log',
          message: 'Avoid console.log',
          file: 'apps/backend/src/z.ts',
        },
        {
          ruleId: 'heuristics.ios.force-unwrap.ast',
          severity: 'ERROR',
          code: 'HEURISTICS_IOS_FORCE_UNWRAP_AST',
          message: 'Force unwrap detected.',
          file: 'apps/ios/Feature/View.swift',
        },
      ]);

      const severityResponse = await fetch(`${baseUrl}/ai-evidence/findings?severity=ERROR`);
      assert.equal(severityResponse.status, 200);
      const severityBody = (await severityResponse.json()) as {
        findings_count?: number;
        total_count?: number;
        filters?: { severity?: string | null };
      };
      assert.equal(severityBody.findings_count, 2);
      assert.equal(severityBody.total_count, 2);
      assert.equal(severityBody.filters?.severity, 'error');

      const platformResponse = await fetch(`${baseUrl}/ai-evidence/findings?platform=ios`);
      assert.equal(platformResponse.status, 200);
      const platformBody = (await platformResponse.json()) as {
        findings_count?: number;
        findings?: Array<{ ruleId: string }>;
        filters?: { platform?: string | null };
      };
      assert.equal(platformBody.findings_count, 1);
      assert.deepEqual(platformBody.findings, [
        {
          ruleId: 'heuristics.ios.force-unwrap.ast',
          severity: 'ERROR',
          code: 'HEURISTICS_IOS_FORCE_UNWRAP_AST',
          message: 'Force unwrap detected.',
          file: 'apps/ios/Feature/View.swift',
        },
      ]);
      assert.equal(platformBody.filters?.platform, 'ios');

      const ruleResponse = await fetch(
        `${baseUrl}/ai-evidence/findings?ruleId=backend.avoid-explicit-any`
      );
      assert.equal(ruleResponse.status, 200);
      const ruleBody = (await ruleResponse.json()) as {
        findings_count?: number;
        total_count?: number;
      };
      assert.equal(ruleBody.findings_count, 1);
      assert.equal(ruleBody.total_count, 1);

      const pagedResponse = await fetch(`${baseUrl}/ai-evidence/findings?limit=1&offset=1`);
      assert.equal(pagedResponse.status, 200);
      const pagedBody = (await pagedResponse.json()) as {
        findings_count?: number;
        total_count?: number;
        pagination?: {
          requested_limit?: number | null;
          max_limit?: number;
          limit?: number | null;
          offset?: number;
        };
        findings?: Array<{ ruleId: string }>;
      };
      assert.equal(pagedBody.findings_count, 1);
      assert.equal(pagedBody.total_count, 3);
      assert.deepEqual(pagedBody.pagination, {
        requested_limit: 1,
        max_limit: 100,
        limit: 1,
        offset: 1,
        has_more: true,
      });
      assert.deepEqual(pagedBody.findings, [
        {
          ruleId: 'backend.no-console-log',
          severity: 'WARN',
          code: 'backend.no-console-log',
          message: 'Avoid console.log',
          file: 'apps/backend/src/z.ts',
        },
      ]);

      const cappedResponse = await fetch(`${baseUrl}/ai-evidence/findings?limit=9999&offset=0`);
      assert.equal(cappedResponse.status, 200);
      const cappedBody = (await cappedResponse.json()) as {
        findings_count?: number;
        total_count?: number;
        pagination?: {
          requested_limit?: number | null;
          max_limit?: number;
          limit?: number | null;
          offset?: number;
        };
      };
      assert.equal(cappedBody.total_count, 3);
      assert.equal(cappedBody.findings_count, 3);
      assert.deepEqual(cappedBody.pagination, {
        requested_limit: 9999,
        max_limit: 100,
        limit: 100,
        offset: 0,
        has_more: false,
      });
    });
  });
});

test('returns compact payload without consolidation when includeSuppressed=false', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      `${JSON.stringify(createEvidencePayload(), null, 2)}\n`,
      'utf8'
    );

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence?includeSuppressed=false`);
      assert.equal(response.status, 200);
      const payload = (await response.json()) as { consolidation?: unknown };
      assert.equal(payload.consolidation, undefined);
    });
  });
});

test('supports view=compact and view=full aliases for consolidation payload', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      `${JSON.stringify(createEvidencePayload(), null, 2)}\n`,
      'utf8'
    );

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const compactResponse = await fetch(`${baseUrl}/ai-evidence?view=compact`);
      assert.equal(compactResponse.status, 200);
      const compactPayload = (await compactResponse.json()) as { consolidation?: unknown };
      assert.equal(compactPayload.consolidation, undefined);

      const fullResponse = await fetch(`${baseUrl}/ai-evidence?view=full`);
      assert.equal(fullResponse.status, 200);
      const fullPayload = (await fullResponse.json()) as {
        consolidation?: { suppressed?: unknown[] };
      };
      assert.equal(fullPayload.consolidation?.suppressed?.length, 1);
    });
  });
});

test('returns 404 when evidence file version is not v2.1', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      `${JSON.stringify({ version: '1.0' }, null, 2)}\n`,
      'utf8'
    );

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence`);
      assert.equal(response.status, 404);
    });
  });
});
