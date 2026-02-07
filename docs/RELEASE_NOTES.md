# Release Notes (v2.x line)

This file tracks the active deterministic framework line used in this repository.

For implementation detail by phase, see:

- `docs/pr-reports/phase-1-multi-platform.md`
- `docs/pr-reports/phase-2-frontend-android.md`
- `docs/pr-reports/phase-3-cli.md`
- `docs/pr-reports/phase-4-docs.md`
- `docs/pr-reports/phase-5-hardening.md`
- `docs/pr-reports/phase-6-mcp-context.md`

## 2026-02 (enterprise-refactor updates)

### Deterministic gate foundation

- Shared execution flow consolidated in `integrations/git/runPlatformGate.ts`.
- Stage runners unified in `integrations/git/stageRunners.ts`.
- Stage policies standardized in `integrations/gate/stagePolicies.ts`.

### Multi-platform support

- Combined detection and evaluation for `ios`, `backend`, `frontend`, `android`.
- Stage wrappers exported for all supported platforms (`PRE_COMMIT`, `PRE_PUSH`, `CI`).

### Evidence v2.1

- Canonical schema and deterministic write path (`snapshot + ledger`).
- Stable serialization and rule-pack hash traceability.
- `human_intent` preservation + expiry enforcement.

### CI integration

- Reusable gate workflow template plus platform-specific workflows.
- Evidence artifact upload standardized across runs.

### AST heuristics pilot

- Typed heuristic facts extracted in core domain.
- Declarative heuristic rule-pack with optional feature flag.
- Stage-aware heuristic maturity:
  - `PRE_COMMIT`: heuristic findings remain `WARN`
  - `PRE_PUSH` / `CI`: selected heuristics promoted to `ERROR`

### Documentation cleanup

- Primary and secondary docs rewritten to v2.x model:
  - `README.md`
  - `docs/USAGE.md`
  - `docs/HOW_IT_WORKS.md`
  - `docs/API_REFERENCE.md`

## Notes

- Legacy 5.3.4 migration/release notes were removed from active docs to avoid drift.
- Historical commit trace remains available in Git history.
