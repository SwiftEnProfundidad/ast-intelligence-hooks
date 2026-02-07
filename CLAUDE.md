# Mandatory Gate Check (Claude Code CLI)

Before starting any implementation task, execute a gate check:

```bash
npx ast-hooks audit
cat .AI_EVIDENCE.json | jq '.ai_gate.status'
```

## Execution Contract

1. First action must be gate evaluation.
2. If status is `BLOCKED`, resolve violations before any code change.
3. If status is `ALLOWED`, proceed with the task.
4. Blocking severities default to all levels (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) from v6.2.9 onward.

## Blocking Modes

| Mode | Blocking severities | Environment variable |
|---|---|---|
| `DEFAULT` | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` | none |
| `LEGACY` | `CRITICAL`, `HIGH` | `AST_BLOCKING_MODE=LEGACY` |

## When Status Is BLOCKED

1. Inspect findings:

```bash
jq '.ai_gate.violations' .AI_EVIDENCE.json
```

2. Resolve in severity order: `CRITICAL` → `HIGH` → `MEDIUM` → `LOW`.
3. Re-run audit:

```bash
npx ast-hooks audit
```

4. Continue only when `status == "ALLOWED"`.

## Accessibility Baseline (Mandatory)

For iOS views, enforce at minimum:
- VoiceOver labels (`.accessibilityLabel()`).
- Dynamic Type support (`.preferredFont(forTextStyle:)`).
- Reduce Motion checks (`UIAccessibility.isReduceMotionEnabled`).
- WCAG 2.1 AA contrast requirements (4.5:1 text, 3:1 graphics).

Policy exceptions are not allowed unless formally approved in platform governance.
