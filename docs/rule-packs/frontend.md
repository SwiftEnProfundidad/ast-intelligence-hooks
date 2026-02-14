# Frontend Rule Pack

## Pack

- `frontendRuleSet@1.0.0`
- Platform: `frontend`

## Source

- `core/rules/presets/frontendRuleSet.ts`

## Scope

- `apps/frontend/**/*.{ts,tsx,js,jsx}`
- `apps/web/**/*.{ts,tsx,js,jsx}`
- Enforced through shared evaluator in `PRE_COMMIT`, `PRE_PUSH`, and `CI`

## Baseline rules

- Block `console.log` in frontend code (`CRITICAL`)
- Warn on `debugger` usage (`WARN`)
- Warn on single-letter variable declarations (`WARN`)
