// ═══════════════════════════════════════════════════════════════
// SwiftUI - Binding Validation Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct BindingValidationRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_binding_validation",
        name: "SwiftUI - Binding Validation",
        description: "@Binding must have proper initialization to prevent runtime crashes",
        kind: .lint
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
                let hasBinding = property.attributes?.contains { 
                    $0.attribute == "source.decl.attribute.Binding" 
                } ?? false
                
                if hasBinding {
                    let propertyName = property.name ?? ""
                    let typeName = property.typeName ?? ""
                    
                    // Check if used in Preview without proper initialization
                    let fileContents = file.contents
                    if fileContents.contains("#Preview") || fileContents.contains("PreviewProvider") {
                        if !fileContents.contains(".constant(") && fileContents.contains(propertyName) {
                            if let offset = property.offset {
                                violations.append(StyleViolation(
                                    ruleDescription: Self.description,
                                    severity: .warning,
                                    location: Location(file: file, byteOffset: ByteCount(offset)),
                                    reason: "@Binding '\(propertyName)' in Preview - use .constant() for preview: MyView(value: .constant(true))"
                                ))
                            }
                        }
                    }
                }
            }
        }
        
        return violations
    }
}
