# ai_evidence v2.1

`ai_evidence v2.1` is the deterministic state store used by Git stages and CI.

## Structure

- `version`: must be `2.1` and is the source of truth
- `timestamp`: ISO timestamp of generation
- `snapshot`:
  - `stage`: `PRE_WRITE` | `PRE_COMMIT` | `PRE_PUSH` | `CI`
  - `audit_mode`: `gate` | `engine` (runtime execution mode traceability)
  - `outcome`: `PASS` | `WARN` | `BLOCK`
  - `files_scanned` (optional): files evaluated by gate scope (`repo`, `staged`, etc.)
  - `files_affected` (optional): unique files with findings in this snapshot
  - `evaluation_metrics` (optional):
    - `facts_total`
    - `rules_total`
    - `baseline_rules` | `heuristic_rules` | `skills_rules` | `project_rules`
    - `matched_rules` | `unmatched_rules`
    - `evaluated_rule_ids[]` | `matched_rule_ids[]` | `unmatched_rule_ids[]`
  - `rules_coverage` (optional):
    - `stage`
    - `active_rule_ids[]`
    - `evaluated_rule_ids[]`
    - `matched_rule_ids[]`
    - `unevaluated_rule_ids[]`
    - `unsupported_auto_rule_ids[]` (optional; AUTO skills without mapped detector)
    - `counts.active` | `counts.evaluated` | `counts.matched` | `counts.unevaluated`
    - `counts.unsupported_auto` (optional)
    - `coverage_ratio` (`0..1`)
  - `tdd_bdd` (optional):
    - `status`: `skipped` | `passed` | `blocked` | `waived`
    - `scope`: `in_scope`, `is_new_feature`, `is_complex_change`, `reasons[]`, `metrics`
    - `evidence`: `path`, `state`, `version`, `slices_total`, `slices_valid`, `slices_invalid`, `integrity_ok`, `errors[]`
    - `waiver`: `applied`, `path`, `approver`, `reason`, `expires_at`, `invalid_reason`
  - `findings[]`: normalized findings for the current run
    - `file`: normalized path (or `unknown` when no deterministic trace exists)
    - `lines` (optional): deterministic line evidence when available
    - `matchedBy` (optional): condition family that produced traceability (`FileContent`, `Heuristic`, `FileChange`, etc.)
    - `source` (optional): fact source used for traceability (`git:staged`, `heuristics:ast`, ...)
- `ledger[]`:
  - persistent open violations by key (`ruleId + file + lines`)
  - `firstSeen` / `lastSeen` maintained deterministically
- `platforms`:
  - active detected platforms with confidence (`HIGH` | `MEDIUM` | `LOW`)
- `rulesets[]`:
  - loaded bundles with versioned name and hash
  - effective skills resolution is reflected here (core/repo/custom as loaded bundles, e.g. `custom-guidelines@1.0.0`)
- `human_intent`:
  - preserved user goal state (or `null` when missing/expired)
  - `expires_at` is enforced deterministically (expired intent is ignored)
- `ai_gate`:
  - compatibility status and violation list
  - mirrors `human_intent` to avoid state drift
  - violations carry the same traceability fields as snapshot findings (`file`, `lines`, `matchedBy`, `source`)
- `severity_metrics`:
  - `gate_status` + `total_violations`
  - legacy projection: `by_severity` (`CRITICAL` | `ERROR` | `WARN` | `INFO`)
  - enterprise projection: `by_enterprise_severity` (`CRITICAL` | `HIGH` | `MEDIUM` | `LOW`)
- `repo_state` (optional):
  - repository operational snapshot captured at evidence generation time
  - `git`: branch/upstream/ahead-behind/dirty/staged/unstaged
  - `lifecycle`: managed hooks + installed/version state
- `consolidation` (optional):
  - `suppressed[]`: trace of equivalent findings removed from snapshot by deterministic semantic-family precedence

## Deterministic behavior

- Findings are deduplicated by `ruleId + file + lines`.
- `files_scanned` and `files_affected` are persisted independently to avoid telemetry drift.
- `rules_coverage` is normalized with sorted+deduplicated ids and deterministic counts.
- Declarative skills rules are kept in `active_rule_ids/evaluated_rule_ids` for deterministic coverage traceability even when no automatic detector exists yet.
- For selected semantic rule families, equivalent baseline/heuristic duplicates on the same file are consolidated to a single finding, keeping the highest-severity signal deterministically.
- Consolidation scope is file-level in v2.1: repeated same-family findings (including same rule on different lines) collapse to one deterministic representative.
- When consolidation removes findings, `consolidation.suppressed[]` keeps the trace (`ruleId`, `replacedByRuleId`, `reason`) for auditability.
- Ledger entries are updated if a violation still exists.
- Cleared violations are removed from ledger.
- Output JSON is written in stable key order.
- Canonical writer path is `integrations/evidence/generateEvidence.ts` (`buildEvidence` + `writeEvidence`).
- `pumuki install` bootstraps `.ai_evidence.json` when missing (`PRE_COMMIT`, `PASS`, empty findings).
- When `rules_coverage.unevaluated_rule_ids` is non-empty in `PRE_COMMIT`, `PRE_PUSH` or `CI`, the gate emits `governance.rules.coverage.incomplete` and forces `BLOCK`.
- When `rules_coverage.unsupported_auto_rule_ids` is non-empty in `PRE_COMMIT`, `PRE_PUSH` or `CI`, the gate emits `governance.skills.detector-mapping.incomplete` and forces `BLOCK`.
- When `tdd_bdd.status=blocked` for a new/complex change, the gate forces `BLOCK` with generic rule ids:
  - `generic_evidence_integrity_required`
  - `generic_bdd_feature_required`
  - `generic_tdd_vertical_required`
  - `generic_red_green_refactor_enforced`
- `audit_mode=gate` keeps strict enforcement semantics (SDD short-circuit when preconditions fail).
- `audit_mode=engine` keeps full-diagnostics semantics (continues rule evaluation even if SDD blocks).

## Overrides

Project overrides come from:

- `.pumuki/rules.ts`
- `pumuki.rules.ts`

Baseline locked rules remain immutable unless `allowOverrideLocked: true`.
