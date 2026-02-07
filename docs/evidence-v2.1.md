# ai_evidence v2.1

`ai_evidence v2.1` is the deterministic state store used by Git stages and CI.

## Structure

- `version`: must be `2.1` and is the source of truth
- `timestamp`: ISO timestamp of generation
- `snapshot`:
  - `stage`: `PRE_COMMIT` | `PRE_PUSH` | `CI`
  - `outcome`: `PASS` | `WARN` | `BLOCK`
  - `findings[]`: normalized findings for the current run
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
- `severity_metrics`:
  - gate status + totals by severity
- `consolidation` (optional):
  - `suppressed[]`: trace of equivalent findings removed from snapshot by deterministic semantic-family precedence

## Deterministic behavior

- Findings are deduplicated by `ruleId + file + lines`.
- For selected semantic rule families, equivalent baseline/heuristic duplicates on the same file are consolidated to a single finding, keeping the highest-severity signal deterministically.
- When consolidation removes findings, `consolidation.suppressed[]` keeps the trace (`ruleId`, `replacedByRuleId`, `reason`) for auditability.
- Ledger entries are updated if a violation still exists.
- Cleared violations are removed from ledger.
- Output JSON is written in stable key order.
- Canonical writer path is `integrations/evidence/generateEvidence.ts` (`buildEvidence` + `writeEvidence`).

## Overrides

Project overrides come from:

- `.pumuki/rules.ts`
- `pumuki.rules.ts`

Baseline locked rules remain immutable unless `allowOverrideLocked: true`.
