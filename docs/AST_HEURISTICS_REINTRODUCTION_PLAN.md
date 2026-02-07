# AST Heuristics Reintroduction Plan (Post-Validation)

This document defines how to reintroduce selective AST heuristics after core validation is stable.

## Validation gate before implementation

Do not enable new semantic extractors until:

- TypeScript baseline is clean for `core/**` and `integrations/**`
- Existing multi-platform PRE_COMMIT/PRE_PUSH/CI flows remain deterministic
- Evidence output stays on schema `version: "2.1"`

## Initial heuristic backlog

### iOS (Swift)

- Detect force unwrap usage by AST node analysis
- Detect `AnyView` usage by type reference, not text match
- Detect callback-style APIs outside approved bridge layers

### Backend / Frontend (TypeScript)

- Detect empty `catch` blocks by AST
- Detect unrestricted `any` usage by node kind
- Detect production `console.log` in executable code paths

### Android (Kotlin)

- Detect `Thread.sleep` invocation nodes
- Detect `GlobalScope` usage in production paths
- Detect `runBlocking` outside test/source-set exceptions

## Integration contract

- New semantics should be emitted as typed Facts in `core/facts/*`.
- Rules remain declarative in Rule Packs and evaluated by existing gate.
- No changes to evidence contract except additive typed fields when required.

## Rollout phases

1. Add Facts behind feature flag (default off).
2. Add rules consuming those Facts with `WARN` severity first.
3. Promote selected rules to `ERROR`/`CRITICAL` after project validation window.

## Feature flag

- Flag: `PUMUKI_ENABLE_AST_HEURISTICS`
- Values that enable: `1`, `true`, `yes`, `on`
- Default: disabled

When enabled, the gate records `astHeuristicsRuleSet@0.3.0` in evidence `rulesets[]`.

For GitHub Actions gates using the reusable workflow template:

- Input: `enable_ast_heuristics: true`

Current pilot implemented:

- `heuristics.ts.empty-catch.ast`
- `heuristics.ts.explicit-any.ast`
- `heuristics.ts.console-log.ast`
- `heuristics.ios.force-unwrap.ast`
- `heuristics.ios.anyview.ast`
- `heuristics.ios.force-try.ast`
- `heuristics.ios.callback-style.ast`
- `heuristics.android.thread-sleep.ast`
- `heuristics.android.globalscope.ast`
- `heuristics.android.run-blocking.ast`
- Scope: `apps/frontend/**`, `apps/web/**`, and `apps/backend/**` TypeScript files (`.ts`, `.tsx`)
- Scope exclusions: test paths (`__tests__`, `tests`, `*.spec.*`, `*.test.*`)
- Detection: semantic AST parse of `catch {}` with empty block
- Detection: semantic AST parse of explicit `any` type usage (TS/TSX)
- Detection: semantic AST parse of `console.log(...)` invocation nodes
- Scope: `apps/ios/**` Swift files (`.swift`)
- Scope exclusions: iOS test paths (`/Tests/`, `/tests/`, `*Test.swift`, `*Tests.swift`)
- Scope exclusions: bridge layers (`/Bridge/`, `/Bridges/`, `*Bridge.swift`)
- Detection: token-aware scan for force unwrap operator usage (`value!`) outside comments/strings
- Detection: token-aware scan for `AnyView` type erasure usage outside comments/strings
- Detection: token-aware scan for force try usage (`try!`) outside comments/strings
- Detection: token-aware scan for callback-style signatures (`@escaping` + completion/handler) outside bridge layers
- Scope: `apps/android/**` Kotlin files (`.kt`, `.kts`)
- Scope exclusions: Android test paths (`/test/`, `/androidTest/`, `*Test.kt`, `*Tests.kt`)
- Detection: token-aware scan for `Thread.sleep(...)` usage in production Kotlin code
- Detection: token-aware scan for `GlobalScope.launch/async/...` usage in production Kotlin code
- Detection: token-aware scan for `runBlocking(...)` usage in production Kotlin code
- Severity: `WARN`
