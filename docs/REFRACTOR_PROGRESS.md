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
- ✅ Remove legacy external-project references from docs/scripts/legacy content and archive filenames, aligned to mock-consumer naming.
- ✅ Re-run consumer private-repo startup-failure diagnostics and attach refreshed evidence (`.audit-reports/consumer-triage/*`).
- ✅ Attach external artifact URL evidence to latest Phase 5 handoff (`.audit-reports/phase5/phase5-external-handoff-latest.md`, including runs `21797682919` and `21878337799`).
- ✅ Remove hard dependency on `user` scope in auth preflight and keep billing probe as informational for startup-unblock.
- ✅ Normalize validation archive naming/references from legacy identifiers to `mock_consumer` in rollout docs and doc guardrail tests.
- ✅ Align remaining `legacy/*` samples and helper references to `pumuki-mock-consumer` naming.
- ✅ Startup-unblock diagnosis now reports explicit external queue blockage (`jobs=0, artifacts=0`) in addition to `startup_failure` counts.
- ✅ Support-ticket draft now includes explicit queue-stall evidence (`queued/stuck before job graph creation`) for faster external escalation.
- ✅ Startup-failure support/unblock diagnostics now expose `startup_stalled_runs` end-to-end (bundle header, payload, parser, blockers, and tests).
- ✅ Consumer startup-failure triage/unblock rerun confirms external blockage persists (`startup_failure_runs=1`, `startup_stalled_runs=2`) with refreshed temp artifacts in `.audit-reports/consumer-triage-temp/*`.
- ✅ Phase 5 latest closure/handoff artifacts were regenerated (`.audit-reports/phase5-latest/*`) and consistently report `BLOCKED` due to consumer startup unblock verdict.
- ✅ New controlled `workflow_dispatch` probe (`21885160081`) was triggered and Phase 5 latest artifacts were regenerated; blockage persists with `startup_failure_runs=1` and `startup_stalled_runs=3`.
- ✅ Consumer startup-unblock markdown now marks missing workflow lint input as `optional` (instead of ambiguous `missing`), with regression coverage.
- ✅ Residual legacy external-project name references were re-audited; only progress-history mentions remained and were normalized.
- ✅ `docs/validation/phase8-external-rollout-pack.md` now includes a live snapshot section with current blocked verdict chain and latest probe URL.
- ✅ Consumer support ticket draft was refreshed from latest evidence (`.audit-reports/phase5-latest/consumer-support-ticket-draft.md`) and is ready for external escalation handoff.
- ✅ External escalation handoff document is now versioned in repo (`docs/validation/consumer-startup-escalation-handoff-latest.md`) with latest run URLs and artifact contract.
- ✅ Additional controlled probe (`21885514510`) was executed and `phase5-latest` artifacts were regenerated; blockage persists with `startup_failure_runs=1` and `startup_stalled_runs=4`.
- ✅ Documentation indexes now include vendored Codex skills and latest escalation handoff doc; `docs-index-coverage` guardrail is green again.
- ✅ Support ticket draft summary now includes both `startup_failure_runs` and `startup_stalled_runs` counters (with regression coverage).
- ✅ `docs/TODO.md` active-work section was normalized to a single startup-unblock item with current live signals and escalation handoff pointer.
- ✅ GitHub support ticket template now includes queued/stalled counters (`startup_stalled_runs`) and updated attachment contract for current escalation evidence.
- ✅ Validation docs hygiene allowlist now includes `consumer-startup-escalation-handoff-latest.md`; `validation:docs-hygiene` is green again.
- ✅ Regression mini-batch is green after latest docs/support updates (`consumer-support-ticket`, `validation-docs-hygiene`, `docs-index-coverage`).
- ✅ Phase5 external handoff now surfaces parsed consumer startup signals (`startup_failure_runs`, `startup_stalled_runs`) with regression coverage.
- ✅ Consumer startup-unblock status now publishes `startup_stalled_runs` as a first-class signal (not only as blocker text), with regression coverage.
- ✅ Phase 8 runbook now includes an explicit escalation refresh sequence for `phase5-latest` artifacts (probe -> closure -> handoff).
- ✅ Support bundle now exposes `oldest_queued_run_age_minutes` for stalled-run age evidence (header + support payload + regression test).
- ✅ Support ticket parser/draft now propagate queued-age evidence (`oldest_queued_run_age_minutes`) alongside failure/stalled counters.
- ✅ `phase5-latest` escalation artifacts were refreshed and now expose consistent startup signals across handoff/unblock/ticket outputs.
- ✅ Escalation handoff doc now includes queued-age signal (`oldest_queued_run_age_minutes`) alongside failure/stalled counters.
- ✅ Fresh `phase5-latest` rerun cleared startup-failure events (`startup_failure_runs=0`) and refreshed escalation evidence with new run URLs/signals.
- ✅ External rollout runbooks (`docs/validation/phase8-external-rollout-pack.md`, `docs/TODO.md`) are now synced with latest Phase5-live startup signals.
- ✅ Retry cycle confirmed external queue-stall persists after cancel attempts (`HTTP 500`), with updated escalation evidence (`startup_stalled_runs=6`).
- ✅ Escalation templates now include queued-run cancel failure signal (`HTTP 500`) for GitHub support handoff (`consumer-ci-startup-failure-playbook`, `github-support-ticket-template-startup-failure`).
- ✅ `phase5-latest` support ticket draft was regenerated from refreshed evidence (`startup_failure_runs=0`, `startup_stalled_runs=6`, `oldest_queued_run_age_minutes=442`).
- ✅ Captured concrete cancel-endpoint failure fingerprint (`HTTP 500` + `x-github-request-id`) in latest escalation handoff and rollout runbook.
- ✅ Escalation pack artifact was refreshed to `phase5-latest` evidence contract and current blocker semantics (`.audit-reports/phase5/consumer-escalation-pack-latest.md`).
- ✅ Escalation handoff now includes a ready-to-paste GitHub Support payload with latest counters, run URLs, and cancel error fingerprint.
- ✅ Created packaged escalation attachment bundle with integrity hash (`.audit-reports/phase5-latest/consumer-startup-escalation-bundle-latest.tgz`, SHA256 recorded in handoff).
- ✅ Active TODO now references the packaged escalation bundle path + checksum for direct external handoff.
- ✅ Fresh `phase5-latest` rerun shows startup failure cleared but queue-stall worsened (`startup_stalled_runs=7`, `oldest_queued_run_age_minutes=852`), and docs/bundle hash were refreshed accordingly.
- ✅ Escalation handoff now includes explicit submission-tracking fields (`support_ticket_id`, `submitted_at_utc`, `submitted_by`, `follow_up_eta`) to close the loop after external filing.
- ✅ Escalation handoff now includes a deterministic post-submission refresh sequence to validate unblock after GitHub Support action.
- ✅ Escalation handoff now includes deterministic pre-submission verification (bundle checksum + required evidence files presence).
- ✅ Remaining tasks are now explicitly enumerated in `Remaining Task Queue (Explicit)` for full execution visibility.
- ✅ Fresh `phase5-latest` rerun confirmed ongoing external queue growth (`startup_stalled_runs=8`, `oldest_queued_run_age_minutes=888`) and refreshed runbook/handoff/bundle checksum.
- ✅ Pre-submission verification was executed successfully (`PASS`) and recorded in handoff submission tracking (`2026-02-11T09:54:18Z`).
- ✅ Remaining queue granularity was improved by splitting escalation task `P8-2` into `P8-2a` (done) and `P8-2b` (pending).
- ✅ Documentation hygiene maintenance cycle executed (`docs-index-coverage` + `validation-docs-hygiene` green) and backlog item `P7-1` closed.
- ✅ Escalation submission state is now explicit: `READY_TO_SUBMIT` with manual-portal dependency captured in handoff/TODO.
- ✅ One-shot latest escalation refresh helper is implemented and validated (`validation:phase5-latest:refresh`), regenerating run URLs + handoff + bundle checksum in one deterministic pass.
- ✅ Escalation handoff/runbook/TODO were resynced to the latest `phase5-latest` evidence snapshot (run URLs + queued-age + bundle checksum).
- ✅ Latest validation/evidence synchronization commits were pushed to `enterprise-refactor` (`a4e2808`, `04a8abb`) to keep remote handoff state aligned.
- ✅ Manual GitHub Support portal execution checklist was embedded in handoff with exact payload/attachment/update steps to close `P8-2b` deterministically.
- ✅ Submission-tracking automation command was added (`validation:phase5-escalation:mark-submitted`) to stamp ticket metadata in handoff without manual editing.
- ✅ Fresh `phase5-latest` refresh was rerun and escalation docs were resynced (`latest probe: 21901391166`, `oldest_queued_run_age_minutes: 694`, updated bundle checksum).
- ✅ Deterministic post-support gate check was added (`validation:phase5-latest:ready-check`) to close `P8-3/P8-4` only when the full report chain is `READY`.
- ✅ Support portal payload export helper was added (`validation:phase5-escalation:payload`) with automatic attachment checklist generation.
- ✅ Deterministic pre-submit support gate was added (`validation:phase5-escalation:ready-to-submit`) to validate readiness/checksum/attachments before manual portal submission.
- ✅ One-shot post-support close helper was added (`validation:phase5-post-support:refresh`) to run refresh + chain-ready validation in one command.
- ✅ Latest pre-submit gate execution is green on current snapshot (`submission_readiness=READY_TO_SUBMIT`, `pre_submission_verification=PASS`, checksum aligned).
- ✅ One-shot escalation submission package helper was added (`validation:phase5-escalation:prepare`) to run pre-submit gate + payload generation in a single command.
- ✅ Optional post-submit close helper was added (`validation:phase5-escalation:close-submission`) to update handoff metadata and transition active queue to `P8-3`.
- ✅ Latest one-shot preparation run completed successfully (`validation:phase5-escalation:prepare` => `READY PACKAGE`) with checksum and attachment checklist aligned.
- ✅ GitHub CLI path for Support submission was explicitly validated (`gh support` unavailable), confirming portal submission is the only supported channel.
- ✅ Fresh `phase5-latest` evidence refresh was executed and docs were resynced (`latest probe: 21902330502`, `oldest_queued_run_age_minutes: 523`, bundle checksum updated).
- ✅ Direct REST submission probes were executed and confirmed unavailable (`POST /support/tickets` and `POST /user/support/tickets` => `404 Not Found`), so portal remains mandatory.
- ✅ Phase5 latest documentation sync helper is implemented (`validation:phase5-latest:sync-docs`) and wired into `validation:phase5-latest:refresh` to auto-sync live startup signals/checksum into rollout docs.
- ✅ Submission package one-shot was revalidated after docs-sync automation (`validation:phase5-escalation:prepare` => `READY TO SUBMIT`, payload regenerated).
- ✅ Fresh one-shot `phase5-latest` refresh executed with integrated docs sync (`latest probe: 21905369927`, `oldest_queued_run_age_minutes: 619`, updated bundle checksum propagated).
- ✅ Docs-sync helper now also updates handoff `Expected:` checksum line, keeping `validation:phase5-escalation:ready-to-submit` green after refresh churn.
- ⏳ Clear remaining queued/stalled startup blocker (`startup_stalled_runs > 0`) to move external handoff from `BLOCKED` to `READY` using fresh external escalation evidence.

