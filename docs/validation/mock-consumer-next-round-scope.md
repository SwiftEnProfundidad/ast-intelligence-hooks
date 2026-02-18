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

## Third Atomic Task

- Harden artifact lifecycle behavior in `pumuki-mock-consumer/scripts/run-pumuki-matrix.sh` so failed runs do not leave stale-success summaries.
- On non-zero execution (guardrail or stage failure), ensure `artifacts/pumuki-matrix-summary.json` is removed or updated with a deterministic `FAIL` verdict (single-source-of-truth, no stale PASS file).

### Acceptance Criteria for Third Task

1. Dirty-baseline run (expected fail-fast) does not leave a stale `PASS` summary artifact.
2. Successful run still writes a valid `PASS` summary artifact with the same parseable schema.
3. Console output contract remains unchanged.
4. The behavior is reproducible in back-to-back runs (`fail` then `pass`, `pass` then `fail`).

Status:
- `✅` implemented (mock commit `9b49a6e`), validated with deterministic sequence:
  - `fail` (`exit 17`) => summary artifact absent
  - `pass` (`npm run pumuki:matrix`) => summary artifact present with `final_verdict=PASS`
  - `fail` (`exit 17`) => summary artifact absent again (no stale `PASS`)

## Fourth Atomic Task

- Add deterministic failure-report artifact handling in `pumuki-mock-consumer/scripts/run-pumuki-matrix.sh`.
- On non-zero execution, write `artifacts/pumuki-matrix-last-failure.json` with stable machine-readable fields:
  - package spec,
  - timestamp UTC,
  - exit code,
  - failure phase (`preflight` or scenario name when available),
  - final verdict (`FAIL`).
- On successful matrix completion, remove any stale `pumuki-matrix-last-failure.json`.

### Acceptance Criteria for Fourth Task

1. Dirty-baseline fail-fast run (`exit 17`) creates `pumuki-matrix-last-failure.json` with `final_verdict=FAIL` and `exit_code=17`.
2. Successful run removes stale `pumuki-matrix-last-failure.json` and still writes valid `pumuki-matrix-summary.json` (`final_verdict=PASS`).
3. Back-to-back behavior is deterministic (`fail -> pass -> fail`) for both artifacts (`summary` and `last-failure`).
4. Existing console output contract remains unchanged.

Status:
- `✅` implemented (mock commit `d3427c7`), validated with deterministic sequence:
  - `fail` (`exit 17`) => `summary` absent, `last-failure` present (`final_verdict=FAIL`, `exit_code=17`, `failure_phase=preflight`)
  - `pass` (`npm run pumuki:matrix`) => `summary` present (`final_verdict=PASS`), `last-failure` absent
  - `fail` (`exit 17`) => `summary` absent, `last-failure` present again with `final_verdict=FAIL`

## Fifth Atomic Task

- Extend failure metadata in `artifacts/pumuki-matrix-last-failure.json` to include deterministic execution context for triage:
  - `failure_step` (stable enum-like value),
  - `failure_log_path` (when an internal step log exists),
  - keep existing fields unchanged for backward compatibility.
- Ensure the runner sets scenario-aware context when a failure happens after preflight (`scenario=<name>` + step), not only `preflight`.

### Acceptance Criteria for Fifth Task

1. Dirty-baseline fail-fast (`exit 17`) still reports `failure_phase=preflight`, includes deterministic `failure_step`, and keeps `final_verdict=FAIL`.
2. A forced scenario failure path after preflight records scenario-aware failure context (`failure_phase=<scenario>` + deterministic `failure_step`).
3. Existing consumers of `pumuki-matrix-last-failure.json` remain compatible (old keys still present; schema stable).
4. Console output contract remains unchanged and summary artifact behavior from task 3/4 is preserved.

## Out of Scope (current round)

- Changes to rule semantics.
- Changes to stage policy severity thresholds.
- Additional scenario creation.
