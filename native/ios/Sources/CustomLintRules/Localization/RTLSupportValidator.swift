// ═══════════════════════════════════════════════════════════════
// Localization - RTL Support Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct RTLSupportValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "localization_rtl_support",
        name: "Localization - RTL Support",
        description: "Layout constraints should use leading/trailing instead of left/right for RTL support",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains(".leftAnchor") || line.contains(".rightAnchor") || line.contains("NSLayoutConstraint") && (line.contains(".left") || line.contains(".right")) {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: index + 1),
                    reason: "Layout using left/right anchor - use .leadingAnchor/.trailingAnchor for RTL language support (Arabic, Hebrew)"
                ))
            }
        }
        
        return violations
    }
}
