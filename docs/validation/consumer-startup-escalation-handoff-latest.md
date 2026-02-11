# Consumer Startup Escalation Handoff (Latest)

- generated_at: 2026-02-11T09:08:43Z
- target_repo: `SwiftEnProfundidad/pumuki-actions-healthcheck-temp`
- phase5_latest_verdict_chain:
  - `phase5-blockers-readiness`: `READY`
  - `phase5-execution-closure-status`: `BLOCKED`
  - `phase5-external-handoff`: `BLOCKED`
  - `consumer-startup-unblock-status`: `BLOCKED`

## Current Blocking Signals

- `startup_failure_runs: 0`
- `startup_stalled_runs: 7`
- `oldest_queued_run_age_minutes: 852`
- latest queued runs still have:
  - `jobs.total_count: 0`
  - `artifacts.total_count: 0`

## Latest Probe URLs

- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21890238298
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21898971835
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21890133679
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21885514510
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21885160081
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21882829778

## Cancel API Error Sample

- endpoint: `POST /repos/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21890238298/cancel`
- response: `HTTP 500`
- message: `Failed to cancel workflow run`
- x-github-request-id: `8737:1B5457:BB5B2EF:AE05C0B:698BE851`

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

### Packaged Attachment Bundle

- archive: `.audit-reports/phase5-latest/consumer-startup-escalation-bundle-latest.tgz`
- size: `6.2K`
- sha256: `f86e9db3d5ce302ea31d39d6a4f1c7e57eccc4c7b12f06222fbcb57a0fcbb213`

## Escalation Message

Persistent GitHub Actions startup blockage is reproducible in a private repository using controlled workflow_dispatch probes. Latest runs remain queued/stalled before job graph creation (`jobs=0`, `artifacts=0`) without progressing to normal execution; cancel attempts on queued runs also return `HTTP 500`. Request platform-side verification of account/repository controls for private Actions execution (policy, billing/quota, or internal restrictions) and explicit root cause confirmation.

## Support Ticket Payload (Ready To Paste)

Subject:

`Persistent GitHub Actions startup blockage with queued runs and cancel HTTP 500 (private repo)`

Body:

```text
Repository: SwiftEnProfundidad/pumuki-actions-healthcheck-temp (private)

Current status:
- phase5-blockers-readiness: READY
- phase5-execution-closure-status: BLOCKED
- consumer-startup-unblock-status: BLOCKED

Signals:
- startup_failure_runs: 0
- startup_stalled_runs: 7
- oldest_queued_run_age_minutes: 852
- queued runs have jobs.total_count=0 and artifacts.total_count=0

Cancel endpoint sample:
- POST /repos/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21890238298/cancel
- HTTP 500 "Failed to cancel workflow run"
- x-github-request-id: 8737:1B5457:BB5B2EF:AE05C0B:698BE851

Latest run URLs:
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21898971835
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21890238298
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21890133679

Please verify platform-side/account-side controls for private Actions startup (policy, quota/billing, or internal restrictions) and confirm root cause.
```

## Submission Tracking

- support_ticket_id: `PENDING`
- submitted_at_utc: `PENDING`
- submitted_by: `PENDING`
- support_channel: `GitHub Support`
- follow_up_eta: `PENDING`

## Pre-Submission Verification

Before sending the support ticket, run:

```bash
shasum -a 256 .audit-reports/phase5-latest/consumer-startup-escalation-bundle-latest.tgz
```

Expected:

- `f86e9db3d5ce302ea31d39d6a4f1c7e57eccc4c7b12f06222fbcb57a0fcbb213  .audit-reports/phase5-latest/consumer-startup-escalation-bundle-latest.tgz`

And verify required files are present:

```bash
ls -1 \
  .audit-reports/phase5-latest/consumer-ci-auth-check.md \
  .audit-reports/phase5-latest/consumer-startup-failure-support-bundle.md \
  .audit-reports/phase5-latest/consumer-startup-unblock-status.md \
  .audit-reports/phase5-latest/consumer-support-ticket-draft.md \
  .audit-reports/phase5-latest/phase5-external-handoff.md
```

## Post-Submission Refresh Sequence

After GitHub Support replies/applies a fix:

1. Trigger a fresh probe:
   - `gh workflow run health.yml --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp`
2. Recompute phase5 latest closure:
   - `npx --yes tsx@4.21.0 scripts/run-phase5-execution-closure.ts --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp --limit 7 --out-dir .audit-reports/phase5-latest --skip-adapter --skip-workflow-lint`
3. Regenerate external handoff:
   - `npx --yes tsx@4.21.0 scripts/build-phase5-external-handoff.ts --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp --phase5-status-report .audit-reports/phase5-latest/phase5-execution-closure-status.md --phase5-blockers-report .audit-reports/phase5-latest/phase5-blockers-readiness.md --consumer-unblock-report .audit-reports/phase5-latest/consumer-startup-unblock-status.md --mock-ab-report .audit-reports/phase5/mock-consumer-ab-report.md --run-report .audit-reports/phase5-latest/phase5-execution-closure-run-report.md --artifact-url <new_run_url_1> --artifact-url <new_run_url_2> --out .audit-reports/phase5-latest/phase5-external-handoff.md`
4. Update progress/TODO and set blocker to closed only when:
   - `consumer-startup-unblock-status`: `READY`
   - `phase5-execution-closure-status`: `READY`
