# README Menu Walkthrough (Option 1)

This walkthrough documents **Option 1: Full audit (repo analysis · PRE_COMMIT)** with real execution captures.

## Capture 1 — Consumer Menu (v2)

![Consumer Menu v2](../assets/readme/menu-option1/01-menu-consumer-v2.png)

What this shows:

- Consumer menu grouped by operational flows.
- Option `1` is the full repo audit path for `PRE_COMMIT` policy.
- Current menu status reflects latest evidence context.

## Capture 2 — Option 1 Pre-flight (BLOCK context)

![Option 1 Pre-flight Block](../assets/readme/menu-option1/02-option1-preflight-block.png)

What this shows:

- Pre-flight validation runs before gate execution.
- Runtime context includes branch/upstream/worktree/evidence freshness.
- Operational hints explain why governance is currently blocked.

## Capture 3 — Option 1 Final Summary (BLOCK)

![Option 1 Final Summary Block](../assets/readme/menu-option1/03-option1-final-summary-block.png)

What this shows:

- Deterministic severity summary and metrics.
- Explicit blocking decision:
  - `Stage: PRE_COMMIT`
  - `Outcome: BLOCK`
- Actionable remediation next step.

## Capture 4 — Option 1 Pre-flight (PASS scenario)

![Option 1 Pre-flight Pass Scenario](../assets/readme/menu-option1/04-option1-preflight-pass.png)

What this shows:

- A clean fixture scenario where the run can complete without findings.
- Pre-flight can still surface policy warnings while run execution proceeds.

## Capture 5 — Option 1 Final Summary (PASS)

![Option 1 Final Summary Pass](../assets/readme/menu-option1/05-option1-final-summary-pass.png)

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
