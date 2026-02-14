# Testing Guide (v2.x)

This guide documents the active deterministic test surface.

## Core commands

```bash
npm run typecheck
npm run test:evidence
npm run test:mcp
npm run test:heuristics
npm run test:deterministic
npm run validation:package-manifest
npm run validation:package-smoke
npm run validation:package-smoke:minimal
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

- `npm run validation:package-manifest`
  - Dry-run package manifest guardrail.
  - Fails if required runtime files are missing or forbidden paths are bundled (`legacy/`, tests, archive docs, local audit artifacts).

- `npm run validation:package-smoke`
  - Package-install smoke (`BLOCK` scenario): `npm pack` + temporary consumer install + intentional multi-platform violations.
  - Validates `pumuki-pre-commit` / `pumuki-pre-push` / `pumuki-ci` blocking path and evidence v2.1 metadata.
  - Writes artifacts to `.audit-reports/package-smoke/block/`.

- `npm run validation:package-smoke:minimal`
  - Package-install smoke (`PASS` scenario): `npm pack` + temporary consumer install + clean minimal staged/range path.
  - Validates allow path (exit `0`) with evidence v2.1 metadata.
  - Writes artifacts to `.audit-reports/package-smoke/minimal/`.

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
