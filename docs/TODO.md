# Framework Work Tracking (TODO)

## Scope

Operational tracking for active **Pumuki AST Intelligence Framework v2.x** work.

## Completed Milestones

- Deterministic v2.x architecture is active: `Facts -> Rules -> Gate -> ai_evidence v2.1`.
- Multi-platform stage runners are implemented (iOS, backend, frontend, android).
- Skills lock/policy enforcement is integrated with stage-aware gate calibration.
- Evidence/mcp deterministic validation suites are in place and green.
- Windsurf hook-runtime hardening and diagnostics commands are implemented.
- Consumer CI diagnostic tooling is implemented (artifact scan, auth check, support bundle, ticket draft).
- Consumer startup-failure unblock status helper is implemented (`validation:consumer-startup-unblock-status`).
- Windsurf real-session report generator is implemented (`validation:windsurf-real-session-report`).
- Documentation baseline is normalized to enterprise English and active v2.x behavior.

For full historical execution details, see:

- `docs/RELEASE_NOTES.md`
- `docs/validation/archive/`

## Active Work

- [ ] Windsurf pre/post tool hooks reliability (`bash: node: command not found`):
  - Execute `docs/validation/windsurf-hook-runtime-validation.md` in a real Windsurf session.
  - Compare outcome with `docs/validation/windsurf-hook-runtime-local-report.md`.
  - Record final evidence using `docs/validation/windsurf-real-session-report-template.md` or generate it with `validation:windsurf-real-session-report`.
- [ ] Consumer private-repo Actions startup-failure unblock:
  - Confirm billing/policy state after token refresh with `user` scope.
  - Re-run consumer CI diagnostics and attach fresh generated outputs.
- [ ] Documentation hygiene maintenance:
  - Keep only runbooks/guides versioned under `docs/validation/` root.
  - Keep generated reports out of baseline docs and regenerate on demand.

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
