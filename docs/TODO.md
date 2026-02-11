# Framework Work Tracking (TODO)

## Scope

Operational tracking for active **Pumuki AST Intelligence Framework v2.x** work.

## Completed Milestones

- Deterministic v2.x architecture is active: `Facts -> Rules -> Gate -> ai_evidence v2.1`.
- Multi-platform stage runners are implemented (iOS, backend, frontend, android).
- Skills lock/policy enforcement is integrated with stage-aware gate calibration.
- Evidence/mcp deterministic validation suites are in place and green.
- IDE adapter hook-runtime hardening and diagnostics commands are implemented (current baseline: Adapter).
- Consumer CI diagnostic tooling is implemented (artifact scan, auth check, support bundle, ticket draft).
- Consumer startup-failure unblock status helper is implemented (`validation:consumer-startup-unblock-status`).
- Consumer startup triage orchestrator is implemented (`validation:consumer-startup-triage`).
- Phase 5 blockers readiness helper is implemented (`validation:phase5-blockers-readiness`).
- Phase 5 execution closure status helper is implemented (`validation:phase5-execution-closure-status`).
- Phase 5 execution closure one-shot orchestrator is implemented (`validation:phase5-execution-closure`).
- Framework menu exposes Phase 5 one-shot orchestration action (`Run phase5 execution closure (one-shot orchestration)`).
- Framework menu exposes external handoff report generation (`Build phase5 external handoff report`).
- Adapter readiness helper is implemented (`validation:adapter-readiness`).
- Adapter real-session report generator is implemented (`validation:adapter-real-session-report`, current baseline naming).
- iOS AST heuristic coverage includes force-cast (`as!`) detection with stage-aware severity promotion.
- Framework menu operational checks include docs hygiene and skills lock freshness (`skills:lock:check`).
- IDE-agnostic boundary guardrail test is implemented for `core/*` and `integrations/*`.
- Rule-pack version-to-doc sync guardrail test is implemented (`scripts/__tests__/rule-pack-docs-sync.test.ts`).
- Active enterprise docs IDE/provider-agnostic guardrail test is implemented (`scripts/__tests__/enterprise-docs-agnostic.test.ts`).
- Active enterprise docs English-only guardrail test is implemented (`scripts/__tests__/enterprise-docs-language.test.ts`).
- Active docs index coverage guardrail test is implemented (`scripts/__tests__/docs-index-coverage.test.ts`).
- Active docs markdown reference-integrity guardrail test is implemented (`scripts/__tests__/docs-markdown-reference-integrity.test.ts`).
- Root markdown baseline guardrail is implemented (`scripts/__tests__/root-docs-baseline.test.ts`).
- Legacy provider-named hook scripts are preserved as compatibility aliases mapped to adapter-native scripts (`scripts/__tests__/adapter-script-aliases.test.ts`).
- Legacy ruleset lookup is provider-agnostic and covered by regression tests (`integrations/git/resolveLegacyRulesetFile.ts`, `integrations/git/__tests__/resolveLegacyRulesetFile.test.ts`).
- MCP read-only evidence context API now includes deterministic `summary`, `rulesets`, and `platforms` endpoints (`integrations/mcp/evidenceContextServer.ts`).
- Formal cross-agent MCP context consumption pattern is documented (`docs/MCP_AGENT_CONTEXT_CONSUMPTION.md`).
- Validation artifact cleanup command is available (`validation:clean-artifacts`, dry-run supported).
- Framework menu includes artifact cleanup action (`Clean local validation artifacts`).
- Phase 5 one-shot flow includes auth preflight fail-fast with optional bypass (`--skip-auth-preflight`).
- Documentation baseline is normalized to enterprise English and active v2.x behavior.
- Root `CHANGELOG.md` is normalized to active enterprise v2 baseline.
- Package manifest guardrail logic is reusable and regression-tested in stage gates (`scripts/package-manifest-lib.ts`, `scripts/__tests__/package-manifest-lib.test.ts`).
- Package smoke CI matrix (`block` + `minimal`) is active and green with evidence v2.1 assertions.
- Framework menu consumer diagnostics defaults are host-agnostic:
  - no hardcoded local repository paths
  - optional environment default via `PUMUKI_CONSUMER_REPO_PATH`
