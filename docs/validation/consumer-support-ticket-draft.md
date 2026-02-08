# Consumer CI Support Ticket Draft

- generated_at: 2026-02-08T13:06:03.045Z
- repository: `SwiftEnProfundidad/R_GO`
- source_support_bundle: `docs/validation/skills-rollout-r_go-support-bundle.md`
- source_auth_report: `docs/validation/consumer-ci-auth-check.md`

## Subject

Persistent GitHub Actions `startup_failure` with no jobs in private repository

## Problem Summary

- Runs consistently end with `conclusion: startup_failure`.
- startup_failure_runs observed: 20.
- run metadata path: BuildFailed.
- jobs.total_count: 0.
- artifacts.total_count: 0.
- repo visibility: private.

## Evidence

Sample run URLs:
- https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21798009269
- https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21798009251
- https://github.com/SwiftEnProfundidad/R_GO/actions/runs/21798008059

## Auth and Billing Probe

- auth verdict: BLOCKED
- detected scopes: gist, read:org, repo, workflow
- missing scopes: user
- billing probe error: Command failed: gh api users/SwiftEnProfundidad/settings/billing/actions gh: Not Found (HTTP 404) gh: This API operation needs the "user" scope. To request it, run: gh auth refresh -h github.com -s user

## Request

Please verify account/repository-level controls for private Actions execution (billing, policy, quotas, or internal restrictions) and provide the exact root cause for startup_failure before job graph creation.

## Attachments

- docs/validation/skills-rollout-r_go-support-bundle.md
- docs/validation/consumer-ci-auth-check.md
- docs/validation/skills-rollout-r_go-ci-artifacts-scan.md
- docs/validation/skills-rollout-r_go-workflow-lint-auto.md
- docs/validation/skills-rollout-r_go-startup-fix-experiment.md
- docs/validation/private-actions-healthcheck-temp.md

