# README Menu Walkthrough (Consumer Legacy)

This walkthrough documents the consumer legacy menu contract restored from tag `v0-legacy-last`, specifically `scripts/hooks-system/infrastructure/shell/orchestrators/audit-orchestrator.sh`.

## Capture 1 — Consumer Menu (legacy)

![Consumer Menu legacy](../assets/readme/menu-option1/01-menu-consumer-v2.png)

What this shows:

- The consumer menu is a flat legacy surface with 9 options.
- Option `1` is `Full audit (repo analysis)`.
- Options `2-4` are the strict/staged/standard audit flows.
- Options `5-8` keep the legacy diagnostics/export actions.
- Option `9` is `Exit`.
- The audit output follows the legacy `summarize_all` sections and severity counts.

## Capture 2 — Archived v2 Full-Audit Pre-flight (BLOCK context)

![Archived v2 Full-Audit Pre-flight Block](../assets/readme/menu-option1/02-option1-preflight-block.png)

What this shows:

- Pre-flight validation runs before gate execution.
- Runtime context includes branch/upstream/worktree/evidence freshness.
- Operational hints explain why governance is currently blocked.

## Capture 3 — Archived v2 Full-Audit Final Summary (BLOCK)

![Archived v2 Full-Audit Final Summary Block](../assets/readme/menu-option1/03-option1-final-summary-block.png)

What this shows:

- Deterministic severity summary and metrics.
- Explicit blocking decision:
  - `Stage: PRE_COMMIT`
  - `Outcome: BLOCK`
- Actionable remediation next step.

## Capture 4 — Archived v2 Full-Audit Pre-flight (PASS scenario)

![Archived v2 Full-Audit Pre-flight Pass Scenario](../assets/readme/menu-option1/04-option1-preflight-pass.png)

What this shows:

- A clean fixture scenario where the run can complete without findings.
- Pre-flight can still surface policy warnings while run execution proceeds.

## Capture 5 — Archived v2 Full-Audit Final Summary (PASS)

![Archived v2 Full-Audit Final Summary Pass](../assets/readme/menu-option1/05-option1-final-summary-pass.png)

What this shows:

- Zero violations across severities.
- Deterministic final decision:
  - `Stage: PRE_COMMIT`
  - `Outcome: PASS`
- Guidance to keep baseline quality.

## Capture 6 — Menu Status After PASS Run

![Menu After Pass Run](../assets/readme/menu-option1/06-menu-after-run-pass.png)

What this shows:

- Menu status updated to `PASS` after a successful run.
- Fast health visibility before selecting the next action.
