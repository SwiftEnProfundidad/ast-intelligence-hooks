// ═══════════════════════════════════════════════════════════════
// SwiftUI Navigation - NavigationDestination Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct NavigationDestinationRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_navigation_destination",
        name: "SwiftUI - NavigationDestination Type Safety",
        description: "navigationDestination must use type-safe route values for compile-time safety",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            .navigationDestination(for: Route.self) { route in
                switch route {
                case .detail(let id): DetailView(id: id)
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            .navigationDestination(for: Any.self) { value in  // ↓ Not type-safe
                AnyView(...)
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("navigationDestination") && line.contains("Any.self") {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: index + 1),
                    reason: "navigationDestination with Any.self - use type-safe enum: .navigationDestination(for: Route.self) for compile-time navigation safety"
                ))
            }
        }
        
        return violations
    }
}
