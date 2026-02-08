# Phase 5 Execution Closure Runbook

## Purpose

Close the remaining manual blockers for Phase 5 rollout validation using deterministic generated reports, without coupling gate runtime behavior to IDE-specific adapters.

## Scope

This runbook is operational. It validates rollout readiness and incident closure evidence. It does not change PRE_COMMIT, PRE_PUSH, or CI gate outcomes in this repository.

## Required Inputs

- Consumer startup triage report (external consumer repository diagnostics):
  - `docs/validation/consumer-startup-triage-report.md`

Optional adapter diagnostics input:

- Windsurf real-session runtime report:
  - `docs/validation/windsurf-real-session-report.md`

## Step 1: Generate/refresh Windsurf report

Run in this repository:

```bash
npm run validation:windsurf-session-status -- --out docs/validation/windsurf-session-status.md
npm run validation:windsurf-real-session-report -- \
  --status-report docs/validation/windsurf-session-status.md \
  --out docs/validation/windsurf-real-session-report.md
```

If strict runtime checks fail with `node: command not found`, execute:

- `docs/validation/windsurf-hook-runtime-validation.md`

and regenerate both reports.

## Step 2: Generate adapter readiness report (optional but recommended)

```bash
npm run validation:adapter-readiness -- \
  --windsurf-report docs/validation/windsurf-real-session-report.md \
  --out docs/validation/adapter-readiness.md
```

Expected adapter verdict when runtime is healthy:

- `READY`

If verdict is `BLOCKED` or `PENDING`, resolve the next-actions section in that report and regenerate it.

## Step 3: Generate/refresh consumer startup triage

Run against consumer repository context:

```bash
npm run validation:consumer-startup-triage -- \
  --repo <owner>/<repo> \
  --out-dir docs/validation \
  --skip-workflow-lint
```

Optional with workflow lint:

```bash
npm run validation:consumer-startup-triage -- \
  --repo <owner>/<repo> \
  --repo-path /absolute/path/to/consumer-repo \
  --actionlint-bin /tmp/actionlint-bin/actionlint
```

## Step 4: Consolidate Phase 5 blockers readiness

```bash
npm run validation:phase5-blockers-readiness -- \
  --consumer-triage-report docs/validation/consumer-startup-triage-report.md \
  --out docs/validation/phase5-blockers-readiness.md
```

Optional strict adapter mode:

```bash
npm run validation:phase5-blockers-readiness -- \
  --require-windsurf-report \
  --windsurf-report docs/validation/windsurf-real-session-report.md \
  --consumer-triage-report docs/validation/consumer-startup-triage-report.md \
  --out docs/validation/phase5-blockers-readiness.md
```

Expected verdict to close Phase 5 execution:

- `READY`

If verdict is `BLOCKED` or `MISSING_INPUTS`, follow the next-actions section in generated report and rerun.

## Exit Criteria

Phase 5 execution closure is complete when all are true:

- `docs/validation/phase5-blockers-readiness.md` exists with `- verdict: READY`
- `docs/TODO.md` Phase 5 execution closure item is marked complete
- Relevant rollout/report docs include links to final generated artifacts

## Quick Checklist

- [ ] `validation:windsurf-real-session-report` generated and reviewed
- [ ] `validation:adapter-readiness` generated and reviewed
- [ ] `validation:consumer-startup-triage` generated against target repo
- [ ] `validation:phase5-blockers-readiness` returns `verdict=READY`
- [ ] `docs/TODO.md` execution-closure item updated

## Related References

- `docs/validation/windsurf-hook-runtime-validation.md`
- `docs/validation/consumer-ci-startup-failure-playbook.md`
- `docs/validation/skills-rollout-consumer-repositories.md`
- `docs/TODO.md`
