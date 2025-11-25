// ═══════════════════════════════════════════════════════════════
// Maps - Annotation Clustering Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct AnnotationClusteringRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "maps_annotation_clustering",
        name: "Maps - Annotation Clustering",
        description: "Maps with >30 annotations should use MKClusterAnnotation for performance",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("addAnnotations") && !line.contains("MKClusterAnnotation") && !line.contains("clusteringIdentifier") {
                let contextLines = lines[max(0, index-10)...min(index+10, lines.count-1)].joined()
                
                if contextLines.contains("stores") || contextLines.contains("locations") || contextLines.contains(".count") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Large annotation dataset without clustering - implement MKClusterAnnotation with clusteringIdentifier for >30 annotations (RuralGO has 100+ stores)"
                    ))
                }
            }
        }
        
        return violations
    }
}
