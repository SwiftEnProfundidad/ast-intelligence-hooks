// ═══════════════════════════════════════════════════════════════
// Push Notifications - Silent Notification Battery Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct SilentNotificationBatteryRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "push_silent_battery",
        name: "Push - Silent Notification Battery Impact",
        description: "Silent notifications (content-available) drain battery, use sparingly",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("\"content-available\"") || line.contains("contentAvailable") {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: index + 1),
                    reason: "Silent notification (content-available) - high battery impact, use only for critical background updates"
                ))
            }
        }
        
        return violations
    }
}
