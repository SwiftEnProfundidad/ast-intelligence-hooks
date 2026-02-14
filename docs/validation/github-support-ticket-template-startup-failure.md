# GitHub Support Ticket Template - Actions Startup Failure (Private Repo)

Use this template when startup failures persist after local workflow lint and repository-level permissions checks.

## Subject

Persistent GitHub Actions `startup_failure` with no jobs in private repository

## Repository

- Owner/repo: `<owner>/<repo>`
- Visibility: `private`
- Example branch: `<branch>`

## Problem Summary

GitHub Actions runs consistently fail with:

- `conclusion: startup_failure`
- queued/stalled runs accumulating (`status: queued`, no conclusion)
- cancel attempts on queued runs failing (`POST /cancel -> HTTP 500`)
- no jobs created (`jobs.total_count = 0`)
- no check runs (`latest_check_runs_count = 0`)
- artifact endpoint empty (`total_count = 0`)

This happens across push, pull_request, and workflow_dispatch events.

## Evidence

Run URLs (examples):

- `<run_url_1>`
- `<run_url_2>`
- `<run_url_3>`

Counters snapshot (from latest support bundle):

- `startup_failure_runs: <n>`
- `startup_stalled_runs: <n>`
- `oldest_queued_run_age_minutes: <n>`

API metadata sample:

- `GET /repos/<owner>/<repo>/actions/runs/<run_id>`
  - `name`: `<name>`
  - `path`: `<path>`
  - `conclusion`: `startup_failure`
- `GET /repos/<owner>/<repo>/actions/runs/<run_id>/jobs`
  - `total_count: 0`
- `GET /repos/<owner>/<repo>/actions/runs/<run_id>/artifacts`
  - `total_count: 0`
- `POST /repos/<owner>/<repo>/actions/runs/<run_id>/cancel`
  - `HTTP 500`
  - `x-github-request-id: <request_id>`
- `GET /repos/<owner>/<repo>/check-suites/<suite_id>`
  - `conclusion: startup_failure`
  - `latest_check_runs_count: 0`

## Diagnostics Already Performed

1. Verified Actions enabled:
   - `GET /repos/<owner>/<repo>/actions/permissions`
2. Verified workflow permissions:
   - `GET /repos/<owner>/<repo>/actions/permissions/workflow`
3. Tested access-level toggle (`actions/permissions/access`) and reverted.
4. Ran semantic workflow lint and fixed known lint findings in a temporary branch.
5. Attempted to cancel queued runs; GitHub API returned `HTTP 500`.
6. Re-triggered workflow_dispatch after fixes; startup failure/queue stall persisted.

## Expected Behavior

At least one workflow job should start for workflow_dispatch on a valid workflow file, and logs should be available.

## Request

Please check account/repository-level controls for private Actions execution (billing, policy, internal restrictions) and provide the exact reason for startup failure in these runs.

## Attachments

- CI artifact scan report markdown
- startup support bundle markdown
- startup unblock status markdown
- workflow lint report markdown
- startup-fix experiment report markdown
