# Type safety (hook-system)

The hook-system is 100% JavaScript (no TS build), so strict TypeScript “no-any” migration does not apply here. Type safety is enforced through:
- Unit/critical tests (guards, event bus, scheduler) and implicit contracts in services.
- Input validation in events (DomainEvent and derivatives) and defensive checks in services.
- No TS transpilation/bundle in this repo; CORS/AST analyses run on audited projects that may use TS.

For audited projects (outside this repo), use strict TS and avoid `any`; here we only document non-applicability.
