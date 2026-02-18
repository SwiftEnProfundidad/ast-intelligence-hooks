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

## Out of Scope (for this first task)

- Changes to rule semantics.
- Changes to stage policy severity thresholds.
- Additional scenario creation.
