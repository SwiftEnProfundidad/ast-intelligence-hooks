// ═══════════════════════════════════════════════════════════════
// Localization - DateFormatter Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct DateFormatterValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "localization_dateformatter",
        name: "Localization - DateFormatter Usage",
        description: "Date formatting should use DateFormatter for locale support, not hardcoded formats",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("dateFormat =") && line.contains("\"") && !line.contains("DateFormatter") {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: index + 1),
                    reason: "Hardcoded date format string - use DateFormatter with dateStyle/timeStyle for locale-aware formatting"
                ))
            }
        }
        
        return violations
    }
}
