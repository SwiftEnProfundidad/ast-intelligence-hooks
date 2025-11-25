// ═══════════════════════════════════════════════════════════════
// Maps - Background Location Battery Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct BackgroundLocationBatteryRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "maps_background_location_battery",
        name: "Maps - Background Location Battery Impact",
        description: "Background location tracking must use appropriate accuracy and distance filter to minimize battery drain",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("startUpdatingLocation") || line.contains("allowsBackgroundLocationUpdates = true") {
                let contextStart = max(0, index - 5)
                let contextEnd = min(lines.count - 1, index + 5)
                let context = lines[contextStart...contextEnd].joined()
                
                let hasAccuracy = context.contains("desiredAccuracy") && (context.contains("kCLLocationAccuracyHundredMeters") || context.contains("kCLLocationAccuracyKilometer"))
                let hasDistanceFilter = context.contains("distanceFilter") && !context.contains("distanceFilter = 0")
                
                if !hasAccuracy || !hasDistanceFilter {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Background location without battery optimization - set desiredAccuracy = .hundredMeters and distanceFilter = 50.0 minimum for rural tracking"
                    ))
                }
            }
        }
        
        return violations
    }
}
