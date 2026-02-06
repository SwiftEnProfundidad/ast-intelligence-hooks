# Android Rule Pack

## Pack

- `androidRuleSet@1.0.0`
- Platform: `android`

## Source

- `core/rules/presets/androidRuleSet.ts`

## Scope

- `apps/android/**/*.{kt,kts}`
- Enforced through shared evaluator in `PRE_COMMIT`, `PRE_PUSH`, and `CI`

## Baseline rules

- Block `Thread.sleep(...)` (`CRITICAL`)
- Warn on `GlobalScope` usage (`WARN`)
- Warn on `runBlocking(...)` in production paths (`WARN`)
