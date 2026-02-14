# Dependencies (v2.x)

This document tracks active dependencies used by the current deterministic framework surface.

## Runtime dependencies

- `glob` (`^10.5.0`)
  - File matching utilities for adapter/runtime workflows.
- `ts-morph` (`>=21.0.0`)
  - TypeScript AST support used by analysis components.

## Peer dependencies

- `ts-morph` (`>=21.0.0`)

## Development dependencies

- `typescript` (`^5.3.0`)
- `@types/node` (`^20.10.0`)
- `eslint` (`^9.12.0`)
- `jest` (`^30.2.0`)
- `@babel/parser` (`^7.28.5`)
- `@babel/traverse` (`^7.28.5`)
- `@babel/generator` (`^7.28.5`)
- `jscodeshift` (`^17.3.0`)
- `recast` (`^0.23.11`)

## Engine requirements

- Node.js: `>=18.0.0`
- npm: `>=9.0.0`

## Dependency policy

- Add dependencies only when required by active `core/*` or `integrations/*` behavior.
- Prefer existing primitives before introducing new packages.
- Document dependency purpose in PR description.
- Avoid adding dependencies only for one-off migration/cleanup tasks.

## Security and maintenance

Recommended checks:

```bash
npm ci
npm run typecheck
npm run test:deterministic
npm audit
```

## Notes

Some package scripts and exports still include legacy compatibility entrypoints.
Dependency decisions for new work should prioritize the active v2.x deterministic surface.
