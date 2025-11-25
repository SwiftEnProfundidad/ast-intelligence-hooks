// ═══════════════════════════════════════════════════════════════
// SwiftData - Predicate Type Safety Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct PredicateTypeSafetyRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftdata_predicate_safety",
        name: "SwiftData - Predicate Type Safety",
        description: "Use #Predicate macro for type-safe predicates, avoid NSPredicate strings",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("NSPredicate(format:") && line.contains("FetchDescriptor") {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: index + 1),
                    reason: "NSPredicate with string format - use #Predicate { } macro for type-safe predicates and compile-time validation"
                ))
            }
        }
        
        return violations
    }
}
