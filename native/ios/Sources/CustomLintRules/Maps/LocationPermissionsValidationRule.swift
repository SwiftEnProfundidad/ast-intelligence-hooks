// ═══════════════════════════════════════════════════════════════
// Maps - Location Permissions Validation
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct LocationPermissionsValidationRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "maps_location_permissions",
        name: "Maps - Location Permissions Validation",
        description: "Location usage must have proper permissions and Info.plist entries",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        if contents.contains("startUpdatingLocation") || contents.contains("requestLocation") {
            let hasPermissionRequest = contents.contains("requestWhenInUseAuthorization") || 
                                      contents.contains("requestAlwaysAuthorization")
            
            if !hasPermissionRequest {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .error,
                    location: Location(file: file.path, line: 1),
                    reason: "Location usage without permission request - call locationManager.requestWhenInUseAuthorization() first and add Info.plist NSLocationWhenInUseUsageDescription"
                ))
            }
        }
        
        return violations
    }
}
