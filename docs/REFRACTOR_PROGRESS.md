# Pumuki Refactor Progress (v2.x)

## Legend

- ✅ Done
- 🚧 In progress
- ⏳ Pending

## Phase 1 - Deterministic Core + Evidence v2.1

- ✅ Deterministic architecture is active: `Facts -> Rules -> Gate -> ai_evidence v2.1`.
- ✅ `ai_evidence` v2.1 schema (`snapshot + ledger`) is implemented as source of truth.
- ✅ Evidence serialization is stable and deterministic.
- ✅ Human intent preservation and expiry are supported.

## Phase 2 - Stage Policies + Shared Runners

- ✅ Stage policies are consolidated (`PRE_COMMIT`, `PRE_PUSH`, `CI`).
- ✅ Shared execution flow is centralized in `integrations/git/runPlatformGate.ts`.
- ✅ Runners are unified in `integrations/git/stageRunners.ts`.
- ✅ Gate output is normalized to `0/1`.

## Phase 3 - Multi-platform Gate (iOS, Backend, Frontend, Android)

- ✅ `PRE_COMMIT` is implemented for iOS, backend, frontend, and android.
- ✅ `PRE_PUSH` is implemented for iOS, backend, frontend, and android.
- ✅ `CI` is implemented for iOS, backend, frontend, and android.
- ✅ Combined platform detection is active (`integrations/platform/detectPlatforms.ts`).

## Phase 4 - Rule Packs + Skills Enforcement

- ✅ Baseline rule packs are available (ios, backend, frontend, android, heuristics).
- ✅ Rule pack versioning is defined (`core/rules/presets/rulePackVersions.ts`).
- ✅ Skills lock/policy compiler and validators are integrated in the gate flow.
- ✅ Stage-aware severity promotion for critical heuristics is implemented.

## Phase 5 - CI/Packaging Reliability

- ✅ CI workflows run gate stages and publish evidence artifacts.
- ✅ Package manifest guardrail is active.
- ✅ Package smoke (`block` + `minimal`) is green.
- ✅ Stage-gates command is simplified and deterministic.

## Phase 6 - CLI / Operational UX

- ✅ Interactive framework menu is implemented (`scripts/framework-menu.ts` + modules).
- ✅ One-shot Phase 5 closure orchestration is available (`validation:phase5-execution-closure`).
- ✅ Operational triage/support/unblock scripts are implemented.
- ✅ Mock consumer A/B report generation is implemented.

## Phase 7 - Documentation Governance

- ✅ Docs index coverage guardrail is active.
- ✅ Provider/IDE-agnostic guardrail is active.
- ✅ English-only guardrail is active.
- ✅ Markdown reference integrity guardrail is active.
- ✅ Root markdown baseline guardrail is active.
- ✅ `CHANGELOG.md` is normalized to the enterprise v2 baseline.

## Phase 8 - External Validation / Rollout Closure

- ✅ External rollout execution pack is published (`docs/validation/phase8-external-rollout-pack.md`).
- ✅ Local adapter runtime baseline was regenerated (`adapter-session-status`, `adapter-real-session-report`, `adapter-readiness`).
- ✅ Adapter hook runtime wiring was refreshed (`install:adapter-hooks-config`) and Node resolution is healthy (`node_bin=/opt/homebrew/bin/node`).
- ✅ Local hook simulation produces expected events (`pre_write` blocked + `post_write` logged) and `assess:any` passes.
- ✅ Adapter runtime validation reached green state (`adapter-session-status=PASS`, `adapter-readiness=READY`) after non-simulated runtime event capture.
- ✅ Phase 5 closure handoff artifacts were regenerated in mock-consumer mode with READY verdicts:
  - `.audit-reports/phase5/phase5-blockers-readiness.md`
  - `.audit-reports/phase5/phase5-execution-closure-status.md`
  - `.audit-reports/phase5/phase5-external-handoff.md`
