# MCP Evidence Context Server

Read-only server to expose deterministic evidence before agent actions.

## Endpoint

- `GET /ai-evidence`: returns `.ai_evidence.json` when `version === "2.1"`
- `GET /ai-evidence?includeSuppressed=false`: compact response without `consolidation.suppressed[]`
- `GET /ai-evidence?view=compact`: alias to hide `consolidation.suppressed[]`
- `GET /ai-evidence?view=full`: explicit full response (default behavior)
- `GET /ai-evidence/summary`: compact deterministic summary (`stage/outcome/has_findings/counts/findings_files_count/findings_rules_count/findings_with_lines_count/findings_without_lines_count/severity_counts/findings_by_platform/highest_severity/blocking_findings_count/ledger_count/ledger_files_count/ledger_rules_count/ledger_by_platform/rulesets_count/rulesets_platforms_count/rulesets_bundles_count/rulesets_hashes_count/rulesets_by_platform/rulesets_fingerprint/platform_confidence_counts/suppressed_findings_count/suppressed_replacement_rules_count/suppressed_platforms_count/suppressed_files_count/suppressed_rules_count/suppressed_reasons_count/suppressed_with_replacement_count/suppressed_without_replacement_count/suppressed_rule_file_pairs_count/suppressed_reasons_with_replacement_count/suppressed_reasons_without_replacement_count/suppressed_platform_rule_pairs_count/suppressed_platform_file_pairs_count/suppressed_replacement_rule_file_pairs_count/suppressed_replacement_rule_platform_pairs_count/suppressed_replacement_platforms_count/suppressed_non_replacement_platforms_count/suppressed_non_replacement_reason_file_pairs_count/suppressed_non_replacement_rule_file_pairs_count/suppressed_non_replacement_rule_platform_pairs_count/suppressed_non_replacement_reasons_count/suppressed_replacement_reason_file_pairs_count/suppressed_replacement_rule_reason_pairs_count/suppressed_replacement_rule_ids_count/suppressed_replacement_reasons_count/suppressed_replacement_rule_file_platform_triples_count/suppressed_non_replacement_rule_file_platform_triples_count/suppressed_reason_rule_file_triples_count/suppressed_reason_rule_platform_triples_count/suppressed_reason_file_platform_triples_count/suppressed_reason_platform_pairs_count/suppressed_reason_file_pairs_count/suppressed_replacement_reason_platform_pairs_count/suppressed_non_replacement_reason_platform_pairs_count/suppressed_replacement_reason_rule_file_triples_count/suppressed_non_replacement_reason_rule_file_triples_count/suppressed_replacement_reason_rule_platform_triples_count/suppressed_non_replacement_reason_rule_platform_triples_count/suppressed_reason_rule_file_platform_quadruples_count/suppressed_replacement_reason_rule_file_platform_quadruples_count/suppressed_non_replacement_reason_rule_file_platform_quadruples_count/suppressed_reason_rule_file_platform_replacement_split_count/suppressed_replacement_split_modes_count/suppressed_replacement_split_mode_replacement_count/suppressed_replacement_split_mode_non_replacement_count/suppressed_reason_rule_file_platform_replacement_dual_mode_count/suppressed_replacement_rule_file_platform_distinct_count/suppressed_non_replacement_rule_file_platform_distinct_count/suppressed_rule_file_platform_distinct_total_count/suppressed_replacement_rule_file_platform_share_of_total_pct/suppressed_non_replacement_rule_file_platform_share_of_total_pct/suppressed_replacement_vs_non_replacement_share_gap_pct/suppressed_replacement_rule_file_platform_dominance_pct/suppressed_replacement_minus_non_replacement_share_signed_pct/suppressed_non_replacement_rule_file_platform_dominance_pct/suppressed_share_polarization_index_pct/suppressed_share_balance_score_pct/suppressed_share_imbalance_index_pct/suppressed_share_polarization_balance_gap_pct/suppressed_share_net_polarity_pct/suppressed_share_direction/tracked_platforms_count/detected_platforms_count/non_detected_platforms_count/detected platforms`)
- `GET /ai-evidence/snapshot`: deterministic snapshot payload (`stage/outcome/findings_count/findings[]`)
- `GET /ai-evidence/findings`: deterministic findings list with optional filters (`severity`, `ruleId`, `platform`)
- `GET /ai-evidence/findings?limit=...&offset=...`: deterministic paginated findings slice
  - `limit` is bounded by deterministic `maxLimit=100`
  - pagination metadata includes `has_more` when `limit` is provided
