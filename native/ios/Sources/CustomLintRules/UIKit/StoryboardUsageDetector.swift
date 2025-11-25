// ═══════════════════════════════════════════════════════════════
// UIKit - Storyboard Usage Detector
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct StoryboardUsageDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "uikit_storyboard_usage",
        name: "UIKit - Storyboard Usage",
        description: "Prefer programmatic UI over Storyboards for better version control",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        if contents.contains("UIStoryboard(name:") || contents.contains("instantiateViewController") {
            violations.append(StyleViolation(
                ruleDescription: Self.description,
                severity: .warning,
                location: Location(file: file.path, line: 1),
                reason: "Storyboard usage detected - prefer programmatic UI for better git diffs and team collaboration"
            ))
        }
        
        return violations
    }
}

