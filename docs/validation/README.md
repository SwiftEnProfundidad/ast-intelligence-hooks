# Validation Docs Policy

This folder mixes two categories:

1. Versioned runbooks/playbooks (kept in git).
2. Generated execution reports (local outputs, not baseline documentation).

## Versioned Documents

Keep these as source-of-truth operational references:

- `consumer-ci-startup-failure-playbook.md`
- `github-support-ticket-template-startup-failure.md`
- `skills-rollout-consumer-repositories.md`
- `skills-rollout-consumer-ci-artifacts.md`
- `windsurf-hook-runtime-validation.md`
- `windsurf-hook-runtime-local-report.md`
- `windsurf-real-session-report-template.md`

## Archived Historical Reports

Historical execution reports are isolated under:

- `archive/`

## Generated Outputs (Do Not Keep as Baseline Docs)

These files are command outputs and should be generated per execution context:

- `consumer-ci-auth-check.md`
- `consumer-ci-artifacts-report.md`
- `consumer-workflow-lint-report.md`
- `consumer-startup-failure-support-bundle.md`
- `consumer-support-ticket-draft.md`
- `consumer-startup-unblock-status.md`
- `windsurf-session-status.md`
- `windsurf-real-session-report.md`

Generate them on demand with:

- `npm run validation:consumer-ci-auth-check -- --repo <owner>/<repo>`
- `npm run validation:consumer-ci-artifacts -- --repo <owner>/<repo>`
- `npm run validation:consumer-workflow-lint -- --repo-path <path>`
- `npm run validation:consumer-support-bundle -- --repo <owner>/<repo>`
- `npm run validation:consumer-support-ticket-draft -- --repo <owner>/<repo>`
- `npm run validation:consumer-startup-unblock-status -- --repo <owner>/<repo>`
- `npm run validation:windsurf-session-status`
- `npm run validation:windsurf-real-session-report`

## Hygiene Check

Run documentation hygiene validation with:

- `npm run validation:docs-hygiene`

The same check is available in `npm run framework:menu` under the docs hygiene action.

For repository skills drift protection, run:

- `npm run skills:lock:check`

That lock-freshness check is also available in `npm run framework:menu`.
