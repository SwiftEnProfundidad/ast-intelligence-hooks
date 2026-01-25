# 🚨 MANDATORY GATE CHECK - Claude Code CLI

> **BEFORE doing ANYTHING, call `ai_gate_check` via MCP or run:**

```bash
npx ast-hooks audit
cat .AI_EVIDENCE.json | jq '.ai_gate.status'
```

## Rules

1. **FIRST action** = gate check
2. `BLOCKED` → Fix violations BEFORE proceeding
3. `ALLOWED` → Proceed with task
4. **ALL severities block by default** (CRITICAL, HIGH, MEDIUM, LOW) - v6.2.9+

## Blocking Severities

| Mode | Blocked Severities | Env Var |
|------|-------------------|---------|
| DEFAULT | CRITICAL, HIGH, MEDIUM, LOW | (none) |
| LEGACY | CRITICAL, HIGH only | `AST_BLOCKING_MODE=LEGACY` |

## If BLOCKED

1. Read violations: `jq '.ai_gate.violations' .AI_EVIDENCE.json`
2. Fix violations in order: CRITICAL → HIGH → MEDIUM → LOW
3. Re-run audit: `npx ast-hooks audit`
4. Only proceed when status = `ALLOWED`

## Accessibility Rules (MANDATORY by Law)

All iOS views MUST have:
- VoiceOver labels (`.accessibilityLabel()`)
- Dynamic Type support (`.preferredFont(forTextStyle:)`)
- Reduce Motion check (`UIAccessibility.isReduceMotionEnabled`)
- Color Contrast WCAG 2.1 AA (4.5:1 text, 3:1 graphics)

**NO EXCEPTIONS.**

🐈💚 Pumuki Team® - AST Intelligence Framework