- `GET /ai-evidence/rulesets`: deterministic sorted list of loaded rulesets (`platform/bundle/hash`)
- `GET /ai-evidence/rulesets?platform=...&bundle=...`: deterministic filtered rulesets slice
- `GET /ai-evidence/rulesets?limit=...&offset=...`: deterministic paginated rulesets slice (`maxLimit=100`)
  - pagination metadata includes `has_more` when `limit` is provided
- `GET /ai-evidence/platforms`: detected platforms only (default)
- `GET /ai-evidence/platforms?detectedOnly=false`: all tracked platforms with detection state
- `GET /ai-evidence/platforms?detectedOnly=false&confidence=LOW`: deterministic filtered slice by confidence
- `GET /ai-evidence/platforms?detectedOnly=false&limit=...&offset=...`: deterministic paginated platform slice (`maxLimit=100`)
  - pagination metadata includes `has_more` when `limit` is provided
- `GET /ai-evidence/ledger`: deterministic sorted ledger entries (`ruleId/file/lines/firstSeen/lastSeen`)
- `GET /ai-evidence/ledger?lastSeenAfter=...&lastSeenBefore=...`: deterministic filtered ledger slice
- `GET /ai-evidence/ledger?lastSeenAfter=...&lastSeenBefore=...&limit=...&offset=...`: deterministic filtered/paginated ledger slice (`maxLimit=100`)
  - pagination metadata includes `has_more` when `limit` is provided
- `GET /health`: basic liveness probe
- `GET /status`: lightweight summary (`present/valid/version/stage/outcome/has_findings/counts/findings_files_count/findings_rules_count/findings_with_lines_count/findings_without_lines_count/severity_counts/findings_by_platform/highest_severity/blocking_findings_count/ledger_count/ledger_files_count/ledger_rules_count/ledger_by_platform/rulesets_count/rulesets_platforms_count/rulesets_bundles_count/rulesets_hashes_count/rulesets_by_platform/rulesets_fingerprint/platform_confidence_counts/suppressed_findings_count/suppressed_replacement_rules_count/suppressed_platforms_count/suppressed_files_count/suppressed_rules_count/suppressed_reasons_count/suppressed_with_replacement_count/suppressed_without_replacement_count/suppressed_rule_file_pairs_count/suppressed_reasons_with_replacement_count/suppressed_reasons_without_replacement_count/suppressed_platform_rule_pairs_count/suppressed_platform_file_pairs_count/suppressed_replacement_rule_file_pairs_count/suppressed_replacement_rule_platform_pairs_count/suppressed_replacement_platforms_count/suppressed_non_replacement_platforms_count/suppressed_non_replacement_reason_file_pairs_count/suppressed_non_replacement_rule_file_pairs_count/suppressed_non_replacement_rule_platform_pairs_count/suppressed_non_replacement_reasons_count/suppressed_replacement_reason_file_pairs_count/suppressed_replacement_rule_reason_pairs_count/suppressed_replacement_rule_ids_count/suppressed_replacement_reasons_count/suppressed_replacement_rule_file_platform_triples_count/suppressed_non_replacement_rule_file_platform_triples_count/suppressed_reason_rule_file_triples_count/suppressed_reason_rule_platform_triples_count/suppressed_reason_file_platform_triples_count/suppressed_reason_platform_pairs_count/suppressed_reason_file_pairs_count/suppressed_replacement_reason_platform_pairs_count/suppressed_non_replacement_reason_platform_pairs_count/suppressed_replacement_reason_rule_file_triples_count/suppressed_non_replacement_reason_rule_file_triples_count/suppressed_replacement_reason_rule_platform_triples_count/suppressed_non_replacement_reason_rule_platform_triples_count/suppressed_reason_rule_file_platform_quadruples_count/suppressed_replacement_reason_rule_file_platform_quadruples_count/suppressed_non_replacement_reason_rule_file_platform_quadruples_count/suppressed_reason_rule_file_platform_replacement_split_count/suppressed_replacement_split_modes_count/suppressed_replacement_split_mode_replacement_count/suppressed_replacement_split_mode_non_replacement_count/suppressed_reason_rule_file_platform_replacement_dual_mode_count/suppressed_replacement_rule_file_platform_distinct_count/suppressed_non_replacement_rule_file_platform_distinct_count/suppressed_rule_file_platform_distinct_total_count/suppressed_replacement_rule_file_platform_share_of_total_pct/suppressed_non_replacement_rule_file_platform_share_of_total_pct/suppressed_replacement_vs_non_replacement_share_gap_pct/suppressed_replacement_rule_file_platform_dominance_pct/suppressed_replacement_minus_non_replacement_share_signed_pct/suppressed_non_replacement_rule_file_platform_dominance_pct/suppressed_share_polarization_index_pct/suppressed_share_balance_score_pct/suppressed_share_imbalance_index_pct/suppressed_share_polarization_balance_gap_pct/suppressed_share_net_polarity_pct/suppressed_share_direction/tracked_platforms_count/detected_platforms_count/non_detected_platforms_count`) plus `context_api` capabilities (`endpoints`, supported filters, deterministic pagination bounds)

