// ═══════════════════════════════════════════════════════════════
// Performance - Memoization Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct MemoizationValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "performance_memoization",
        name: "Performance - Memoization for Expensive Computations",
        description: "Expensive computations in SwiftUI should use @State/@StateObject or remember pattern",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let structs = structure.dictionary.substructure.filter {
            $0.kind == "source.lang.swift.decl.struct"
        }
        
        for structDict in structs {
            let properties = structDict.substructure.filter {
                $0.kind == "source.lang.swift.decl.var.instance"
            }
            
            for property in properties {
                let propertyName = property.name ?? ""
                let isComputed = property.substructure.contains { $0.kind == "source.lang.swift.accessor.getter" }
                
                if isComputed && (propertyName.contains("calculate") || propertyName.contains("process") || propertyName.contains("filtered")) {
                    let hasState = property.attributes?.contains { $0.attribute == "source.decl.attribute.State" } ?? false
                    
                    if !hasState {
                        if let offset = property.offset {
                            violations.append(StyleViolation(
                                ruleDescription: Self.description,
                                severity: .warning,
                                location: Location(file: file, byteOffset: ByteCount(offset)),
                                reason: "Expensive computed property '\(propertyName)' - cache with @State or use memoization to avoid recalculation on every render"
                            ))
                        }
                    }
                }
            }
        }
        
        return violations
    }
}
