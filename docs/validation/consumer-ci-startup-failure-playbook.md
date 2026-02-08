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

7. Validate repository/org policy constraints:

- Required workflow policies
- Organization restrictions on external actions
- Required SHA pinning settings
- Billing/quota limits for Actions

8. Re-trigger a minimal workflow and verify:

- run no longer exits at startup
- workflow name is present
- job graph is created
- artifact API returns non-zero artifacts when upload steps exist

## Exit Criteria

Startup-failure incident is considered resolved when:

- new runs have valid workflow names and job graph
- no startup-failure conclusions for target pipeline
- artifact endpoints return expected evidence artifacts

## Related Reports

- `docs/validation/skills-rollout-consumer-ci-artifacts.md`
- `docs/validation/skills-rollout-r_go-multi-platform-report.md`