## Runtime

- Default host: `127.0.0.1`
- Default port: `7341`
- Default route: `/ai-evidence`

## CLI

```bash
npm run mcp:evidence
# or:
npx --yes tsx@4.21.0 integrations/mcp/evidenceContextServer.cli.ts
```

Environment variables:

- `PUMUKI_EVIDENCE_HOST`
- `PUMUKI_EVIDENCE_PORT`
- `PUMUKI_EVIDENCE_ROUTE`

## Guarantees

- Read-only: no writes, no mutation endpoints.
- Returns `404` when evidence is missing or not `v2.1`.
- Uses repository root `.ai_evidence.json` as source.

## Contract Snippets

`GET /status` capability payload (excerpt):

```json
{
  "context_api": {
    "filters": {
      "findings": ["severity", "ruleId", "platform", "limit", "offset", "maxLimit"],
      "rulesets": ["platform", "bundle", "limit", "offset", "maxLimit"],
      "platforms": ["detectedOnly", "confidence", "limit", "offset", "maxLimit"],
      "ledger": ["lastSeenAfter", "lastSeenBefore", "limit", "offset", "maxLimit"]
    },
    "pagination_bounds": {
      "findings": { "max_limit": 100 },
      "rulesets": { "max_limit": 100 },
      "platforms": { "max_limit": 100 },
      "ledger": { "max_limit": 100 }
    }
  }
}
```

Paginated endpoint payload (excerpt):

```json
{
  "total_count": 3,
  "pagination": {
    "requested_limit": 1,
    "max_limit": 100,
    "limit": 1,
    "offset": 1,
    "has_more": true
  }
}
```

Summary payload facet (excerpt):

