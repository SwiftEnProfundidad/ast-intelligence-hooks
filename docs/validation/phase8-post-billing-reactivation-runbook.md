# Phase 8 Post-Billing Reactivation Runbook

## Purpose

Resume Phase 8 closure deterministically after billing is reactivated in the consumer GitHub account.

This runbook does not change framework logic; it only executes existing validation/orchestration commands.

## Preconditions

- Billing for GitHub Actions is reactivated/healthy in the consumer account.
- Repository is on `enterprise-refactor` with latest changes.
- `gh auth status` is healthy for the operator account.

## One-Shot Resume (Preferred)

```bash
npm run validation:phase8:resume-after-billing -- \
  SwiftEnProfundidad/pumuki-actions-healthcheck-temp \
  8 \
  .audit-reports/phase5-latest \
  .audit-reports/phase5/mock-consumer-ab-report.md
```

Expected outcome:

- Exit code `0`
- `phase5-blockers-readiness`: `READY`
- `phase5-execution-closure-status`: `READY`
- `phase5-external-handoff`: `READY`
- `consumer-startup-unblock-status`: `READY`

## Operator Quick Block (Copy/Paste)

Use this exact sequence right after billing is reactivated:

```bash
npm run validation:phase8:resume-after-billing -- \
  SwiftEnProfundidad/pumuki-actions-healthcheck-temp \
  8 \
  .audit-reports/phase5-latest \
  .audit-reports/phase5/mock-consumer-ab-report.md \
&& npm run validation:phase5-latest:ready-check
```

Interpretation:

- exit code `0`: Phase 8 chain is `READY` and you can continue with `P8-4`.
- exit code `1`: still blocked; follow `If Still Blocked`.

## Deterministic Verification

Run the explicit gate check:

```bash
npm run validation:phase5-latest:ready-check
```

Expected:

- Exit code `0`
- No blocker report in `BLOCKED` state.

Optional status helper (prints the next deterministic command):

```bash
npm run validation:phase8:next-step -- \
  .audit-reports/phase5-latest \
  SwiftEnProfundidad/pumuki-actions-healthcheck-temp \
  8 \
  .audit-reports/phase5/mock-consumer-ab-report.md
```

## If Still Blocked

1. Refresh latest evidence:
   - `npm run validation:phase5-latest:refresh -- SwiftEnProfundidad/pumuki-actions-healthcheck-temp 8 .audit-reports/phase5-latest .audit-reports/phase5/mock-consumer-ab-report.md`
2. Confirm queued runs still show stalled signal (`jobs=0`, `artifacts=0`) or any new failure mode.
3. Append latest run URLs and new counters in:
   - `docs/validation/consumer-startup-escalation-handoff-latest.md`
4. Re-open escalation cycle only if needed.

## Phase 8 Closure

When all required reports are `READY`:

1. Mark `P8-3` as done in `docs/REFRACTOR_PROGRESS.md`.
2. Mark `P8-4` as in progress.
3. Generate final ready-handoff summary/checklist:
   - `npm run validation:phase8:ready-handoff -- .audit-reports/phase5-latest`
4. Generate close-ready package (summary + READY reports):
   - `npm run validation:phase8:close-ready -- .audit-reports/phase5-latest`
5. Regenerate final handoff package and publish URLs.
