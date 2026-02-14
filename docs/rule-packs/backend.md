# Backend Rule Pack

## Pack

- `rulesgold.mdc@1.0.0`
- `rulesbackend.mdc@1.0.0`
- `backendRuleSet@1.0.0`
- Platform: `backend`

## Sources

- `legacy/tooling/*/rules/rulesgold.mdc` (legacy source material)
- `legacy/tooling/*/rules/rulesbackend.mdc` (legacy source material)
- Legacy editor-export equivalents when present
- `core/rules/presets/backendRuleSet.ts`

## Scope

- Backend TypeScript paths under `apps/backend/**/*.ts`
- Enforced through shared evaluator in `PRE_COMMIT`, `PRE_PUSH`, and `CI`

## Notes

- The evidence file records both bundles and hashes for deterministic auditing.
