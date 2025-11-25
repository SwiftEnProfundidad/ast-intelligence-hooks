// ═══════════════════════════════════════════════════════════════
// Maps - Location Accuracy Validation Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct LocationAccuracyValidationRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "maps_location_accuracy",
        name: "Maps - Location Accuracy Validation",
        description: "Location accuracy should match use case to balance precision and battery life",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("desiredAccuracy") && line.contains("kCLLocationAccuracyBest") {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: index + 1),
                    reason: "Best accuracy setting - high battery drain, use .hundredMeters for RuralGO logistics tracking (sufficient precision)"
                ))
            }
        }
        
        return violations
    }
}
