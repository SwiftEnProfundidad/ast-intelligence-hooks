# Release Notes (v2.x line)

This file tracks the active deterministic framework line used in this repository.
Detailed commit history remains available through Git history (`git log` / `git show`).

## 2026-02 (enterprise-refactor updates)

### 2026-02-27 (v6.3.21)

- README render hardening for npm/GitHub parity:
  - replaced markdown hero image syntax with explicit HTML image tag:
    - `<img src="assets/logo_banner.svg" alt="Pumuki" width="100%" />`

### 2026-02-27 (v6.3.20)

- README visual adjustment:
  - restored full-width hero banner in root `README.md` (`assets/logo_banner.svg`).

### 2026-02-27 (v6.3.19)

- README visual hotfix:
  - restored classic top image in root `README.md` using `assets/logo.png`.
- README collaboration CTA:
  - added a short, friendly "leave a star" reminder at the end of root `README.md`.

### 2026-02-27 (v6.3.18)

- Enterprise documentation baseline refresh:
  - Root `README.md` rewritten with audience segmentation and quick-start-first onboarding.
  - Consumer vs framework-maintainer command surfaces are now explicitly separated.
  - Added collaboration and support/security guidance sections.
- New stable operations policy:
  - `docs/OPERATIONS.md` introduces SaaS production operation baseline:
    - SLO/SLA minimums
    - incident severity and response windows
    - alerting thresholds and mandatory operational controls
    - go-live and rollback requirements
- README walkthrough extraction:
  - detailed menu Option 1 capture narrative moved to `docs/README_MENU_WALKTHROUGH.md`.
  - root README now remains concise while preserving deep visual guidance by reference.
- Command documentation hardening from end-to-end execution audit:
  - fixed legacy parity command argument format to `--legacy=<path> --enterprise=<path>`.
  - documented required flags and expected non-zero verdict semantics for `validation:*` scripts.
  - documented OpenSpec/SDD session prerequisites (`openspec/changes/<change-id>` required before `sdd session --open`).
- Documentation index alignment:
  - `docs/README.md`, `docs/USAGE.md`, and `docs/INSTALLATION.md` updated to include operations and walkthrough references.

### 2026-02-20 (v6.3.17)

- Evidence and hard-mode state:
  - Added deterministic `repo_state.lifecycle.hard_mode` capture from `.pumuki/hard-mode.json`.
  - Evidence v2.1 now includes normalized hard-mode config path/state for runtime traceability.
- Unified AI Gate hard-mode propagation:
  - `evaluateAiGate` now exposes resolved policy metadata (`stage`, `resolved_stage`, thresholds, trace).
  - `PRE_WRITE` now reports policy resolution deterministically via `PRE_COMMIT` mapping.
- Enterprise MCP contract alignment:
  - `ai_gate_check` now includes policy trace payload in result responses.
  - PRE_WRITE/MCP behavior now matches gate policy resolution used by stage runners.
- Lifecycle + adapter operations:
  - Added `pumuki adapter install --agent=<...> [--dry-run]` and npm alias `adapter:install`.
  - Added adapter templates and runtime scaffolding for `codex`, `claude`, `cursor`, `windsurf`, `opencode`.
- Framework menu UX:
  - Added explicit maintenance action to configure hard-mode enforcement (`id 18`).
- Documentation hardening:
  - Rebuilt `README.md` with enterprise onboarding flow (quickstart, hard mode, PRE_WRITE contract, adapters, MCP references).

### 2026-02-20 (v6.3.16)

- MCP/evidence hardening:
  - `/status` now emits `evidence.exists` as strict boolean in all states.
  - deterministic semantic consolidation preserves suppressed traceability metadata.
- Security/runtime hardening:
  - raised `ts-morph` runtime floor to `>=27.0.2` and removed vulnerable minimatch chain in production audit path.
- Documentation baseline cleanup:
  - normalized active governance references to `PUMUKI.md` (replacing `CLAUDE.md` references in active docs).
  - removed obsolete planning/docs artifacts and duplicated `docs/images/*` mirrors.
- Maintenance surface simplification:
  - removed `validation:docs-hygiene` command path and related framework-menu maintenance action.
  - removed docs-hygiene-only tests/helpers not tied to runtime gate enforcement.

### Documentation governance hardening

