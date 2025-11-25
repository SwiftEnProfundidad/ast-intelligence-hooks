// ═══════════════════════════════════════════════════════════════
// Accessibility - VoiceOver Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct VoiceOverValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "accessibility_voiceover",
        name: "Accessibility - VoiceOver Support",
        description: "Interactive elements must have accessibility labels for VoiceOver",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("UIButton(") || line.contains("Button {") || line.contains("UIImageView(") {
                let nextLines = lines[(index+1)...min(index+5, lines.count-1)].joined()
                let hasA11y = nextLines.contains("accessibilityLabel") || nextLines.contains(".accessibility(label:")
                
                if !hasA11y && !line.contains("test") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Interactive element without accessibility label - add .accessibilityLabel(\"description\") for VoiceOver support"
                    ))
                }
            }
        }
        
        return violations
    }
}
