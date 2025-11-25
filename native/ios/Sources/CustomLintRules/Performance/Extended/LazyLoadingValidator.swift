// ═══════════════════════════════════════════════════════════════
// Performance - Lazy Loading Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct LazyLoadingValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "performance_lazy_loading",
        name: "Performance - Lazy Loading",
        description: "Large lists should use LazyVStack/LazyHStack for on-demand rendering",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if (line.contains("ForEach(") || line.contains("List(")) && (line.contains("VStack {") || line.contains("HStack {")) {
                if !line.contains("Lazy") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "VStack/HStack with ForEach - use LazyVStack/LazyHStack for better performance with large datasets"
                    ))
                }
            }
        }
        
        return violations
    }
}
