// ═══════════════════════════════════════════════════════════════
// Geofencing - Battery Impact Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct GeofenceBatteryRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "geofencing_battery",
        name: "Geofencing - Battery Optimization",
        description: "Geofence radius <100m causes high battery drain",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("CLCircularRegion") && line.contains("radius:") {
                if let radiusMatch = line.range(of: "radius:\\s*(\\d+)", options: .regularExpression) {
                    let radiusStr = String(line[radiusMatch]).replacingOccurrences(of: "radius:", with: "").trimmingCharacters(in: .whitespaces)
                    if let radius = Int(radiusStr), radius < 100 {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .warning,
                            location: Location(file: file.path, line: index + 1),
                            reason: "Geofence radius \(radius)m is <100m - high battery drain, use minimum 100m for efficiency (sufficient for store arrival)"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}