- Adapter validation runbooks are provider-neutral (no provider-specific hooks path assumptions).
- Mock consumer integration runbook is versioned and indexed (`docs/validation/mock-consumer-integration-runbook.md`).
- External rollout execution pack is published (`docs/validation/phase8-external-rollout-pack.md`).
- Phase 5 one-shot closure supports local mock-consumer mode (`--mock-consumer`) with deterministic A/B + triage/unblock generation from package-smoke summaries.
- Mock consumer A/B deterministic report is implemented (`validation:mock-consumer-ab-report`).
- Framework menu exposes mock consumer A/B report generation as a first-class action.
- Phase5 mock-closure CI workflow is active (`.github/workflows/pumuki-phase5-mock.yml`).
- Phase 5 mock-consumer closure execution is validated with READY outputs:
  - `.audit-reports/phase5/phase5-blockers-readiness.md`
  - `.audit-reports/phase5/phase5-execution-closure-status.md`
  - `.audit-reports/phase5/phase5-execution-closure-run-report.md`

For full historical execution details, see:

- `docs/RELEASE_NOTES.md`
- `docs/validation/archive/`

## Active Work

- [x] Real external pre/post tool runtime validation rerun and adapter readiness regeneration.
  - Runtime wiring refreshed and validated:
    - `npm run install:adapter-hooks-config` => PASS
    - `npm run verify:adapter-hooks-runtime` => PASS (`node_bin=/opt/homebrew/bin/node`)
  - Local hook simulation validated:
    - `bash legacy/scripts/hooks-system/infrastructure/cascade-hooks/validate-local-runtime.sh` => PASS
    - `npm run assess:adapter-hooks-session:any` => PASS
    - `npm run assess:adapter-hooks-session` => PASS
  - Non-simulated runtime event capture validated:
    - manual pre/post invocation via `run-hook-with-node.sh` and repo path payload (`integrations/git/index.ts`) => PASS
  - Local baseline regenerated:
    - `.audit-reports/adapter/adapter-session-status.md` (verdict: PASS)
    - `.audit-reports/adapter/adapter-real-session-report.md`
    - `.audit-reports/adapter/adapter-readiness.md` (verdict: READY)
  - Regression batch completed after MCP context expansion:
    - `npm run test:mcp` => PASS
    - `npm run test:deterministic` => PASS
