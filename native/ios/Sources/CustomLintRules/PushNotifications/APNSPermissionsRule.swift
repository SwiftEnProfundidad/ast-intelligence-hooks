// ═══════════════════════════════════════════════════════════════
// Push Notifications - APNS Permissions Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct APNSPermissionsRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "push_apns_permissions",
        name: "Push - APNS Permissions",
        description: "Push notifications require UNUserNotificationCenter authorization before registration",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("registerForRemoteNotifications") {
                let previousLines = lines[max(0, index-10)...index].joined()
                if !previousLines.contains("requestAuthorization") && !previousLines.contains("UNUserNotificationCenter") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file.path, line: index + 1),
                        reason: "APNS registration without permission request - call UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) first"
                    ))
                }
            }
        }
        
        return violations
    }
}
