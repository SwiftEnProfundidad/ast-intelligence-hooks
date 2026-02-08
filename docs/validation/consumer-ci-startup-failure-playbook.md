# Consumer CI Startup Failure Playbook

## Purpose

Provide a deterministic troubleshooting sequence when consumer repository GitHub Actions runs fail with:

- `conclusion: startup_failure`
- `workflowName: ""`
- run metadata `path: "BuildFailed"`
- no emitted artifacts

## Scope

Use this playbook before expecting CI artifact URLs for rollout validation reports.

## Diagnostic Steps

1. Confirm Actions status and permissions:

```bash
gh api repos/<owner>/<repo>/actions/permissions
gh api repos/<owner>/<repo>/actions/permissions/workflow
gh api repos/<owner>/<repo>/actions/permissions/access
```

2. Inspect latest failed runs:

```bash
gh run list --repo <owner>/<repo> --limit 20 \
  --json databaseId,workflowName,status,conclusion,url,createdAt,event
```

Alternative (framework helper, generates Markdown report):

```bash
npm run validation:consumer-ci-artifacts -- --repo <owner>/<repo> --limit 20 \
  --out docs/validation/<repo>-consumer-ci-artifacts-scan.md
```

3. Inspect failing run metadata:

```bash
gh api repos/<owner>/<repo>/actions/runs/<run_id>
```

Check for:

- empty `name`
- `path: "BuildFailed"`
- no `referenced_workflows`

4. Inspect Actions check-suite metadata:

```bash
gh api repos/<owner>/<repo>/check-suites/<check_suite_id>
```

Check for:

- `conclusion: startup_failure`
- `latest_check_runs_count: 0`

5. Validate workflow registration:

```bash
gh api repos/<owner>/<repo>/actions/workflows
```

If workflows are listed as `active` but runs still fail at startup, continue with YAML and policy verification.

6. Validate workflow YAML locally:

- Ensure every `.github/workflows/*.yml` parses cleanly.
- Check for invalid keys, indentation issues, or disallowed expressions.
- Verify reusable workflow references resolve and are accessible.
- Run semantic lint checks (recommended `actionlint`) to catch invalid runner labels and unsupported action inputs.

Framework helper (optional):

```bash
npm run validation:consumer-workflow-lint -- \
  --repo-path /absolute/path/to/consumer-repo \
  --actionlint-bin /tmp/actionlint-bin/actionlint \
  --out docs/validation/consumer-workflow-lint-report.md
```

7. Validate repository/org policy constraints:

- Required workflow policies
- Organization restrictions on external actions
- Required SHA pinning settings
- Billing/quota limits for Actions
- Public/private visibility constraints in current GitHub plan

If billing visibility is blocked by token scopes:

- refresh auth with `gh auth refresh -h github.com -s user`
- complete device/browser authorization
- query billing endpoint again:
  - `gh api users/<username>/settings/billing/actions`

8. Re-trigger a minimal workflow and verify:

- run no longer exits at startup
- workflow name is present
- job graph is created
- artifact API returns non-zero artifacts when upload steps exist

Optional controlled check:

- Temporarily change `actions/permissions/access` and trigger one `workflow_dispatch` run.
- If startup failure is unchanged, revert to original value and continue policy/billing investigation.
- Optionally apply a temporary branch-only workflow lint fix set and re-test:
  - if startup failure is unchanged, treat repository/account-level constraints as primary suspects.

Known example of semantic lint findings correlated with startup failures:

- `runs-on: macos-13` unknown label (in affected consumer repo context)
- unsupported input key (`assertions`) for `treosh/lighthouse-ci-action@v12`

## Exit Criteria

Startup-failure incident is considered resolved when:

- new runs have valid workflow names and job graph
- no startup-failure conclusions for target pipeline
- artifact endpoints return expected evidence artifacts

If unresolved after workflow and access-level checks:

- escalate to repository owner account settings/billing review
- open GitHub Support ticket with run URLs and check-suite metadata
- use template: `docs/validation/github-support-ticket-template-startup-failure.md`

## Related Reports

- `docs/validation/skills-rollout-consumer-ci-artifacts.md`
- `docs/validation/skills-rollout-r_go-multi-platform-report.md`
- `docs/validation/private-actions-healthcheck-temp.md`