- [ ] Consumer private-repo Actions startup-failure unblock [ACTIVE]:
  - Current live signals (`.audit-reports/phase5-latest/*`):
    - `startup_failure_runs: 0`
    - `startup_stalled_runs: 8`
    - `oldest_queued_run_age_minutes: 306`
    - latest probe: `21908546076` (`queued`, `jobs=0`, `artifacts=0`)
    - cancel attempts on queued runs return `HTTP 500`
  - Escalation handoff is ready in repo:
    - `docs/validation/consumer-startup-escalation-handoff-latest.md`
  - Packaged attachment bundle (ready to share):
    - `.audit-reports/phase5-latest/consumer-startup-escalation-bundle-latest.tgz`
    - `sha256: 5e4e2fc0bbc3f977a463fa576c648969b894b25fb153aeb7223117093f3221ee`
  - Pending external action:
    - root cause identified: billing for GitHub Actions is currently inactive/unavailable in consumer account.
    - unblock requires billing reactivation before any meaningful runtime retry.
    - resume runbook after billing activation: `docs/validation/phase8-post-billing-reactivation-runbook.md`.
    - pre-submission verification executed (`PASS`, `2026-02-11T09:54:18Z`).
    - submission sent to GitHub Support: ticket `4077449`, submitted by `SwiftEnProfundidad` at `2026-02-11T13:54:02Z`.
    - follow-up ETA registered: `2026-02-12 18:00 UTC`.
    - user will close support ticket manually because billing cause is known.
    - automated CLI submission path is not available (`gh support` command does not exist).
    - direct REST submission probes also fail with `404 Not Found` (`/support/tickets`, `/user/support/tickets`).
    - follow checklist in `docs/validation/consumer-startup-escalation-handoff-latest.md` (`Manual Portal Submission Checklist`) to avoid missing fields/attachments.
    - payload export helper: `npm run validation:phase5-escalation:payload -- .audit-reports/phase5-latest`.
    - deterministic pre-submit gate: `npm run validation:phase5-escalation:ready-to-submit -- .audit-reports/phase5-latest`.
    - one-shot pre-submit package helper: `npm run validation:phase5-escalation:prepare -- .audit-reports/phase5-latest`.
    - latest one-shot preparation run result: `READY PACKAGE` (payload + bundle ready).
    - latest deterministic pre-submit gate run: `READY TO SUBMIT` (checksum + attachments aligned).
    - optional close helper after submission: `npm run validation:phase5-escalation:close-submission -- <ticket_id> <submitted_by> "<follow_up_eta>" [submitted_at_utc]`.
    - post-submit tracking can be updated with: `npm run validation:phase5-escalation:mark-submitted -- <ticket_id> <submitted_by> "<follow_up_eta>" [submitted_at_utc]`.
    - post-support fast close check (resume only after billing reactivation): `npm run validation:phase5-post-support:refresh -- SwiftEnProfundidad/pumuki-actions-healthcheck-temp 8 .audit-reports/phase5-latest .audit-reports/phase5/mock-consumer-ab-report.md`.
    - one-shot resume helper after billing reactivation: `npm run validation:phase8:resume-after-billing -- SwiftEnProfundidad/pumuki-actions-healthcheck-temp 8 .audit-reports/phase5-latest .audit-reports/phase5/mock-consumer-ab-report.md`.
    - once sent, record `support_ticket_id/submitted_at_utc/submitted_by` in `docs/validation/consumer-startup-escalation-handoff-latest.md`.
    - after support response + refresh, run `npm run validation:phase5-latest:ready-check` (must return `0`) before marking Phase 8 closed.
- [x] Phase 5 execution closure (external consumer diagnostics dependency):
  - One-shot closure re-run completed in mock-consumer mode:
    - `npm run validation:phase5-execution-closure -- --repo SwiftEnProfundidad/ast-intelligence-hooks --out-dir .audit-reports/phase5 --mock-consumer --require-adapter-readiness`
  - READY artifacts regenerated:
    - `.audit-reports/phase5/phase5-blockers-readiness.md` (`verdict: READY`)
    - `.audit-reports/phase5/phase5-execution-closure-status.md` (`verdict: READY`)
    - `.audit-reports/phase5/phase5-external-handoff.md` (`verdict: READY`)
  - Remaining externalization step:
    - Attach external artifact URLs to rollout status notes when consumer run IDs are available.
- [ ] Documentation hygiene maintenance:
  - Keep only runbooks/guides versioned under `docs/validation/` root.
  - Keep generated reports out of baseline docs and regenerate on demand.

## Deferred Adapter Validation

- [ ] Adapter pre/post tool hooks dedicated external IDE replay evidence (optional):
  - Runtime/readiness are currently green (`adapter-session-status: PASS`, `adapter-readiness: READY`).
  - Optional follow-up: capture a dedicated IDE-originated trace bundle for external audit traceability.

## Skills Enforcement Roadmap (Status)

### Goal

Ensure user/team skills are enforced deterministically in repository scope, without coupling audits to `~/.codex`.

### Guardrails

- Keep enforcement inputs versioned in repository scope.
- Keep `core/*` pure; implement loading/adaptation in `integrations/*`.
- Do not read `~/.codex/**` during CI gate execution.
- Trace every applied skills bundle in `.ai_evidence.json` (`rulesets[]`).

### Phase Status

- [x] Phase 1: contracts + validators + deterministic hash tests.
- [x] Phase 2: compiler + templates + deterministic fixtures + stale check.
- [x] Phase 3: gate integration + baseline lock semantics + evidence trace.
- [x] Phase 4: stage calibration + promotion policy tests + regressions.
- [x] Phase 5 docs: maintainers guide + migration + CI lock freshness check.
- [ ] Phase 5 execution closure: resolve consumer private Actions blocker and attach artifact URLs to rollout status.
  - Runbook: `docs/validation/phase5-execution-closure.md`
