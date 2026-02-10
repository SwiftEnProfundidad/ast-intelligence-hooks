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
- Legacy provider-named hook scripts are preserved as compatibility aliases mapped to adapter-native scripts (`scripts/__tests__/adapter-script-aliases.test.ts`).
- Legacy ruleset lookup is provider-agnostic and covered by regression tests (`integrations/git/resolveLegacyRulesetFile.ts`, `integrations/git/__tests__/resolveLegacyRulesetFile.test.ts`).
- Validation artifact cleanup command is available (`validation:clean-artifacts`, dry-run supported).
- Framework menu includes artifact cleanup action (`Clean local validation artifacts`).
- Phase 5 one-shot flow includes auth preflight fail-fast with optional bypass (`--skip-auth-preflight`).
- Documentation baseline is normalized to enterprise English and active v2.x behavior.
- Package manifest guardrail logic is reusable and regression-tested in stage gates (`scripts/package-manifest-lib.ts`, `scripts/__tests__/package-manifest-lib.test.ts`).
- Package smoke CI matrix (`block` + `minimal`) is active and green with evidence v2.1 assertions.
- Framework menu consumer diagnostics defaults are host-agnostic:
  - no hardcoded local repository paths
  - optional environment default via `PUMUKI_CONSUMER_REPO_PATH`
- Adapter validation runbooks are provider-neutral (no provider-specific hooks path assumptions).
- Mock consumer integration runbook is versioned and indexed (`docs/validation/mock-consumer-integration-runbook.md`).
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

- [ ] Consumer private-repo Actions startup-failure unblock:
  - Confirm billing/policy state after token refresh with `user` scope.
  - Re-run consumer CI diagnostics and attach fresh generated outputs.
- [ ] Phase 5 execution closure (external consumer diagnostics dependency):
  - Re-run one-shot closure against approved external consumer context.
  - Attach latest mock A/B report (`.audit-reports/mock-consumer/mock-consumer-ab-report.md`) before external handoff.
  - Ensure readiness/status reports end in `verdict: READY`.
  - Ensure external handoff report ends in `verdict: READY`.
  - Attach generated artifact URLs to rollout status notes.
- [ ] Documentation hygiene maintenance:
  - Keep only runbooks/guides versioned under `docs/validation/` root.
  - Keep generated reports out of baseline docs and regenerate on demand.

## Deferred Adapter Validation

- [ ] Adapter pre/post tool hooks reliability (`bash: node: command not found`) across external IDE sessions:
  - Incident context (captured): pre-write and post-write hooks failed with direct `node .../pre-write-code-hook.js` / `post-write-code-hook.js` execution in an external adapter session.
  - Enforce wrapper-based remediation before manual re-check:
    - `npm run install:adapter-hooks-config`
    - `npm run verify:adapter-hooks-runtime`
  - Execute `docs/validation/adapter-hook-runtime-validation.md` in a real adapter session.
  - Compare outcome with `docs/validation/adapter-hook-runtime-local-report.md`.
  - Record final evidence using `docs/validation/adapter-real-session-report-template.md` or generate it with `validation:adapter-real-session-report`.
  - Regenerate adapter diagnostics summary with `validation:adapter-readiness`.

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
