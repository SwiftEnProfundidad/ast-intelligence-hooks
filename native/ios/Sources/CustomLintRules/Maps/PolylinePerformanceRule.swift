// ═══════════════════════════════════════════════════════════════
// Maps - Polyline Performance Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct PolylinePerformanceRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "maps_polyline_performance",
        name: "Maps - Polyline Performance",
        description: "Large polylines (>1000 points) should be simplified using Douglas-Peucker algorithm",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("MKPolyline") || line.contains("addOverlay") {
                let contextLines = lines[max(0, index-5)...min(index+5, lines.count-1)].joined()
                
                if contextLines.contains("coordinates") && contextLines.contains(".count") {
                    let hasSimplification = contextLines.contains("simplify") || 
                                          contextLines.contains("douglasPeucker") ||
                                          contextLines.contains("reduce")
                    
                    if !hasSimplification {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .warning,
                            location: Location(file: file.path, line: index + 1),
                            reason: "Large polyline without simplification - use Douglas-Peucker algorithm to reduce coordinate count for rendering performance"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}