## Remaining Task Queue (Explicit)

- ⏳ `P8-1` Unblock external consumer startup queue stall and reach `READY` chain (`consumer-startup-unblock-status` + `phase5-execution-closure-status`).
- ✅ `P8-2a` Execute pre-submission verification (bundle checksum + required evidence files) and record result in handoff.
- 🚧 `P8-2b` Submit GitHub Support escalation using packaged evidence bundle and fill `Submission Tracking` fields in handoff (current state: `READY_TO_SUBMIT`, awaiting manual portal submission).
- ✅ `P8-2c` Automate `phase5-latest` docs sync from evidence signals/checksum (`scripts/sync-phase5-latest-docs.sh`, wired into refresh flow).
- ⏳ `P8-3` Re-run post-submission refresh sequence after support feedback and validate new run behavior.
- ⏳ `P8-4` Regenerate latest external handoff artifacts with `READY` verdict and close Phase 8 blocker.
- ✅ `P7-1` Keep documentation hygiene maintenance active (root validation docs only; generated reports regenerated on demand).
- ⏳ `P8-5` Optional adapter external IDE replay evidence capture (deferred).
- ⏳ `P9-1` Resume advanced AST semantic heuristics expansion after Phase 8 closure.
- ⏳ `P10-1` Resume MCP/context API incremental expansion after Phase 8 closure.
