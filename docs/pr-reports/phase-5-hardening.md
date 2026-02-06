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
- Heuristics pilot flag:
  - `integrations/config/heuristics.ts`
  - `PUMUKI_ENABLE_AST_HEURISTICS`
- Pilot heuristic implementation:
  - `integrations/gate/evaluateHeuristicFindings.ts`
  - `heuristics.ts.empty-catch.ast` (TS/JS empty `catch {}` via AST parser)
  - `heuristics.ts.explicit-any.ast` (TS/TSX explicit `any` via AST parser)
  - Scope hardening: frontend/web files only, excluding test paths
- Type safety hardening:
  - `core/facts/DependencyFact.ts` now includes `source`
  - `integrations/git/evaluateStagedIOS.ts` handles readonly findings safely
  - `tsconfig.json` excludes nested test files from production compile target

## Validation status

- `npx tsc --noEmit` now passes for production sources included in tsconfig.
- Stage gates and CI workflows keep existing behavior by default.
