// ═══════════════════════════════════════════════════════════════
// Maps - Map Camera Update Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct MapCameraUpdateRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "maps_camera_update",
        name: "Maps - Camera Update Debouncing",
        description: "Map camera updates should be debounced to avoid performance issues",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("setCamera") || line.contains("setRegion") || line.contains("mapCameraPosition") {
                let contextLines = lines[max(0, index-3)...min(index+3, lines.count-1)].joined()
                let hasDebounce = contextLines.contains("debounce") || 
                                 contextLines.contains("throttle") ||
                                 contextLines.contains("Task.sleep") ||
                                 contextLines.contains("Timer")
                
                if !hasDebounce && contextLines.contains("onChange") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Camera update without debounce - debounce camera changes to avoid jerky animations and excessive updates"
                    ))
                }
            }
        }
        
        return violations
    }
}
