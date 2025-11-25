// ═══════════════════════════════════════════════════════════════
// SwiftUI Navigation - Toolbar Modern API
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ToolbarModernAPIRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_toolbar_modern_api",
        name: "SwiftUI - Modern Toolbar API",
        description: "Use .toolbar modifier instead of deprecated navigationBarItems (iOS 14+)",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("navigationBarItems") {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: index + 1),
                    reason: "navigationBarItems is deprecated - use .toolbar { ToolbarItem(...) } for modern API"
                ))
            }
        }
        
        return violations
    }
}
