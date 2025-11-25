// ═══════════════════════════════════════════════════════════════
// Localization - Plurals Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct PluralsValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "localization_plurals",
        name: "Localization - Stringsdict Plurals",
        description: "Plural strings should use .stringsdict for proper localization",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("NSLocalizedString") && (line.contains("item") || line.contains("count")) {
                let nextLine = index + 1 < lines.count ? lines[index + 1] : ""
                if nextLine.contains("== 1") || line.contains("\\(count)") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Plural string with count - use .stringsdict for proper plural rules: String(localized: \"items.count\", defaultValue: \"%lld items\")"
                    ))
                }
            }
        }
        
        return violations
    }
}
