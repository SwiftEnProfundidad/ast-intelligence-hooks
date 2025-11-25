// ═══════════════════════════════════════════════════════════════
// Performance - Network Batching Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct NetworkBatchingValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "performance_network_batching",
        name: "Performance - Network Request Batching",
        description: "Multiple network requests in loop should be batched for efficiency",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        func checkForLoops(_ dict: SourceKittenDict) {
            if dict.kind == "source.lang.swift.stmt.foreach" || dict.kind == "source.lang.swift.stmt.for" {
                let loopText = file.contents
                if let offset = dict.offset, let length = dict.length {
                    let start = loopText.index(loopText.startIndex, offsetBy: offset)
                    let end = loopText.index(start, offsetBy: min(length, loopText.count - offset))
                    let text = String(loopText[start..<end])
                    
                    if text.contains("await") && (text.contains("fetch") || text.contains("request")) {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .warning,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "Network requests in loop - batch with TaskGroup: async let results = await withThrowingTaskGroup { ids.forEach { group.addTask { fetch($0) } } }"
                        ))
                    }
                }
            }
            
            for sub in dict.substructure {
                checkForLoops(sub)
            }
        }
        
        checkForLoops(structure.dictionary)
        
        return violations
    }
}
