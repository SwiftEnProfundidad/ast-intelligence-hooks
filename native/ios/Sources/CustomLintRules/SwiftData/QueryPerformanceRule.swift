// ═══════════════════════════════════════════════════════════════
// SwiftData - Query Performance Rule
// ═══════════════════════════════════════════════════════════════
// Detects N+1 query patterns and missing predicates

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct QueryPerformanceRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftdata_query_performance",
        name: "SwiftData - Query Performance",
        description: "Detect N+1 queries (fetch in loop) and queries without predicates before iteration",
        kind: .performance,
        nonTriggeringExamples: [
            Example("""
            let descriptor = FetchDescriptor<Store>(predicate: #Predicate { $0.isActive })
            let stores = try context.fetch(descriptor)
            for store in stores { }
            """)
        ],
        triggeringExamples: [
            Example("""
            for id in ids {
                let store = try context.fetch(FetchDescriptor<Store>())  // ↓ N+1 query
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        let contents = file.contents
        
        // Detect fetch inside loops (N+1)
        func checkForLoops(_ dict: [String: SourceKitRepresentable]) {
            if dict.kind == "source.lang.swift.stmt.foreach" || 
               dict.kind == "source.lang.swift.stmt.for" {
                
                let loopSubstructure = dict.substructure
                for sub in loopSubstructure {
                    if let name = sub.name, name.contains("fetch") || name.contains("FetchDescriptor") {
                        if let offset = sub.offset {
                            violations.append(StyleViolation(
                                ruleDescription: Self.description,
                                severity: .error,
                                location: Location(file: file, byteOffset: ByteCount(offset)),
                                reason: "Fetch inside loop detected - N+1 query pattern. Fetch all entities before loop with predicate: FetchDescriptor(predicate: #Predicate { ids.contains($0.id) })"
                            ))
                        }
                    }
                    checkForLoops(sub)
                }
            }
            
            for sub in dict.substructure {
                checkForLoops(sub)
            }
        }
        
        checkForLoops(structure.dictionary)
        
        // Detect fetch without predicate followed by filter/iteration
        let lines = contents.components(separatedBy: .newlines)
        for (index, line) in lines.enumerated() {
            if line.contains("FetchDescriptor") && !line.contains("predicate:") && !line.contains("#Predicate") {
                let nextLines = lines[(index+1)...min(index+5, lines.count-1)]
                let hasIteration = nextLines.contains { 
                    $0.contains("for ") || $0.contains(".filter") || $0.contains(".first") 
                }
                
                if hasIteration {
                    let lineNumber = index + 1
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: lineNumber),
                        reason: "FetchDescriptor without predicate before iteration - add predicate to fetch only needed entities: FetchDescriptor(predicate: #Predicate { $0.condition })"
                    ))
                }
            }
        }
        
        return violations
    }
}
