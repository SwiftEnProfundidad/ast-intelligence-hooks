// ═══════════════════════════════════════════════════════════════
// Accessibility - Reduce Motion Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ReduceMotionValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "accessibility_reduce_motion",
        name: "Accessibility - Reduce Motion Support",
        description: "Animations should respect UIAccessibility.isReduceMotionEnabled preference",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        if contents.contains("withAnimation") || contents.contains("UIView.animate") {
            if !contents.contains("isReduceMotionEnabled") && !contents.contains("AccessibilityReduceMotion") {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: 1),
                    reason: "Animations without Reduce Motion check - respect user preference: if !UIAccessibility.isReduceMotionEnabled { withAnimation { } }"
                ))
            }
        }
        
        return violations
    }
}
