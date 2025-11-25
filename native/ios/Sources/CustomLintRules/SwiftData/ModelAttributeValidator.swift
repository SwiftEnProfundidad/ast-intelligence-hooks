// ═══════════════════════════════════════════════════════════════
// SwiftData - Model Attribute Validator
// ═══════════════════════════════════════════════════════════════
// Validates @Model usage and attribute types

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ModelAttributeValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftdata_model_attribute_validation",
        name: "SwiftData - Model Attribute Validation",
        description: "@Model classes must have valid attribute types and proper @Transient for computed properties",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            @Model
            class Store {
                var name: String
                var location: Location
                @Transient var distance: Double { 
                    calculateDistance() 
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            @Model
            class Store {
                var name: String
                var ↓computed: String { "value" }  // Missing @Transient
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
            let attributes = classDict.attributes ?? []
            let hasModelAttribute = attributes.contains { attr in
                attr.attribute == "source.decl.attribute.Model"
            }
            
            guard hasModelAttribute else { continue }
            
            let properties = classDict.substructure.filter {
                $0.kind == "source.lang.swift.decl.var.instance"
            }
            
            for property in properties {
                let propertyName = property.name ?? ""
                let getter = property.substructure.first { $0.kind == "source.lang.swift.accessor.getter" }
                let isComputed = getter != nil
                
                if isComputed {
                    let hasTransient = property.attributes?.contains { $0.attribute == "source.decl.attribute.Transient" } ?? false
                    
                    if !hasTransient {
                        if let offset = property.offset {
                            violations.append(StyleViolation(
                                ruleDescription: Self.description,
                                severity: .error,
                                location: Location(file: file, byteOffset: ByteCount(offset)),
                                reason: "Computed property '\(propertyName)' in @Model class must have @Transient attribute - SwiftData cannot persist computed properties"
                            ))
                        }
                    }
                }
            }
        }
        
        return violations
    }
}
