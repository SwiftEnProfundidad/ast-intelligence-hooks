# iOS Rule Pack

## Pack

- `iosEnterpriseRuleSet@1.0.0`
- `ios-guidelines@1.0.0` (skills lock)
- `ios-concurrency-guidelines@1.0.0` (skills lock)
- `ios-swiftui-expert-guidelines@1.0.0` (skills lock)
- Platform: `ios`

## Source

- `core/rules/presets/iosEnterpriseRuleSet.ts`
- `integrations/config/skillsCompilerTemplates.ts`
- `docs/codex-skills/windsurf-rules-ios.md`
- `docs/codex-skills/swift-concurrency.md`
- `docs/codex-skills/swiftui-expert-skill.md`

## Scope

- Swift code (`.swift`)
- Enforced through shared evaluator in `PRE_COMMIT`, `PRE_PUSH`, and `CI`

## Typical checks

- No GCD / `OperationQueue`
- No `AnyView`
- No force unwrap patterns
- No completion handlers outside allowed scopes
- No `Task.detached` without explicit concurrency rationale
- No `@unchecked Sendable` by default
- No legacy `NavigationView` / `ObservableObject` in modern SwiftUI code paths
- No `String(format:)` and no `UIScreen.main.bounds` in SwiftUI presentation/layout paths
