# Mock Consumer Next-Round Scope (Post Next-Cycle Closure)

This document defines the scope of the next enterprise round after the successful closure of the normalized next-cycle checklist.

## Round Objective

Harden operational reproducibility and operator safety of the mock validation flow, so matrix execution remains deterministic and fail-fast under invalid local baselines.

## Acceptance Criteria

1. Matrix runner fails fast when the source mock repository baseline is dirty.
2. Failure message is explicit and actionable (what is dirty and what command to run next).
3. Clean baseline keeps current deterministic contract unchanged:
   - `clean => 0/0/0`
   - `violations => 1/1/1`
   - `mixed => 1/1/1`
4. Handoff/tracker include outcome evidence and exit status.

## First Atomic Task

- Add a preflight guard in `pumuki-mock-consumer/scripts/run-pumuki-matrix.sh` that validates source repo cleanliness before cloning/running scenarios.
- If dirty, exit non-zero with deterministic guidance and do not continue stage execution.

Status:
- `✅` implemented (mock commit `5f8c06b`), validated with dirty baseline `exit 17` and clean baseline matrix `PASS`.

## Second Atomic Task

- Add deterministic run-summary artifact output in `pumuki-mock-consumer/scripts/run-pumuki-matrix.sh`.
- On successful matrix completion, write a machine-readable summary file under repo `artifacts/` with:
  - package spec used,
  - per-scenario exit codes (`pre-commit`, `pre-push`, `ci`),
  - final matrix verdict (`PASS`/`FAIL`),
  - execution timestamp.

### Acceptance Criteria for Second Task

1. `npm run pumuki:matrix` with clean baseline still prints current console contract unchanged.
2. A deterministic summary artifact file is produced under `artifacts/` after each successful run.
3. Artifact fields are stable and parseable with `jq`.
4. Existing expected exits remain unchanged:
   - `clean => 0/0/0`
   - `violations => 1/1/1`
   - `mixed => 1/1/1`

Status:
- `✅` implemented (mock commit `24dd39a`), validated with artifact contract check `summary_contract=PASS`.

## Out of Scope (current round)

- Changes to rule semantics.
- Changes to stage policy severity thresholds.
- Additional scenario creation.
