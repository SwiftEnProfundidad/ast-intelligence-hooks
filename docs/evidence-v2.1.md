# ai_evidence v2.1

`ai_evidence v2.1` is the deterministic state store used by Git stages and CI.

## Structure

- `version`: must be `2.1` and is the source of truth
- `timestamp`: ISO timestamp of generation
- `snapshot`:
  - `stage`: `PRE_WRITE` | `PRE_COMMIT` | `PRE_PUSH` | `CI`
  - `outcome`: `PASS` | `WARN` | `BLOCK`
  - `files_scanned` (optional): files evaluated by gate scope (`repo`, `staged`, etc.)
  - `files_affected` (optional): unique files with findings in this snapshot
  - `evaluation_metrics` (optional):
    - `facts_total`
    - `rules_total`
    - `baseline_rules` | `heuristic_rules` | `skills_rules` | `project_rules`
    - `matched_rules` | `unmatched_rules`
    - `evaluated_rule_ids[]` | `matched_rule_ids[]` | `unmatched_rule_ids[]`
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
- `human_intent`:
  - preserved user goal state (or `null` when missing/expired)
  - `expires_at` is enforced deterministically (expired intent is ignored)
- `ai_gate`:
  - compatibility status and violation list
  - mirrors `human_intent` to avoid state drift
  - violations carry the same traceability fields as snapshot findings (`file`, `lines`, `matchedBy`, `source`)
- `severity_metrics`:
  - gate status + totals by severity
- `repo_state` (optional):
  - repository operational snapshot captured at evidence generation time
  - `git`: branch/upstream/ahead-behind/dirty/staged/unstaged
  - `lifecycle`: managed hooks + installed/version state
- `consolidation` (optional):
  - `suppressed[]`: trace of equivalent findings removed from snapshot by deterministic semantic-family precedence

## Deterministic behavior

- Findings are deduplicated by `ruleId + file + lines`.
- `files_scanned` and `files_affected` are persisted independently to avoid telemetry drift.
- For selected semantic rule families, equivalent baseline/heuristic duplicates on the same file are consolidated to a single finding, keeping the highest-severity signal deterministically.
- Consolidation scope is file-level in v2.1: repeated same-family findings (including same rule on different lines) collapse to one deterministic representative.
- When consolidation removes findings, `consolidation.suppressed[]` keeps the trace (`ruleId`, `replacedByRuleId`, `reason`) for auditability.
- Ledger entries are updated if a violation still exists.
- Cleared violations are removed from ledger.
- Output JSON is written in stable key order.
- Canonical writer path is `integrations/evidence/generateEvidence.ts` (`buildEvidence` + `writeEvidence`).
- `pumuki install` bootstraps `.ai_evidence.json` when missing (`PRE_COMMIT`, `PASS`, empty findings).

## Overrides

Project overrides come from:

- `.pumuki/rules.ts`
- `pumuki.rules.ts`

Baseline locked rules remain immutable unless `allowOverrideLocked: true`.
