// ═══════════════════════════════════════════════════════════════
// SwiftData - Transient Property Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct TransientPropertyRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftdata_transient_property",
        name: "SwiftData - Transient Property",
        description: "Computed properties in @Model must be marked @Transient",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let classes = structure.dictionary.substructure.filter {
            $0.kind == "source.lang.swift.decl.class" &&
            ($0.attributes?.contains { $0.attribute == "source.decl.attribute.Model" } ?? false)
        }
        
        for classDict in classes {
            let properties = classDict.substructure.filter {
                $0.kind == "source.lang.swift.decl.var.instance"
            }
            
            for property in properties {
                let hasGetter = property.substructure.contains { $0.kind == "source.lang.swift.accessor.getter" }
                let hasTransient = property.attributes?.contains { $0.attribute == "source.decl.attribute.Transient" } ?? false
                
                if hasGetter && !hasTransient {
                    if let offset = property.offset {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .error,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "Computed property in @Model without @Transient - SwiftData will fail to persist"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}
