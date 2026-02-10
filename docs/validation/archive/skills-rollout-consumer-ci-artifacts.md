# Skills Rollout Validation - Consumer CI Artifact Status

Date: 2026-02-08  
Target consumer repository: `SwiftEnProfundidad/pumuki-mock-consumer`

## Objective

Collect CI artifact URLs from consumer-repository GitHub Actions runs to complement local stage-run rollout validation.

## Commands Executed

```bash
npm run validation:consumer-ci-auth-check -- --repo SwiftEnProfundidad/pumuki-mock-consumer \
  --out docs/validation/consumer-ci-auth-check.md

npm run validation:consumer-ci-artifacts -- --repo SwiftEnProfundidad/pumuki-mock-consumer --limit 20 \
  --out docs/validation/consumer-ci-artifacts-report.md

gh run list --repo SwiftEnProfundidad/pumuki-mock-consumer --limit 20 \
  --json databaseId,displayTitle,headBranch,workflowName,status,conclusion,url,createdAt,event

gh api repos/SwiftEnProfundidad/pumuki-mock-consumer/actions/runs/<run_id>/artifacts
```

## Observed State

- Recent runs are consistently `startup_failure`.
- `workflowName` is empty in listed runs.
- Run metadata shows `path: "BuildFailed"` and no referenced workflows.
- GitHub Actions check-suite for those commits is completed with `startup_failure` and `latest_check_runs_count: 0`.
- Artifact API returns `total_count: 0` for inspected run IDs.

Sample run URLs:

- `https://github.com/SwiftEnProfundidad/pumuki-mock-consumer/actions/runs/21790671740`
- `https://github.com/SwiftEnProfundidad/pumuki-mock-consumer/actions/runs/21790670134`
- `https://github.com/SwiftEnProfundidad/pumuki-mock-consumer/actions/runs/21790667107`

Sample artifact query result:

- `GET /repos/SwiftEnProfundidad/pumuki-mock-consumer/actions/runs/21790671740/artifacts`
- response: `{ "total_count": 0, "artifacts": [] }`

Additional API probe summary:

- `GET /repos/SwiftEnProfundidad/pumuki-mock-consumer/actions/runs/21790671740`
  - `name: ""`
  - `path: "BuildFailed"`
  - `conclusion: "startup_failure"`
- `GET /repos/SwiftEnProfundidad/pumuki-mock-consumer/check-suites/56738342712`
  - `conclusion: "startup_failure"`
  - `latest_check_runs_count: 0`

Comparative signal (inference):

- `SwiftEnProfundidad/pumuki-mock-consumer` is `private` and shows persistent `startup_failure`.
- `SwiftEnProfundidad/ast-intelligence-hooks` is `public` and does not show `startup_failure` in recent runs.
- This strongly suggests a repository/account policy or billing constraint specific to private-repo Actions execution in `pumuki-mock-consumer`.

Controlled setting test:

- Initial `GET /repos/SwiftEnProfundidad/pumuki-mock-consumer/actions/permissions/access`: `access_level = none`
- Temporary update to `access_level = user`, then `workflow_dispatch` run:
  - run: `https://github.com/SwiftEnProfundidad/pumuki-mock-consumer/actions/runs/21790840030`
  - result: `startup_failure` (unchanged)
- Setting reverted to original (`access_level = none`) after the check.

Interpretation:

- Workflow-access level is not the primary cause of the startup failure in this repository.
- Billing confirmation via `GET /users/{username}/settings/billing/actions` remains pending because current token scopes do not include `user`.
- Non-interactive attempt to add `user` scope requires browser/device authorization and cannot be completed automatically in this execution context.
- Semantic workflow lint in `pumuki-mock-consumer` reports invalid definitions likely contributing to startup failures (see workflow lint report below).
- Controlled branch experiment with lint fixes still resulted in `startup_failure` for both push and workflow-dispatch runs.

Automated scan output:

- `docs/validation/consumer-ci-auth-check.md`
- `docs/validation/consumer-ci-artifacts-report.md`
- `docs/validation/archive/skills-rollout-mock_consumer-workflow-lint.md`
- `docs/validation/consumer-workflow-lint-report.md`
- `docs/validation/archive/skills-rollout-mock_consumer-startup-fix-experiment.md`
- `docs/validation/archive/private-actions-healthcheck.md`
- `docs/validation/consumer-startup-failure-support-bundle.md`

Tracking issue in consumer repository:

- `SwiftEnProfundidad/pumuki-mock-consumer#582`  
  `https://github.com/SwiftEnProfundidad/pumuki-mock-consumer/issues/582`

Additional external confirmation:

- private temp repo minimal workflow also fails with `startup_failure`:  
  `https://github.com/SwiftEnProfundidad/pumuki-actions-healthcheck-temp/actions/runs/21797682919`

## Conclusion

Consumer CI artifact URLs cannot be attached yet because runs are failing at startup and do not emit artifacts.

## Next Action

Restore consumer workflow startup health first, then rerun and capture artifact URLs for:

- `PRE_COMMIT`/`PRE_PUSH`/`CI` evidence artifacts
- corresponding run URL + artifact URL pairs for rollout traceability

Reference playbook:

- `docs/validation/consumer-ci-startup-failure-playbook.md`