- Active docs quality guardrails expanded and integrated into stage-gates:
  - English-only baseline check for active enterprise docs.
  - Markdown reference-integrity check for active docs.
  - Root governance docs (`README.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `PUMUKI.md`) included in active-doc guardrails.
- Stage-gates command simplified to glob-based test targets for maintainability while preserving deterministic coverage.
- Root `CHANGELOG.md` normalized to active enterprise v2 baseline to avoid legacy drift.

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
- Package-install smoke gate added for published/runtime behavior:
  - workflow: `.github/workflows/pumuki-package-smoke.yml`
  - `block` matrix mode validates expected blocking path (`exit 1`, `outcome=BLOCK`)
  - `minimal` matrix mode validates expected pass path (`exit 0`, `outcome=PASS`)
  - both modes validate evidence v2.1 stage metadata and upload artifacts
- Package manifest guardrail added:
  - command: `npm run validation:package-manifest`
  - enforces required runtime paths in tarball and forbids legacy/tests/archive diagnostics content
- Package manifest guardrail internal hardening:
  - reusable inspection library: `scripts/package-manifest-lib.ts`
  - regression test coverage in stage-gates:
    - `scripts/__tests__/package-manifest-lib.test.ts`
- Framework menu portability hardening:
  - removed host-specific consumer repo path defaults from `scripts/framework-menu.ts`
  - added `PUMUKI_CONSUMER_REPO_PATH` support for environment-specific menu defaults
- Mock consumer validation hardening:
  - new runbook: `docs/validation/mock-consumer-integration-runbook.md`
  - formalized package-smoke + manual mock-consumer A/B checklist
- Phase 5 mock-closure automation:
  - `scripts/build-mock-consumer-startup-triage.ts` generates triage + unblock reports from local package-smoke summaries
  - `validation:phase5-execution-closure` supports `--mock-consumer`
  - mock mode now includes a deterministic mock consumer A/B report step:
    - output: `.audit-reports/phase5/mock-consumer-ab-report.md`
  - mock mode disables external GH preflight/workflow-lint by default and keeps closure flow deterministic
  - local mock execution now reaches:
    - `phase5-blockers-readiness` => `verdict=READY`
    - `phase5-execution-closure-status` => `verdict=READY`
- Mock consumer A/B validation automation:
  - `scripts/build-mock-consumer-ab-report.ts` validates block/minimal smoke outcomes plus evidence v2.1 contract
  - command: `npm run validation:mock-consumer-ab-report -- --repo <owner>/<repo>`
  - output: `.audit-reports/mock-consumer/mock-consumer-ab-report.md`
  - framework menu action:
    - `Build mock consumer A/B validation report`
- Phase5 mock-closure CI hardening:
  - workflow: `.github/workflows/pumuki-phase5-mock.yml`
  - deterministic sequence: package smoke (`block`, `minimal`) -> phase5 mock closure one-shot
  - artifact bundle: `phase5-mock-closure`
  - workflow contract guardrail:
    - `scripts/__tests__/phase5-mock-workflow-contract.test.ts`

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
- Phase 5 external handoff report:
  - `npm run validation:phase5-external-handoff`
  - deterministic verdicts: `READY | BLOCKED | MISSING_INPUTS`
  - optional strict flags:
    - `--require-mock-ab-report`
    - `--require-artifact-urls`
  - framework menu action:
    - `Build phase5 external handoff report`
- Adapter-only readiness report:
  - `npm run validation:adapter-readiness`
  - deterministic verdicts: `READY | BLOCKED | PENDING`
- IDE-agnostic gate boundary hardening:
  - runtime boundary test in `integrations/git/__tests__/ideAgnosticBoundary.test.ts`
  - explicit architecture/docs contract that IDE diagnostics remain optional adapters
- Compatibility command hardening:
  - legacy provider-named hook scripts now delegate to adapter-native scripts in `package.json`
  - regression guardrail:
    - `scripts/__tests__/adapter-script-aliases.test.ts`
- Provider-agnostic legacy ruleset resolution:
  - `integrations/git/resolveLegacyRulesetFile.ts`
  - discovers legacy tooling rule directories without provider-specific hardcoding
  - regression guardrail:
    - `integrations/git/__tests__/resolveLegacyRulesetFile.test.ts`
- Validation runbooks index:
  - `docs/validation/README.md`
- Validation artifact hygiene helper:
  - `npm run validation:clean-artifacts` (`--dry-run` supported)
  - cleans local generated `docs/validation/**/artifacts` directories and `.audit_tmp`
  - framework menu action:
    - `Clean local validation artifacts`
## Notes

- Legacy 5.3.4 migration/release notes were removed from active docs to avoid drift.
- Historical commit trace remains available in Git history.
