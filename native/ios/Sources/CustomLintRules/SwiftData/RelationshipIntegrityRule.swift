// ═══════════════════════════════════════════════════════════════
// SwiftData - Relationship Integrity Rule
// ═══════════════════════════════════════════════════════════════
// Validates @Relationship correctness (inverse, deleteRule)

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct RelationshipIntegrityRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftdata_relationship_integrity",
        name: "SwiftData - Relationship Integrity",
        description: "@Relationship must specify inverse for bidirectional relationships and deleteRule for to-many",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            @Model
            class Store {
                @Relationship(deleteRule: .cascade, inverse: \\Order.store)
                var orders: [Order]
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            @Model
            class Store {
                @Relationship  // ↓ Missing inverse and deleteRule
                var orders: [Order]
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let classes = structure.dictionary.substructure.filter {
            $0.kind == "source.lang.swift.decl.class"
        }
        
        for classDict in classes {
            let hasModel = classDict.attributes?.contains { $0.attribute == "source.decl.attribute.Model" } ?? false
            guard hasModel else { continue }
            
            let properties = classDict.substructure.filter {
                $0.kind == "source.lang.swift.decl.var.instance"
            }
            
            for property in properties {
                let hasRelationship = property.attributes?.contains { 
                    $0.attribute == "source.decl.attribute.Relationship" 
                } ?? false
                
                guard hasRelationship else { continue }
                
                let propertyName = property.name ?? ""
                let typeName = property.typeName ?? ""
                let isToMany = typeName.contains("[") || typeName.contains("Set<")
                
                let contents = file.contents
                if let offset = property.offset, let length = property.length {
                    let start = contents.index(contents.startIndex, offsetBy: offset)
                    let end = contents.index(start, offsetBy: length)
                    let propertyText = String(contents[start..<end])
                    
                    let hasInverse = propertyText.contains("inverse:")
                    let hasDeleteRule = propertyText.contains("deleteRule:")
                    
                    if !hasInverse {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .error,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "@Relationship '\(propertyName)' missing inverse - specify inverse: \\OtherModel.property for bidirectional relationship integrity"
                        ))
                    }
                    
                    if isToMany && !hasDeleteRule {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .warning,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "@Relationship '\(propertyName)' to-many without deleteRule - specify .cascade, .nullify, or .deny to prevent data corruption"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}
