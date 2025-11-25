// ═══════════════════════════════════════════════════════════════
// SwiftUI Navigation - NavigationStack Enforcer
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct NavigationStackEnforcer: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_navigation_stack_enforcer",
        name: "SwiftUI - NavigationStack over NavigationView",
        description: "Use NavigationStack instead of deprecated NavigationView (iOS 16+)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("NavigationStack { ContentView() }")
        ],
        triggeringExamples: [
            Example("NavigationView { ContentView() }")
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("NavigationView") && !line.contains("//") {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: index + 1),
                    reason: "NavigationView is deprecated in iOS 16+ - use NavigationStack for modern type-safe navigation with NavigationPath"
                ))
            }
        }
        
        return violations
    }
}
