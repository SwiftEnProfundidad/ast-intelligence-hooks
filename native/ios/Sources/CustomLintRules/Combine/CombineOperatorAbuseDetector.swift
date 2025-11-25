// ═══════════════════════════════════════════════════════════════
// Combine - Operator Abuse Detector
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct CombineOperatorAbuseDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "combine_operator_abuse",
        name: "Combine - Operator Chain Abuse",
        description: "Excessive Combine operator chaining hurts readability and debugging",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            let operatorCount = line.components(separatedBy: ".").count - 1
            
            if operatorCount > 5 && (line.contains("Publisher") || line.contains("$")) {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: index + 1),
                    reason: "Excessive Combine operator chaining (\(operatorCount) operators) - break into multiple let bindings for readability"
                ))
            }
        }
        
        return violations
    }
}
