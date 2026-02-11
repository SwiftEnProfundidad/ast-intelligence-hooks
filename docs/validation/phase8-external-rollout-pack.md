# Phase 8 External Rollout Pack

## Purpose

Provide a single operational package to close external rollout blockers with deterministic artifacts and explicit handoff evidence.

This runbook is read-only with respect to framework behavior. It does not change core gate logic.

## Preconditions

- Repository branch is up to date.
- Consumer repository access is confirmed (`repo` + `actions:read` scopes).
- Existing deterministic validation commands are available in this repository.

## One-Shot Execution

Run the orchestration command:

```bash
npm run validation:phase5-execution-closure -- \
  --repo <owner>/<repo> \
  --out-dir .audit-reports/phase5 \
  --skip-workflow-lint
```

Strict mode (adapter readiness required):

```bash
npm run validation:phase5-execution-closure -- \
  --repo <owner>/<repo> \
  --out-dir .audit-reports/phase5 \
  --repo-path /absolute/path/to/consumer-repo \
  --actionlint-bin /tmp/actionlint-bin/actionlint \
  --require-adapter-readiness
```

## Artifact Contract (Required)

The rollout is considered externally handoff-ready only when all artifacts exist and meet the required verdict.

| Artifact | Path | Required verdict |
| --- | --- | --- |
| Blockers readiness | `.audit-reports/phase5/phase5-blockers-readiness.md` | `READY` |
| Closure status | `.audit-reports/phase5/phase5-execution-closure-status.md` | `READY` |
| External handoff | `.audit-reports/phase5/phase5-external-handoff.md` | `READY` |
| Orchestration run report | `.audit-reports/phase5/phase5-execution-closure-run-report.md` | Informational |

Optional but recommended:

| Artifact | Path | Required verdict |
| --- | --- | --- |
| Adapter readiness | `.audit-reports/adapter/adapter-readiness.md` | `READY` |
| Adapter real-session report | `.audit-reports/adapter/adapter-real-session-report.md` | Informational |
| Mock consumer A/B report | `.audit-reports/phase5/mock-consumer-ab-report.md` | `READY` |

## External Runtime Incident Gate

If external pre/post tool runtime still shows `node: command not found`:

1. Execute `docs/validation/adapter-hook-runtime-validation.md`.
2. Regenerate:
   - `.audit-reports/adapter/adapter-session-status.md`
   - `.audit-reports/adapter/adapter-real-session-report.md`
   - `.audit-reports/adapter/adapter-readiness.md`
3. Re-run Phase 5 execution closure command.

## Handoff Template

Use the following template as final rollout note:

```md
# Phase 8 External Rollout Handoff

- Date: <YYYY-MM-DD>
- Operator: <name>
- Consumer repo: <owner/repo>
- Branch/ref: <branch or sha>

## Verification

- [ ] phase5-blockers-readiness => READY
- [ ] phase5-execution-closure-status => READY
- [ ] phase5-external-handoff => READY
- [ ] artifact URLs attached

## Artifact URLs

1. <url>
2. <url>
3. <url>

## Notes

- <incident updates, if any>
```

## Exit Criteria

- All required artifact contract entries exist with required verdicts.
- Handoff template is filled and shared with artifact URLs.
- `docs/TODO.md` external rollout blocker items are updated.

## Current Live Snapshot (2026-02-11)

Latest regenerated external evidence (`.audit-reports/phase5-latest/*`) remains blocked:

- `phase5-blockers-readiness.md`: `READY`
- `phase5-execution-closure-status.md`: `BLOCKED`
- `phase5-external-handoff.md`: `BLOCKED`
- `consumer-startup-unblock-status.md`: `BLOCKED`
- `consumer-startup-failure-support-bundle.md` signals:
  - `startup_failure_runs: 0`
  - `startup_stalled_runs: 8`
  - `oldest_queued_run_age_minutes: 101`
  - queued runs still show `jobs.total_count: 0` and `artifacts.total_count: 0`
  - cancel attempts on queued runs return `HTTP 500`
  - latest cancel request id sample: `86BD:50C44:E9BB08D:D8B86F4:698C4FC9`

Latest controlled probe run URL:

- `https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21915715674`

## Escalation Refresh Sequence (Phase5 Latest)

Use this sequence to refresh the latest escalation evidence before opening/continuing a support case:

```bash
# one-shot helper (probe + closure + handoff + bundle checksum)
npm run validation:phase5-latest:refresh -- \
  SwiftEnProfundidad/pumuki-actions-healthcheck-temp \
  8 \
  .audit-reports/phase5-latest \
  .audit-reports/phase5/mock-consumer-ab-report.md
```

Equivalent explicit steps:

```bash
# 1) Trigger a controlled probe run (consumer private repo)
gh workflow run health.yml --repo <owner>/<repo>

# 2) Recompute phase5 latest closure chain (consumer side only)
npx --yes tsx@4.21.0 scripts/run-phase5-execution-closure.ts \
  --repo <owner>/<repo> \
  --limit 5 \
  --out-dir .audit-reports/phase5-latest \
  --skip-adapter \
  --skip-workflow-lint

# 3) Regenerate external handoff with explicit run URLs
npx --yes tsx@4.21.0 scripts/build-phase5-external-handoff.ts \
  --repo <owner>/<repo> \
  --phase5-status-report .audit-reports/phase5-latest/phase5-execution-closure-status.md \
  --phase5-blockers-report .audit-reports/phase5-latest/phase5-blockers-readiness.md \
  --consumer-unblock-report .audit-reports/phase5-latest/consumer-startup-unblock-status.md \
  --mock-ab-report .audit-reports/phase5/mock-consumer-ab-report.md \
  --run-report .audit-reports/phase5-latest/phase5-execution-closure-run-report.md \
  --artifact-url <run_url_1> \
  --artifact-url <run_url_2> \
  --out .audit-reports/phase5-latest/phase5-external-handoff.md
```

## Related References

- `docs/validation/phase5-execution-closure.md`
- `docs/validation/consumer-ci-startup-failure-playbook.md`
- `docs/validation/adapter-hook-runtime-validation.md`
- `docs/REFRACTOR_PROGRESS.md`
