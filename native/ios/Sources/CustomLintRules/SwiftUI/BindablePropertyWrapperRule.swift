// ═══════════════════════════════════════════════════════════════
// SwiftUI - Bindable Property Wrapper Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct BindablePropertyWrapperRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_bindable_property_wrapper",
        name: "SwiftUI - @Bindable with @Observable",
        description: "@Bindable must be used with @Observable objects for two-way binding (iOS 17+)",
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
                let hasBindable = property.attributes?.contains { 
                    $0.attribute == "source.decl.attribute.Bindable" 
                } ?? false
                
                if hasBindable {
                    let typeName = property.typeName ?? ""
                    let fileContents = file.contents
                    
                    // Check if type is @Observable
                    if !fileContents.contains("@Observable") || !fileContents.contains("class \(typeName)") {
                        if let offset = property.offset {
                            violations.append(StyleViolation(
                                ruleDescription: Self.description,
                                severity: .error,
                                location: Location(file: file, byteOffset: ByteCount(offset)),
                                reason: "@Bindable requires @Observable class - '\(typeName)' must be marked @Observable for bindable two-way binding"
                            ))
                        }
                    }
                }
            }
        }
        
        return violations
    }
}
