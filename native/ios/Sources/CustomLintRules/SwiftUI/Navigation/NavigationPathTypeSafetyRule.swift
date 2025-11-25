// ═══════════════════════════════════════════════════════════════
// SwiftUI Navigation - NavigationPath Type Safety Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct NavigationPathTypeSafetyRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_navigation_path_type_safety",
        name: "SwiftUI - NavigationPath Type Safety",
        description: "NavigationPath must use type-safe route values to prevent runtime navigation errors",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            enum Route: Hashable {
                case detail(id: UUID)
            }
            path.append(Route.detail(id: id))
            """)
        ],
        triggeringExamples: [
            Example("""
            path.append(anyValue)  // ↓ Not type-safe
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("NavigationPath") && line.contains("append") {
                let nextLines = lines[(index+1)...min(index+3, lines.count-1)].joined()
                let hasTypeSafe = nextLines.contains("enum Route") || 
                                 line.contains("Route.") ||
                                 line.contains("as ")
                
                if !hasTypeSafe && !line.contains("test") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "NavigationPath.append without type-safe route - define enum Route: Hashable and use typed values: path.append(Route.detail(id: id))"
                    ))
                }
            }
        }
        
        return violations
    }
}