```json
{
  "snapshot": {
    "stage": "CI",
    "outcome": "PASS",
    "has_findings": true,
    "findings_count": 2,
    "findings_files_count": 1,
    "findings_rules_count": 2,
    "findings_with_lines_count": 2,
    "findings_without_lines_count": 0,
    "severity_counts": { "ERROR": 1, "WARN": 1 },
    "findings_by_platform": { "backend": 1, "ios": 1 },
    "highest_severity": "ERROR",
    "blocking_findings_count": 1
  },
  "ledger_count": 2,
  "ledger_files_count": 2,
  "ledger_rules_count": 2,
  "rulesets_count": 2,
  "rulesets_platforms_count": 2,
  "rulesets_bundles_count": 2,
  "rulesets_hashes_count": 2,
  "ledger_by_platform": { "backend": 1, "ios": 1 },
  "rulesets_by_platform": { "backend": 1, "ios": 1 },
  "rulesets_fingerprint": "222|111",
  "platform_confidence_counts": { "HIGH": 2, "LOW": 1 },
  "suppressed_findings_count": 1,
  "suppressed_replacement_rules_count": 1,
  "suppressed_platforms_count": 1,
  "suppressed_files_count": 1,
  "suppressed_rules_count": 1,
  "suppressed_reasons_count": 1,
  "suppressed_with_replacement_count": 1,
  "suppressed_without_replacement_count": 0,
  "suppressed_rule_file_pairs_count": 1,
  "suppressed_reasons_with_replacement_count": 1,
  "suppressed_reasons_without_replacement_count": 0,
  "suppressed_platform_rule_pairs_count": 1,
  "suppressed_platform_file_pairs_count": 1,
  "suppressed_replacement_rule_file_pairs_count": 1,
  "suppressed_replacement_rule_platform_pairs_count": 1,
  "suppressed_replacement_platforms_count": 1,
  "suppressed_non_replacement_platforms_count": 0,
  "suppressed_non_replacement_reason_file_pairs_count": 0,
  "suppressed_non_replacement_rule_file_pairs_count": 0,
  "suppressed_non_replacement_rule_platform_pairs_count": 0,
  "suppressed_non_replacement_reasons_count": 0,
  "suppressed_replacement_reason_file_pairs_count": 1,
  "suppressed_replacement_rule_reason_pairs_count": 1,
  "suppressed_replacement_rule_ids_count": 1,
  "suppressed_replacement_reasons_count": 1,
  "suppressed_replacement_rule_file_platform_triples_count": 1,
  "suppressed_non_replacement_rule_file_platform_triples_count": 0,
  "suppressed_reason_rule_file_triples_count": 1,
  "suppressed_reason_rule_platform_triples_count": 1,
  "suppressed_reason_file_platform_triples_count": 1,
  "suppressed_reason_platform_pairs_count": 1,
  "suppressed_reason_file_pairs_count": 1,
  "suppressed_replacement_reason_platform_pairs_count": 1,
  "suppressed_non_replacement_reason_platform_pairs_count": 0,
  "suppressed_replacement_reason_rule_file_triples_count": 1,
  "suppressed_non_replacement_reason_rule_file_triples_count": 0,
  "suppressed_replacement_reason_rule_platform_triples_count": 1,
  "suppressed_non_replacement_reason_rule_platform_triples_count": 0,
  "suppressed_reason_rule_file_platform_quadruples_count": 1,
  "suppressed_replacement_reason_rule_file_platform_quadruples_count": 1,
  "suppressed_non_replacement_reason_rule_file_platform_quadruples_count": 0,
  "suppressed_reason_rule_file_platform_replacement_split_count": 1,
  "suppressed_replacement_split_modes_count": 1,
  "suppressed_replacement_split_mode_replacement_count": 1,
  "suppressed_replacement_split_mode_non_replacement_count": 0,
  "suppressed_reason_rule_file_platform_replacement_dual_mode_count": 0,
  "suppressed_replacement_rule_file_platform_distinct_count": 1,
  "suppressed_non_replacement_rule_file_platform_distinct_count": 0,
  "suppressed_rule_file_platform_distinct_total_count": 1,
  "suppressed_replacement_rule_file_platform_share_of_total_pct": 100,
  "suppressed_non_replacement_rule_file_platform_share_of_total_pct": 0,
  "suppressed_replacement_vs_non_replacement_share_gap_pct": 100,
  "suppressed_replacement_rule_file_platform_dominance_pct": 100,
  "suppressed_replacement_minus_non_replacement_share_signed_pct": 100,
  "suppressed_non_replacement_rule_file_platform_dominance_pct": 0,
  "suppressed_share_polarization_index_pct": 100,
  "suppressed_share_balance_score_pct": 0,
  "suppressed_share_imbalance_index_pct": 100,
  "suppressed_share_polarization_balance_gap_pct": 100,
  "suppressed_share_net_polarity_pct": 100,
  "suppressed_share_direction": "replacement",
  "tracked_platforms_count": 3,
  "detected_platforms_count": 2,
  "non_detected_platforms_count": 1
}
```
