// ═══════════════════════════════════════════════════════════════
// Accessibility - Color Contrast Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ColorContrastValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "accessibility_color_contrast",
        name: "Accessibility - Color Contrast WCAG",
        description: "Text colors should have sufficient contrast ratio (WCAG AA: 4.5:1)",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains(".foregroundColor(.gray)") || line.contains(".foregroundStyle(.gray)") || line.contains("Color.gray") {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: index + 1),
                    reason: "Low contrast color (.gray) - ensure WCAG AA contrast ratio 4.5:1 for text, use Color.secondary or check contrast"
                ))
            }
        }
        
        return violations
    }
}
