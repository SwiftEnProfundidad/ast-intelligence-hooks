# Release Notes (v2.x line)

This file tracks the active deterministic framework line used in this repository.
Detailed commit history remains available through Git history (`git log` / `git show`).

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
- iOS force-cast (`as!`) heuristic added to coverage.
- Stage-aware heuristic maturity:
  - `PRE_COMMIT`: heuristic findings remain `WARN`
  - `PRE_PUSH` / `CI`: selected heuristics promoted to `ERROR`

### Documentation cleanup

- Primary and secondary docs rewritten to v2.x model:
  - `README.md`
  - `docs/USAGE.md`
  - `docs/HOW_IT_WORKS.md`
  - `docs/API_REFERENCE.md`

### Hardening and validation updates (latest)

- Evidence consolidation hardened:
  - deterministic file-level collapse across same semantic family, including same-rule multi-line duplicates
  - additive `consolidation.suppressed[]` trace for auditability
- MCP evidence server expanded with compact/full filters:
  - `includeSuppressed=false`
  - `view=compact|full`
- IDE adapter cascade-hook runtime hardening (Adapter baseline):
  - robust Node resolver wrapper
  - optional strict mode `PUMUKI_HOOK_STRICT_NODE=1`
  - explicit diagnostics (`--diagnose`, `PUMUKI_HOOK_DIAGNOSTIC=1`)
  - local diagnostics collector + repeatable local simulation command:
    - `npm run validate:adapter-hooks-local`
  - provider-agnostic alias commands:
    - `npm run validation:adapter-session-status`
    - `npm run validation:adapter-real-session-report`
  - real-session validation checklist:
    - `docs/validation/adapter-hook-runtime-validation.md`
- Consumer startup diagnostics one-shot orchestrator:
  - `npm run validation:consumer-startup-triage`
- Phase 5 blockers readiness report:
  - `npm run validation:phase5-blockers-readiness`
  - Adapter report is optional by default; use `--require-adapter-report` for strict adapter-mode gating.
  - deterministic verdicts: `READY | BLOCKED | MISSING_INPUTS`
- Phase 5 execution closure status snapshot:
  - `npm run validation:phase5-execution-closure-status`
  - deterministic verdicts: `READY | BLOCKED | MISSING_INPUTS`
  - framework menu action:
    - `Build phase5 execution closure status report`
- Phase 5 execution closure one-shot orchestration:
  - `npm run validation:phase5-execution-closure`
  - executes adapter diagnostics (optional), consumer startup triage, blockers readiness, and closure status in one command
  - includes consumer auth/scope preflight and fail-fast behavior before triage
  - optional bypass: `--skip-auth-preflight`
  - emits deterministic run summary (recommended out-dir): `.audit-reports/phase5/phase5-execution-closure-run-report.md`
  - framework menu action:
    - `Run phase5 execution closure (one-shot orchestration)`
- Adapter-only readiness report:
  - `npm run validation:adapter-readiness`
  - deterministic verdicts: `READY | BLOCKED | PENDING`
- IDE-agnostic gate boundary hardening:
  - runtime boundary test in `integrations/git/__tests__/ideAgnosticBoundary.test.ts`
  - explicit architecture/docs contract that IDE diagnostics remain optional adapters
- Active docs governance hardening:
  - provider-agnostic docs guardrail test:
    - `scripts/__tests__/enterprise-docs-agnostic.test.ts`
  - docs index coverage guardrail test:
    - `scripts/__tests__/docs-index-coverage.test.ts`
- Compatibility command hardening:
  - legacy provider-named hook scripts now delegate to adapter-native scripts in `package.json`
  - regression guardrail:
    - `scripts/__tests__/adapter-script-aliases.test.ts`
- Provider-agnostic legacy ruleset resolution:
  - `integrations/git/resolveLegacyRulesetFile.ts`
  - discovers legacy tooling rule directories without provider-specific hardcoding
  - regression guardrail:
    - `integrations/git/__tests__/resolveLegacyRulesetFile.test.ts`
- Phase 5 execution closure runbook:
  - `docs/validation/phase5-execution-closure.md`
- Validation artifact hygiene helper:
  - `npm run validation:clean-artifacts` (`--dry-run` supported)
  - cleans local generated `docs/validation/**/artifacts` directories and `.audit_tmp`
  - framework menu action:
    - `Clean local validation artifacts`
- Rule-pack docs drift prevention:
  - automated version sync test `scripts/__tests__/rule-pack-docs-sync.test.ts`

## Notes

- Legacy 5.3.4 migration/release notes were removed from active docs to avoid drift.
- Historical commit trace remains available in Git history.
