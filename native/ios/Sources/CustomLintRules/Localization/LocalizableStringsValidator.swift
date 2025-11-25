// ═══════════════════════════════════════════════════════════════
// Localization - Localizable.strings Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct LocalizableStringsValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "localization_localizable_strings",
        name: "Localization - Localizable.strings Presence",
        description: "Hardcoded strings should use NSLocalizedString with Localizable.strings file",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("Text(\"") || line.contains("= \"") && !line.contains("NSLocalizedString") && !line.contains("String(localized:") {
                let hasUserFacingText = line.range(of: "[A-Z][a-z]+\\s+[a-z]+", options: .regularExpression) != nil
                
                if hasUserFacingText && !line.contains("test") && !line.contains("identifier") && !line.contains("key") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Hardcoded user-facing string - use NSLocalizedString(\"key\", comment: \"\") or String(localized: \"key\") for i18n"
                    ))
                }
            }
        }
        
        return violations
    }
}
