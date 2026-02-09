# Testing Guide (v2.x)

This guide documents the active deterministic test surface.

## Core commands

```bash
npm run typecheck
npm run test:evidence
npm run test:mcp
npm run test:heuristics
npm run test:deterministic
npm run validation:package-smoke
```

## What each suite validates

- `npm run typecheck`
  - TypeScript compile checks for production sources (`core/**/*.ts`, `integrations/**/*.ts`).

- `npm run test:evidence`
  - Deterministic evidence behavior (`snapshot`, `ledger`, `human_intent`).

- `npm run test:mcp`
  - Read-only evidence context server behavior.

- `npm run test:heuristics`
  - Typed AST heuristic fact extraction coverage across platforms.

- `npm run test:deterministic`
  - Aggregated deterministic suite (`evidence + mcp + heuristics`).

- `npm run validation:package-smoke`
  - Package-install smoke run (`npm pack` + temporary consumer install + `pumuki-pre-commit` / `pumuki-pre-push` / `pumuki-ci`).
  - Writes artifacts to `.audit-reports/package-smoke/`.

## Test locations

- `integrations/evidence/__tests__/buildEvidence.test.ts`
- `integrations/evidence/__tests__/humanIntent.test.ts`
- `integrations/mcp/__tests__/evidenceContextServer.test.ts`
- `core/facts/__tests__/extractHeuristicFacts.test.ts`
- `integrations/gate/__tests__/stagePolicies.test.ts`

## Recommended validation before commit

```bash
npm run typecheck
npm run test:deterministic
```

## CI alignment

Workflows rely on the same deterministic model and should remain consistent with local commands:

- `.github/workflows/pumuki-evidence-tests.yml`
- `.github/workflows/pumuki-heuristics-tests.yml`
- `.github/workflows/pumuki-gate-template.yml`
- `.github/workflows/pumuki-package-smoke.yml`

## Adding tests

### Principles

- Keep tests deterministic and side-effect free.
- Prefer `node:test` for TypeScript files executed with `tsx`.
- Keep domain tests in `core/*` and adapter tests in `integrations/*`.
- Validate behavior, not implementation details.

### Minimal `node:test` example

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

test('example', () => {
  assert.equal(1 + 1, 2);
});
```

## Legacy note

A legacy `npm test` (Jest) command exists in `package.json`, but the v2.x deterministic baseline is governed by the explicit `test:*` scripts listed above.
