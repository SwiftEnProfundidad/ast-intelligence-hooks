# Consumer Startup Escalation Handoff (Latest)

- generated_at: 2026-02-11T09:45:10Z
- target_repo: `SwiftEnProfundidad/pumuki-actions-healthcheck-temp`
- phase5_latest_verdict_chain:
  - `phase5-blockers-readiness`: `READY`
  - `phase5-execution-closure-status`: `BLOCKED`
  - `phase5-external-handoff`: `BLOCKED`
  - `consumer-startup-unblock-status`: `BLOCKED`

## Current Blocking Signals

- `startup_failure_runs: 0`
- `startup_stalled_runs: 8`
- `oldest_queued_run_age_minutes: 888`
- latest queued runs still have:
  - `jobs.total_count: 0`
  - `artifacts.total_count: 0`

## Latest Probe URLs

- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21900096926
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21890238298
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21898971835
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21890133679
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21885514510
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21885160081

## Cancel API Error Sample

- endpoint: `POST /repos/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21900096926/cancel`
- response: `HTTP 500`
- message: `Failed to cancel workflow run`
- x-github-request-id: `86BD:50C44:E9BB08D:D8B86F4:698C4FC9`

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
- size: `6.7K`
- sha256: `f62cc69715424f173c8fbd67d6d4d59921ad80f19d5772b86ef1786ff5a3fb28`

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
- startup_stalled_runs: 8
- oldest_queued_run_age_minutes: 888
- queued runs have jobs.total_count=0 and artifacts.total_count=0

Cancel endpoint sample:
- POST /repos/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21900096926/cancel
- HTTP 500 "Failed to cancel workflow run"
- x-github-request-id: 86BD:50C44:E9BB08D:D8B86F4:698C4FC9

Latest run URLs:
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21900096926
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21898971835
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21890238298

Please verify platform-side/account-side controls for private Actions startup (policy, quota/billing, or internal restrictions) and confirm root cause.
```

## Submission Tracking

- submission_readiness: `READY_TO_SUBMIT`
- submission_blocker: `MANUAL_GITHUB_SUPPORT_PORTAL_SUBMISSION`
- support_ticket_id: `PENDING`
- submitted_at_utc: `PENDING`
- submitted_by: `PENDING`
- support_channel: `GitHub Support`
- follow_up_eta: `PENDING`
- pre_submission_verification: `PASS`
- pre_submission_verified_at_utc: `2026-02-11T09:54:18Z`

## Pre-Submission Verification

Before sending the support ticket, run:

```bash
shasum -a 256 .audit-reports/phase5-latest/consumer-startup-escalation-bundle-latest.tgz
```

Expected:

- `f62cc69715424f173c8fbd67d6d4d59921ad80f19d5772b86ef1786ff5a3fb28  .audit-reports/phase5-latest/consumer-startup-escalation-bundle-latest.tgz`

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
