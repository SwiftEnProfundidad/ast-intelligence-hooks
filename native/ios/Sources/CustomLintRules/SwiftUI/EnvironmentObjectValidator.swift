// ═══════════════════════════════════════════════════════════════
// SwiftUI - EnvironmentObject Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct EnvironmentObjectValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_environmentobject",
        name: "SwiftUI - @EnvironmentObject Validation",
        description: "@EnvironmentObject must be provided by parent view or app to prevent runtime crash",
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
                let hasEnvironmentObject = property.attributes?.contains { $0.attribute == "source.decl.attribute.EnvironmentObject" } ?? false
                
                if hasEnvironmentObject {
                    let typeName = property.typeName ?? ""
                    let contents = file.contents
                    let hasProvider = contents.contains(".environmentObject(") && contents.contains(typeName)
                    
                    if !hasProvider && !contents.contains("Preview") {
                        if let offset = property.offset {
                            violations.append(StyleViolation(
                                ruleDescription: Self.description,
                                severity: .error,
                                location: Location(file: file, byteOffset: ByteCount(offset)),
                                reason: "@EnvironmentObject of type '\(typeName)' - ensure parent provides: .environmentObject(\(typeName)()) or app crashes at runtime"
                            ))
                        }
                    }
                }
            }
        }
        
        return violations
    }
}
