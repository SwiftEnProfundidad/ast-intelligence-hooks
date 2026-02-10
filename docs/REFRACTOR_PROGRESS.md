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
- ⏳ Private consumer startup-failure unblock is pending rerun with fresh diagnostics.
- ⏳ External Phase 5 handoff final external artifact URLs are pending attachment.
- ⏳ Real external pre/post tool hook runtime validation is pending dedicated IDE-session replay evidence capture.

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
- 🚧 Re-run consumer private-repo startup-failure diagnostics and attach refreshed evidence.
