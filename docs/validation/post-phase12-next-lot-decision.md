# Post-Phase12 Next-Lot Decision Pack

Date: 2026-02-18  
Context: section `12.x` is closed with `GO` in `docs/validation/phase12-go-no-go-report.md`.

## Decision Required

Select exactly one path for the next lot:

1. **Release path** (publish next npm version now).
2. **Hardening path** (execute an additional stabilization cycle before publishing).

This document is an implementation-oriented decision packet. It does not prescribe product strategy.

## Current Baseline (Objective)

- `12.x` closure is complete (`GO`).
- Runtime docs were aligned with current behavior (`README`, `docs/USAGE.md`, `docs/INSTALLATION.md`).
- Mock-only validations for `PRE_PUSH` upstream fail-safe, CI fallback order, hook drift recovery, and lifecycle mismatch recovery are documented in `docs/REFRACTOR_PROGRESS.md`.
- Checklist closure is recorded in `docs/PUMUKI_FULL_VALIDATION_CHECKLIST.md`.

## Option A — Release Path (Publish Now)

### Entry criteria (already satisfied)

- Phase 12 closure complete.
- Go/no-go report exists and is traceable.
- Runtime docs and changelog aligned.

### Atomic implementation tasks

1. Bump version (`package.json`, `VERSION`, changelog header/release notes alignment).
2. Publish to npm (`latest` and policy-compliant tag handling).
3. Post-publish verification in mock consumer from npm.
4. Update tracker with published version and verification evidence.

### Main benefit

- Fast delivery of the currently validated runtime contract.

### Main risk

- Any non-critical hardening opportunities move to post-release backlog.

## Option B — Hardening Path (One More Stabilization Round)

### Candidate hardening scope

1. Additional mock-only regression matrix around SDD bypass boundaries (without changing policy contract).
2. Additional docs consistency pass for consumer/operator runbooks under `docs/validation/*`.
3. Optional extra test consolidation to reduce future maintenance noise (without changing runtime semantics).

### Atomic implementation tasks

1. Define hardening acceptance criteria.
2. Implement hardening deltas in small atomic commits.
3. Re-run deterministic and mock-only validations required by criteria.
4. Re-issue go/no-go note after hardening.

### Main benefit

- Lower post-release correction probability.

### Main risk

- Delays package publication despite current `GO`.

## Recommended Operator Input

To proceed without ambiguity, provide one explicit instruction:

- `Proceed with release path`
- `Proceed with hardening path`

Once selected, execution will continue in atomic tasks with tracker updates after each task.
