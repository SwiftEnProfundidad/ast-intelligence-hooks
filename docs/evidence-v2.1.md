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
- `ai_gate`:
  - compatibility status and violation list
- `severity_metrics`:
  - gate status + totals by severity

## Deterministic behavior

- Findings are deduplicated by `ruleId + file + lines`.
- Ledger entries are updated if a violation still exists.
- Cleared violations are removed from ledger.
- Output JSON is written in stable key order.

## Overrides

Project overrides come from:

- `.pumuki/rules.ts`
- `pumuki.rules.ts`

Baseline locked rules remain immutable unless `allowOverrideLocked: true`.
