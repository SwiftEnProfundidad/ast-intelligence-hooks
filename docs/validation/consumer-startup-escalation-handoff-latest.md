# Consumer Startup Escalation Handoff (Latest)

- generated_at: 2026-02-11T02:14:29Z
- target_repo: `SwiftEnProfundidad/pumuki-actions-healthcheck-temp`
- phase5_latest_verdict_chain:
  - `phase5-blockers-readiness`: `READY`
  - `phase5-execution-closure-status`: `BLOCKED`
  - `phase5-external-handoff`: `BLOCKED`
  - `consumer-startup-unblock-status`: `BLOCKED`

## Current Blocking Signals

- `startup_failure_runs: 0`
- `startup_stalled_runs: 5`
- `oldest_queued_run_age_minutes: 437`
- latest queued runs still have:
  - `jobs.total_count: 0`
  - `artifacts.total_count: 0`

## Latest Probe URLs

- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21890133679
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21885514510
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21885160081
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21882829778
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21878337799

## Evidence Bundle (Phase5 Latest)

- `.audit-reports/phase5-latest/consumer-ci-auth-check.md`
- `.audit-reports/phase5-latest/consumer-startup-failure-support-bundle.md`
- `.audit-reports/phase5-latest/consumer-startup-unblock-status.md`
- `.audit-reports/phase5-latest/consumer-startup-triage-report.md`
- `.audit-reports/phase5-latest/consumer-support-ticket-draft.md`
- `.audit-reports/phase5-latest/phase5-blockers-readiness.md`
- `.audit-reports/phase5-latest/phase5-execution-closure-status.md`
- `.audit-reports/phase5-latest/phase5-execution-closure-run-report.md`
- `.audit-reports/phase5-latest/phase5-external-handoff.md`

## Escalation Message

Persistent GitHub Actions startup blockage is reproducible in a private repository using controlled workflow_dispatch probes. Latest runs remain queued/stalled before job graph creation (`jobs=0`, `artifacts=0`) without progressing to normal execution. Request platform-side verification of account/repository controls for private Actions execution (policy, billing/quota, or internal restrictions) and explicit root cause confirmation.
