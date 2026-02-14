# iOS Rule Pack

## Pack

- `iosEnterpriseRuleSet@1.0.0`
- Platform: `ios`

## Source

- `core/rules/presets/iosEnterpriseRuleSet.ts`

## Scope

- Swift code (`.swift`)
- Enforced through shared evaluator in `PRE_COMMIT`, `PRE_PUSH`, and `CI`

## Typical checks

- No GCD / `OperationQueue`
- No `AnyView`
- No force unwrap patterns
- No completion handlers outside allowed scopes