- ✅ Private consumer startup-failure diagnostics were re-run with refreshed evidence (`.audit-reports/consumer-triage/*`), currently blocked by GitHub `404` on `SwiftEnProfundidad/pumuki-mock-consumer` Actions endpoints and missing `user` scope.
- ✅ `gh auth refresh -h github.com -s user` was attempted; GitHub device-flow interaction is required to finish scope elevation before live private-repo diagnostics can proceed.
- ✅ Startup-failure triage was rerun against an accessible private consumer (`SwiftEnProfundidad/pumuki-actions-healthcheck-temp`) and produced refreshed evidence (`.audit-reports/consumer-triage-temp/*`) plus external run URL evidence.
- ✅ Interactive `gh auth refresh -h github.com -s user` retry was executed in TTY mode; completion still requires manual device/browser confirmation.
- ✅ Controlled `workflow_dispatch` probe was executed on `pumuki-actions-healthcheck-temp`; latest evidence now captures one queued run without jobs plus one `startup_failure` run.
- ✅ Follow-up run inspection confirms the latest probe (`21878337799`) remains queued with empty job graph (`jobs=[]`), reinforcing external Actions-side blockage.
- ✅ External artifact URL evidence is attached in latest handoff (`.audit-reports/phase5/phase5-external-handoff-latest.md`).
- ✅ Latest Phase 5 blocker chain was recomputed with external evidence (`phase5-blockers-readiness-latest`, `phase5-execution-closure-status-latest`, `phase5-external-handoff-latest`) and is consistently `BLOCKED`.
- ✅ Escalation-ready evidence pack was consolidated with probes, triage outputs, and run URLs (`.audit-reports/phase5/consumer-escalation-pack-latest.md`).
- ✅ Support ticket draft attachments are now resolved dynamically from the active triage directory, and regenerated for `consumer-triage-temp`.
- ✅ Device-flow auth refresh was re-triggered and a fresh one-time GitHub code was generated for manual scope elevation (`gh auth refresh -h github.com -s user`).
- ✅ Auth-check contract now requires only `repo/workflow` scopes; billing probe is informational and no longer blocks startup-unblock.
- ✅ Consumer triage was rerun for `SwiftEnProfundidad/pumuki-actions-healthcheck-temp` with `auth-check=READY` and updated artifacts in `.audit-reports/consumer-triage-temp/*`.
- ✅ `phase5-blockers-readiness-latest` now resolves to `READY`; latest closure/handoff are blocked only by active `startup_failure` evidence.
- ✅ Additional live `workflow_dispatch` probe was executed (`21882829778`) and confirms the same external pattern (`queued` without jobs, no artifacts), with `startup_failure_runs` still present in latest support bundle.
- ⏳ External Phase 5 handoff final `READY` status is pending unblock of consumer startup blocker.
- ✅ Real external pre/post tool hook runtime validation is green (`adapter-session-status=PASS`, `adapter-real-session-report=PASS`, `adapter-readiness=READY`).

## Phase 9 - Advanced AST Heuristics

- ✅ Initial typed AST heuristics are active.
- ⏳ High-value semantic heuristics expansion is pending after external rollout closure.
- ⏳ Additional incremental expansion is pending after external rollout closure.

## Phase 10 - MCP / Context API Expansion

- ✅ Read-only MCP evidence server is implemented.
- ⏳ Context API surface incremental expansion (`summary`, `rulesets`, `platforms`) is pending continuation.
- ✅ Formal cross-agent consumption patterns are documented (`docs/MCP_AGENT_CONTEXT_CONSUMPTION.md`).

## Current Focus

- ✅ Publish a single external rollout execution pack (checklist + artifact contract + handoff template).
- ✅ Document formal cross-agent MCP context consumption pattern.
- ✅ Regenerate local adapter runtime baseline and capture blockers.
- ✅ Run MCP/deterministic regression batch after context API expansion.
- ✅ Normalize progress board to single-active-task model (`1x 🚧` only).
- ✅ Complete adapter runtime validation and regenerate adapter readiness to READY.
- ✅ Re-run Phase 5 closure in mock-consumer mode and regenerate READY handoff artifacts.
- ✅ Remove legacy `RuralGo/R_GO` references from docs/scripts/legacy content and archive filenames, aligned to mock-consumer naming.
- ✅ Re-run consumer private-repo startup-failure diagnostics and attach refreshed evidence (`.audit-reports/consumer-triage/*`).
- ✅ Attach external artifact URL evidence to latest Phase 5 handoff (`.audit-reports/phase5/phase5-external-handoff-latest.md`, including runs `21797682919` and `21878337799`).
- ✅ Remove hard dependency on `user` scope in auth preflight and keep billing probe as informational for startup-unblock.
- ✅ Normalize validation archive naming/references from `r_go` to `mock_consumer` in rollout docs and doc guardrail tests.
- ✅ Align remaining `legacy/*` samples and helper references from `ruralgo/r_go` to `pumuki-mock-consumer` naming.
- ✅ Startup-unblock diagnosis now reports explicit external queue blockage (`jobs=0, artifacts=0`) in addition to `startup_failure` counts.
- ✅ Support-ticket draft now includes explicit queue-stall evidence (`queued/stuck before job graph creation`) for faster external escalation.
- ✅ Startup-failure support/unblock diagnostics now expose `startup_stalled_runs` end-to-end (bundle header, payload, parser, blockers, and tests).
- ✅ Consumer startup-failure triage/unblock rerun confirms external blockage persists (`startup_failure_runs=1`, `startup_stalled_runs=2`) with refreshed temp artifacts in `.audit-reports/consumer-triage-temp/*`.
- ✅ Phase 5 latest closure/handoff artifacts were regenerated (`.audit-reports/phase5-latest/*`) and consistently report `BLOCKED` due to consumer startup unblock verdict.
- 🚧 Clear remaining consumer startup-failure blocker (`startup_failure_runs > 0`) to move external handoff from `BLOCKED` to `READY` using fresh external escalation evidence.
