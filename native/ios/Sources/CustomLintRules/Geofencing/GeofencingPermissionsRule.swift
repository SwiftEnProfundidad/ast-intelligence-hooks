// ═══════════════════════════════════════════════════════════════
// Geofencing - Permissions Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct GeofencingPermissionsRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "geofencing_permissions",
        name: "Geofencing - Always Location Permission",
        description: "Geofencing requires Always location authorization",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("startMonitoring(for:") {
                let contextLines = lines[max(0, index-10)...index].joined()
                if !contextLines.contains("requestAlwaysAuthorization") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Geofencing without Always permission - call locationManager.requestAlwaysAuthorization() before startMonitoring"
                    ))
                }
            }
        }
        
        return violations
    }
}
