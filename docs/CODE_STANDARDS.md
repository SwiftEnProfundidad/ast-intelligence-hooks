# Code Standards (v2.x)

## Architectural standards

- Keep domain logic in `core/*`.
- Keep adapters in `integrations/*`.
- Do not couple `core/*` to shell, filesystem, or network concerns.
- Do not duplicate stage logic across platform wrappers when shared runner exists.
- Keep IDE/editor diagnostics adapters in `scripts/*`; do not couple them into `core/*` or `integrations/*` gate logic.

## Deterministic standards

- Gate behavior must be stage-policy driven.
- Evidence output must remain deterministic (`version: "2.1"`, stable ordering).
- Findings and rule-pack loading must be reproducible for same inputs.

## Severity vocabulary

Use only:

- `CRITICAL`
- `ERROR`
- `WARN`
- `INFO`

Avoid introducing alternate severity taxonomies.

## TypeScript standards

- Prefer explicit types on public functions and exported values.
- Keep helpers pure where possible.
- Use immutable/read-only inputs in evaluators when feasible.
- Avoid `any` unless explicitly justified.

## File and naming conventions

- Use descriptive file names tied to behavior (`runPlatformGate`, `stagePolicies`, `buildEvidence`).
- Keep CLI wrappers thin (`*.cli.ts`) and delegate to shared runtime.

## Testing standards

Before merge:

```bash
npm run typecheck
npm run test:deterministic
```

When touching heuristics/policy:

```bash
npm run test:heuristics
```

## Documentation standards

- Update docs in the same change when behavior changes.
- Keep docs aligned with active v2.x runtime.
- Do not add temporary markdown planning artifacts.

## Commit standards

Use Conventional Commits and atomic changes:

- `feat:`
- `fix:`
- `docs:`
- `refactor:`
- `test:`
- `chore:`
