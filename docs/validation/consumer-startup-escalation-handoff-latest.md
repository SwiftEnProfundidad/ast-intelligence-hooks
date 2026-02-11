# Consumer Startup Escalation Handoff (Latest)

- generated_at: 2026-02-11T19:29:02Z
- target_repo: `SwiftEnProfundidad/pumuki-actions-healthcheck-temp`
- phase5_latest_verdict_chain:
  - `phase5-blockers-readiness`: `READY`
  - `phase5-execution-closure-status`: `BLOCKED`
  - `phase5-external-handoff`: `BLOCKED`
  - `consumer-startup-unblock-status`: `BLOCKED`

## Current Blocking Signals

- `startup_failure_runs: 0`
- `startup_stalled_runs: 8`
- `oldest_queued_run_age_minutes: 18`
- latest queued runs still have:
  - `jobs.total_count: 0`
  - `artifacts.total_count: 0`

## Latest Probe URLs

- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21902330502
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21901391166
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21900914631
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21900855192
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21900096926
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21898971835

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
- size: `8.0K`
- sha256: `487b22d4aba841bee7d4f7b28268b15a94c72a9228119747c2144032f401ab6d`

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
- oldest_queued_run_age_minutes: 18
- queued runs have jobs.total_count=0 and artifacts.total_count=0

Cancel endpoint sample:
- POST /repos/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21900096926/cancel
- HTTP 500 "Failed to cancel workflow run"
- x-github-request-id: 86BD:50C44:E9BB08D:D8B86F4:698C4FC9

Latest run URLs:
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21919875855
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21919768218
- https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21919680286

Please verify platform-side/account-side controls for private Actions startup (policy, quota/billing, or internal restrictions) and confirm root cause.
```

## Submission Tracking

- submission_readiness: `READY_TO_SUBMIT`
- submission_blocker: `NONE`
- support_ticket_id: `4077449`
- submitted_at_utc: `2026-02-11T13:54:02Z`
- submitted_by: `SwiftEnProfundidad`
- support_channel: `GitHub Support`
- follow_up_eta: `2026-02-12 18:00 UTC`
- known_external_cause: `BILLING_INACTIVE_OR_NOT_UPDATED`
- ticket_closure_owner: `SwiftEnProfundidad (manual close planned)`
- pre_submission_verification: `PASS`
- pre_submission_verified_at_utc: `2026-02-11T09:54:18Z`

## Manual Portal Submission Checklist (Execution)

Use this sequence exactly when submitting in GitHub Support portal:

1. Open a new support case and paste:
   - Subject: `Persistent GitHub Actions startup blockage with queued runs and cancel HTTP 500 (private repo)`
   - Body: copy from `Support Ticket Payload (Ready To Paste)` above.
2. Attach the packaged evidence archive:
   - `.audit-reports/phase5-latest/consumer-startup-escalation-bundle-latest.tgz`
3. Add latest run URLs (minimum 2) in the case body:
   - `https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21919875855`
   - `https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21919768218`
4. After pressing submit, update `Submission Tracking` in this file:
   - `support_ticket_id: <real id>`
   - `submitted_at_utc: <YYYY-MM-DDTHH:MM:SSZ>`
   - `submitted_by: <github user>`
   - `follow_up_eta: <date/time from support SLA>`
5. Optional fast update command:
   - `npm run validation:phase5-escalation:mark-submitted -- <support_ticket_id> <submitted_by> "<follow_up_eta>" [submitted_at_utc]`
6. Optional payload/export command (portal copy/paste + attachments checklist):
   - `npm run validation:phase5-escalation:payload -- .audit-reports/phase5-latest`
   - output: `.audit-reports/phase5-latest/github-support-portal-payload.txt`
7. Optional deterministic pre-submit gate:
   - `npm run validation:phase5-escalation:ready-to-submit -- .audit-reports/phase5-latest`
   - expected exit code: `0` only when readiness, checksum and attachment checklist are aligned.
8. Optional one-shot submission package helper:
   - `npm run validation:phase5-escalation:prepare -- .audit-reports/phase5-latest`
   - runs pre-submit gate + payload generation and prints final manual steps.
9. Optional post-submit close helper (handoff + queue transition):
   - `npm run validation:phase5-escalation:close-submission -- <support_ticket_id> <submitted_by> "<follow_up_eta>" [submitted_at_utc]`
   - applies `Submission Tracking` update and flips queue from `P8-2b` to `P8-3`.
10. Channel constraint:
   - GitHub CLI does not provide a `support` command for case creation; submission must be done in GitHub Support portal.
   - Direct REST probe endpoints also return `404 Not Found` (`POST /support/tickets`, `POST /user/support/tickets`).

## Pre-Submission Verification

Before sending the support ticket, run:

```bash
shasum -a 256 .audit-reports/phase5-latest/consumer-startup-escalation-bundle-latest.tgz
```

Expected:

- `487b22d4aba841bee7d4f7b28268b15a94c72a9228119747c2144032f401ab6d  .audit-reports/phase5-latest/consumer-startup-escalation-bundle-latest.tgz`

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

Fast path:

1. Run one-shot refresh:
   - `npm run validation:phase5-latest:refresh -- SwiftEnProfundidad/pumuki-actions-healthcheck-temp 8 .audit-reports/phase5-latest .audit-reports/phase5/mock-consumer-ab-report.md`
2. Run one-shot post-support closure check:
   - `npm run validation:phase5-post-support:refresh -- SwiftEnProfundidad/pumuki-actions-healthcheck-temp 8 .audit-reports/phase5-latest .audit-reports/phase5/mock-consumer-ab-report.md`
   - expected exit code: `0` only when chain is fully `READY`.

Equivalent explicit steps:

1. Trigger a fresh probe:
   - `gh workflow run health.yml --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp`
2. Recompute phase5 latest closure:
   - `npx --yes tsx@4.21.0 scripts/run-phase5-execution-closure.ts --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp --limit 7 --out-dir .audit-reports/phase5-latest --skip-adapter --skip-workflow-lint`
3. Regenerate external handoff:
   - `npx --yes tsx@4.21.0 scripts/build-phase5-external-handoff.ts --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp --phase5-status-report .audit-reports/phase5-latest/phase5-execution-closure-status.md --phase5-blockers-report .audit-reports/phase5-latest/phase5-blockers-readiness.md --consumer-unblock-report .audit-reports/phase5-latest/consumer-startup-unblock-status.md --mock-ab-report .audit-reports/phase5/mock-consumer-ab-report.md --run-report .audit-reports/phase5-latest/phase5-execution-closure-run-report.md --artifact-url <new_run_url_1> --artifact-url <new_run_url_2> --out .audit-reports/phase5-latest/phase5-external-handoff.md`
4. Update progress/TODO and set blocker to closed only when:
   - `consumer-startup-unblock-status`: `READY`
   - `phase5-execution-closure-status`: `READY`
5. Run deterministic chain check:
   - `npm run validation:phase5-latest:ready-check`
   - expected exit code: `0` only when all required reports are `READY`.
