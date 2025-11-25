// ═══════════════════════════════════════════════════════════════
// Localization - NumberFormatter Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct NumberFormatterValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "localization_numberformatter",
        name: "Localization - NumberFormatter Usage",
        description: "Number/currency formatting should use NumberFormatter for locale support",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if (line.contains("String(format:") && line.contains("%.2f")) || (line.contains("\"$\\(") && line.contains("price")) {
                if !line.contains("NumberFormatter") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Number/currency formatting without NumberFormatter - use NumberFormatter.localizedString(from: NSNumber(value: price), number: .currency) for locale support"
                    ))
                }
            }
        }
        
        return violations
    }
}
