# Phase 5 - Refactor Hardening and Type Safety

## Objective

Reduce integration duplication, wire AST heuristic pilot flag safely, and stabilize production typecheck baseline.

## Commits

- `e0fce26` refactor(git): centralize upstream and CI base ref resolution
- `9ab86b6` refactor(git): deduplicate stage runners across platforms
- `5b5aae3` refactor(git): centralize CLI exit handling for stage runners
- `8cdafcc` feat(backend-rules): add typed backend baseline ruleset
- `49d2b18` refactor(ci): use reusable workflow for platform gates
- `d8f1220` chore(heuristics): add feature flag wiring for semantic pilot
- `3ef5f42` chore(ci): support AST heuristics flag in reusable gate workflow
- `18b151a` feat(heuristics): add AST empty-catch pilot behind feature flag
- `7207567` feat(heuristics): add explicit-any AST pilot check
- `a4ae585` fix(heuristics): scope AST pilot to frontend and skip test files
- `0985570` test(heuristics): add cross-platform AST pilot coverage
- `8620ed7` ci(heuristics): add dedicated AST pilot test workflow
- `903c4d0` feat(evidence): add human intent state with deterministic expiry enforcement
- `3fa5d04` refactor(evidence): centralize human intent normalization and expiry logic
- `67b5417` docs(evidence): unify references to .ai_evidence.json
- `573c65f` feat(ast): introduce typed heuristic facts in extraction flow
- `254849c` refactor(heuristics): evaluate typed heuristic facts through rule packs
- `7395c42` refactor(evidence): add canonical generateEvidence writer path
- `04f9a01` docs(heuristics): document declarative AST rule pack and evidence bundle
- `54c55a2` docs(architecture): add conceptual entrypoint and manual hook-system usage
- `82cb873` ci(tests): unify deterministic suite for evidence mcp and heuristics
- `2d25f94` fix(types): align dependency fact source and gate readonly handling
- `71dadb6` chore(tsconfig): exclude nested test files from production typecheck

## Scope

- Shared stage runner helpers:
  - `integrations/git/stageRunners.ts`
  - `integrations/git/resolveGitRefs.ts`
  - `integrations/git/runCliCommand.ts`
- Backend typed baseline:
  - `core/rules/presets/backendRuleSet.ts`
- Reusable gate workflow:
  - `.github/workflows/pumuki-gate-template.yml`
- Heuristics test workflow:
  - `.github/workflows/pumuki-heuristics-tests.yml`
  - `package.json` script: `test:heuristics`
- Evidence test workflow:
  - `.github/workflows/pumuki-evidence-tests.yml`
  - `package.json` scripts: `test:evidence`, `test:mcp`, `test:deterministic`
- Heuristics pilot flag:
  - `integrations/config/heuristics.ts`
  - `PUMUKI_ENABLE_AST_HEURISTICS`
  - Evidence bundle version: `astHeuristicsRuleSet@0.2.0`
- Pilot heuristic implementation:
  - `core/facts/HeuristicFact.ts`
  - `core/rules/Condition.ts` (`kind: Heuristic`)
  - `core/gate/conditionMatches.ts` (heuristic matcher)
  - `core/rules/presets/astHeuristicsRuleSet.ts`
  - `integrations/gate/evaluateHeuristicFindings.ts`
  - `integrations/git/runPlatformGate.ts` (single evaluator path for baseline + heuristic rules)
  - `heuristics.ts.empty-catch.ast` (TS/JS empty `catch {}` via AST parser)
  - `heuristics.ts.explicit-any.ast` (TS/TSX explicit `any` via AST parser)
  - `heuristics.ts.console-log.ast` (semantic detection of `console.log(...)` calls)
  - `heuristics.ios.force-unwrap.ast` (token-aware Swift force unwrap detection)
  - `heuristics.ios.anyview.ast` (token-aware Swift `AnyView` usage detection)
  - `heuristics.ios.callback-style.ast` (token-aware `@escaping` callback signature detection outside bridge layers)
  - `heuristics.android.thread-sleep.ast` (token-aware Kotlin `Thread.sleep(...)` detection in production paths)
  - `heuristics.android.globalscope.ast` (token-aware Kotlin `GlobalScope.launch/async/...` detection in production paths)
  - `heuristics.android.run-blocking.ast` (token-aware Kotlin `runBlocking(...)` detection in production paths)
  - Scope hardening: frontend/web, iOS, and Android production paths, excluding test paths
- Type safety hardening:
  - `core/facts/DependencyFact.ts` now includes `source`
  - `integrations/git/evaluateStagedIOS.ts` handles readonly findings safely
  - `tsconfig.json` excludes nested test files from production compile target
- Canonical evidence writer path:
  - `integrations/evidence/generateEvidence.ts` as single build+write facade
  - `integrations/evidence/buildEvidence.ts` deterministic snapshot + ledger merge
  - `integrations/evidence/writeEvidence.ts` stable serialization and relative paths

## Validation status

- `npx tsc --noEmit` now passes for production sources included in tsconfig.
- `npm run test:heuristics` passes (7/7) for cross-platform AST pilot cases.
- `npm run test:evidence` passes for evidence/human-intent deterministic behavior.
- `npm run test:deterministic` passes (evidence + MCP + heuristics).
- Stage gates and CI workflows keep existing behavior by default.
