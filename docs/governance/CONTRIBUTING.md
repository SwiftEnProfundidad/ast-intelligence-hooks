# Contributing (v2.x)

Thanks for contributing to `ast-intelligence-hooks`.

## Scope

This repository is currently centered on deterministic framework behavior:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

Contributions should preserve that model.

## Prerequisites

- Node.js `>=18`
- npm `>=9`
- Git

## Setup

```bash
git clone https://github.com/SwiftEnProfundidad/ast-intelligence-hooks.git
cd ast-intelligence-hooks
npm ci
```

## Working rules

- Keep domain decisions in `core/*`.
- Keep shell/file/network adapters in `integrations/*`.
- Do not introduce architectural shortcuts that bypass stage runners.
- Prefer incremental, atomic commits.

## Branching

Use short, semantic branches:

- `feat/<topic>`
- `fix/<topic>`
- `docs/<topic>`
- `refactor/<topic>`
- `test/<topic>`

## Commit convention

Use Conventional Commits:

- `feat:`
- `fix:`
- `docs:`
- `refactor:`
- `test:`
- `chore:`

Examples:

```bash
docs(v2): rewrite architecture mcp and testing guides
feat(heuristics): add stage-based severity maturity across gates
```

## Validation before PR

```bash
npm run typecheck
npm run test:deterministic
```

When touching heuristics or policy behavior, also run:

```bash
npm run test:heuristics
```

## Pull request checklist

- Code follows architecture boundaries.
- Deterministic tests pass locally.
- Docs updated when behavior changes.
- No temporary/residual files.
- Commit history is atomic and readable.

## Documentation hygiene policy

- Keep docs aligned to active v2.x runtime.
- Remove or rewrite stale legacy references instead of extending them.
- Do not add temporary markdown artifacts for planning.

## Notes for automation contributors

This repository still contains legacy hooks/scripts for compatibility.
For framework refactor commits, maintainers may use `--no-verify` to avoid unrelated legacy hook failures.
