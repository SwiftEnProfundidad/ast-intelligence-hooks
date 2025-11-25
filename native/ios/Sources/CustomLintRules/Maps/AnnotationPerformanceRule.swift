// ═══════════════════════════════════════════════════════════════
// Maps - Annotation Performance Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct AnnotationPerformanceRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "maps_annotation_performance",
        name: "Maps - Annotation Performance",
        description: "Detect N+1 annotation additions and missing clustering for large datasets",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        func checkForLoops(_ dict: SourceKittenDict) {
            if dict.kind == "source.lang.swift.stmt.foreach" || dict.kind == "source.lang.swift.stmt.for" {
                let contents = file.contents
                if let offset = dict.offset, let length = dict.length {
                    let start = contents.index(contents.startIndex, offsetBy: offset)
                    let end = contents.index(start, offsetBy: min(length, contents.count - offset))
                    let loopText = String(contents[start..<end])
                    
                    if loopText.contains("addAnnotation") && !loopText.contains("addAnnotations") {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .error,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "Adding annotations in loop (N+1 pattern) - batch with mapView.addAnnotations([]) for performance"
                        ))
                    }
                }
            }
            
            for sub in dict.substructure {
                checkForLoops(sub)
            }
        }
        
        checkForLoops(structure.dictionary)
        
        // Check for clustering with large annotation counts
        let lines = file.contents.components(separatedBy: .newlines)
        for (index, line) in lines.enumerated() {
            if line.contains("addAnnotations") && !line.contains("MKClusterAnnotation") {
                let nextLines = lines[(index-5)...min(index+5, lines.count-1)].joined()
                if nextLines.contains("count") || nextLines.contains(".count") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Large annotation set without clustering - implement MKClusterAnnotation for >30 annotations"
                    ))
                }
            }
        }
        
        return violations
    }
}
