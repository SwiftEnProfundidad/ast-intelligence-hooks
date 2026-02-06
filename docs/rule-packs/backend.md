# Backend Rule Pack

## Pack

- `rulesgold.mdc@1.0.0`
- `rulesbackend.mdc@1.0.0`
- Platform: `backend`

## Sources

- `legacy/tooling/.cursor/rules/rulesgold.mdc`
- `legacy/tooling/.cursor/rules/rulesbackend.mdc`
- Fallback: `.windsurf` equivalents when present

## Scope

- Backend TypeScript paths under `apps/backend/**/*.ts`
- Enforced through shared evaluator in `PRE_COMMIT`, `PRE_PUSH`, and `CI`

## Notes

- The evidence file records both bundles and hashes for deterministic auditing.
