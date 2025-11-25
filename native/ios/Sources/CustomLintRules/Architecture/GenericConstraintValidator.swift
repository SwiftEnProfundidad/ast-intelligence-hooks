// ═══════════════════════════════════════════════════════════════
// Architecture - Generic Constraint Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct GenericConstraintValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "architecture_generic_constraint",
        name: "Architecture - Generic Type Constraints",
        description: "Generic types should have appropriate constraints for type safety",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let functions = structure.dictionary.substructure.flatMap { $0.substructure }.filter {
            $0.kind == "source.lang.swift.decl.function.method.instance"
        }
        
        for function in functions {
            let functionName = function.name ?? ""
            if functionName.contains("<") && functionName.contains(">") {
                let hasConstraint = functionName.contains("where") || functionName.contains(":")
                
                if !hasConstraint {
                    if let offset = function.offset {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .warning,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "Generic function without constraints - add where clause for type safety: func process<T: Codable>(item: T) where T: Identifiable"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}
