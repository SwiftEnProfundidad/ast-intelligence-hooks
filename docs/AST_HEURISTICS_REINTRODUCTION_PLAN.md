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

When enabled, the gate records `ast-semantic-pilot@0.1.0` in evidence `rulesets[]`.

For GitHub Actions gates using the reusable workflow template:

- Input: `enable_ast_heuristics: true`

Current pilot implemented:

- `heuristics.ts.empty-catch.ast`
- Scope: `apps/backend/**` and `apps/frontend/**` TS/JS files
- Detection: semantic AST parse of `catch {}` with empty block
- Severity: `WARN`
