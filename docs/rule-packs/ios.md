# iOS Rule Pack

## Pack

- `iosEnterpriseRuleSet@1.0.0`
- `ios-guidelines@1.0.0` (skills lock)
- `ios-concurrency-guidelines@1.0.0` (skills lock)
- `ios-core-data-guidelines@1.0.0` (skills lock)
- `ios-swift-testing-guidelines@1.0.0` (skills lock)
- `ios-swiftui-expert-guidelines@1.0.0` (skills lock)
- Platform: `ios`

## Source

- `core/rules/presets/iosEnterpriseRuleSet.ts`
- `integrations/config/skillsCompilerTemplates.ts`
- `assets/rule-packs/ios-swiftui-modernization-v1.json`
- `assets/rule-packs/ios-swiftui-modernization-v2.json`
- `docs/codex-skills/ios-enterprise-rules.md`
- `docs/codex-skills/swift-concurrency.md`
- `docs/codex-skills/core-data-expert.md`
- `docs/codex-skills/swift-testing-expert.md`
- `docs/codex-skills/swiftui-expert-skill.md`
- `docs/validation/ios-avdlee-parity-matrix.md`

## Scope

- Swift code (`.swift`)
- Enforced through shared evaluator in `PRE_COMMIT`, `PRE_PUSH`, and `CI`

## Boundary

- `update-swiftui-apis` queda absorbida por snapshots versionados (`v1`/`v2`) y por el bundle `ios-swiftui-expert-guidelines`; no existe como bundle independiente.
- `xcode-build-*` y `spm-build-analysis` quedan como skills operativas de agente y no entran en `skills.lock.json`.

## Typical checks

- No GCD / `OperationQueue`
- No `AnyView`
- No force unwrap patterns
- No completion handlers outside allowed scopes
- No `Task.detached` without explicit concurrency rationale
- No `@unchecked Sendable` by default
- No `@preconcurrency`, `nonisolated(unsafe)` or `assumeIsolated` escape hatches by default in production Swift code
- No legacy `NavigationView` / `ObservableObject` in modern SwiftUI code paths
- No legacy `@StateObject` / `@ObservedObject` wrappers in SwiftUI paths that can adopt `@Observable`, and no parent-injected values stored as `@State` / `@StateObject`
- No `foregroundColor`, `cornerRadius`, `tabItem()`, `ScrollView(showsIndicators: false)`, `.sheet(isPresented:)` or legacy single-parameter `onChange` in modern SwiftUI paths covered by the versioned modernization snapshot
- No `wait(for:)` / `waitForExpectations(timeout:)` in async XCTest migration paths and no `expectation(description:)` scaffolding that still lacks modern `await fulfillment(of:)` or `confirmation`
- No XCTest-only `XCTestCase` suites that are directly modernizable to `import Testing` + `@Test`, and no mixed `XCTestCase`/`Testing` suites without explicit compatibility reason
- No `String(format:)` and no `UIScreen.main.bounds` in SwiftUI presentation/layout paths
- No `ForEach(...indices...)`, no user-facing `contains()` filters instead of `localizedStandardContains()`, and no avoidable `GeometryReader` / `fontWeight(.bold)` patterns in modern SwiftUI paths
- No Core Data or SwiftData APIs in iOS `Application` / `Presentation` paths, and no `NSManagedObject` escaping into SwiftUI state or ViewModels
