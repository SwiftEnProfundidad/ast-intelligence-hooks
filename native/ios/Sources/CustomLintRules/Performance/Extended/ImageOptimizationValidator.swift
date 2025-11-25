// ═══════════════════════════════════════════════════════════════
// Performance - Image Optimization Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ImageOptimizationValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "performance_image_optimization",
        name: "Performance - Image Optimization",
        description: "Images should be resized and compressed before display for memory efficiency",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("UIImage(named:") || line.contains("Image(") && !line.contains("Image(systemName:") {
                let nextLines = lines[(index+1)...min(index+3, lines.count-1)].joined()
                let hasOptimization = nextLines.contains("resizableImage") || nextLines.contains("preparingThumbnail") || nextLines.contains("byPreparingForDisplay")
                
                if !hasOptimization && !line.contains("icon") && !line.contains("symbol") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Image loaded without optimization - use .byPreparingForDisplay() or resize for memory efficiency"
                    ))
                }
            }
        }
        
        return violations
    }
}
