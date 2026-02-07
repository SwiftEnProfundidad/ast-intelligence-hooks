# Architecture Contract (Short)

## Current model

- Domain core: `core/*`
- Runtime adapters: `integrations/*`
- Legacy tree: `legacy/*` (historical, non-authoritative for v2.x runtime)

## Dependency rule

- `core/*` must not depend on `integrations/*` or `legacy/*`.
- `integrations/*` may depend on `core/*`.
- `legacy/*` may reference core for compatibility, but does not define v2.x behavior.

## Decision path

All stage decisions must flow through:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

Reference:

- `docs/ARCHITECTURE.md`
- `docs/ARCHITECTURE_DETAILED.md`
