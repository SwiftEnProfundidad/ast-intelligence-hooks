# Validation Docs Policy

This folder mixes two categories:

1. Versioned runbooks/playbooks (kept in git).
2. Generated execution reports (local outputs, not baseline documentation).

Validation runbooks in this folder are operational adapters. They support rollout diagnostics and incident handling, but they are not required inputs for deterministic PRE_COMMIT/PRE_PUSH/CI gate decisions.

## Versioned Documents

Keep these as source-of-truth operational references:

- `consumer-ci-startup-failure-playbook.md`
- `github-support-ticket-template-startup-failure.md`
- `phase5-execution-closure.md`
- `skills-rollout-consumer-repositories.md`
- `adapter-hook-runtime-validation.md`
- `adapter-hook-runtime-local-report.md`
- `adapter-real-session-report-template.md`

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
- `consumer-startup-triage-report.md`
- `phase5-blockers-readiness.md`
- `phase5-execution-closure-status.md`
- `adapter-readiness.md`
- `adapter-session-status.md`
- `adapter-real-session-report.md`

Generate them on demand with:

- `npm run validation:consumer-ci-auth-check -- --repo <owner>/<repo>`
- `npm run validation:consumer-ci-artifacts -- --repo <owner>/<repo>`
- `npm run validation:consumer-workflow-lint -- --repo-path <path>`
- `npm run validation:consumer-support-bundle -- --repo <owner>/<repo>`
- `npm run validation:consumer-support-ticket-draft -- --repo <owner>/<repo>`
- `npm run validation:consumer-startup-unblock-status -- --repo <owner>/<repo>`
- `npm run validation:consumer-startup-triage -- --repo <owner>/<repo> --skip-workflow-lint`
- `npm run validation:phase5-blockers-readiness`
- optional strict mode:
  - `npm run validation:phase5-blockers-readiness -- --require-adapter-report --adapter-report docs/validation/adapter-real-session-report.md --consumer-triage-report docs/validation/consumer-startup-triage-report.md`
- `npm run validation:phase5-execution-closure-status`
- optional strict adapter mode:
  - `npm run validation:phase5-execution-closure-status -- --require-adapter-readiness --phase5-blockers-report docs/validation/phase5-blockers-readiness.md --consumer-unblock-report docs/validation/consumer-startup-unblock-status.md --adapter-readiness-report docs/validation/adapter-readiness.md`
- `npm run validation:adapter-readiness`
- `npm run validation:adapter-session-status`
- `npm run validation:adapter-real-session-report`

## Hygiene Check

Run documentation hygiene validation with:

- `npm run validation:docs-hygiene`

The same check is available in `npm run framework:menu` under the docs hygiene action.

For repository skills drift protection, run:

- `npm run skills:lock:check`

That lock-freshness check is also available in `npm run framework:menu`.
