// ═══════════════════════════════════════════════════════════════
// UIKit - Delegate Weakness Validation
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct DelegateWeaknessValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "uikit_delegate_weakness",
        name: "UIKit - Delegate Must Be Weak",
        description: "Delegate properties must be weak to prevent retain cycles",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let properties = structure.dictionary.substructure.flatMap { $0.substructure }.filter {
            $0.kind == "source.lang.swift.decl.var.instance"
        }
        
        for property in properties {
            let propertyName = property.name ?? ""
            guard propertyName.lowercased().contains("delegate") else { continue }
            
            let typeName = property.typeName ?? ""
            let isProtocolType = typeName.hasSuffix("Delegate") || typeName.hasSuffix("DataSource")
            
            if isProtocolType {
                let attributes = property.attributes ?? []
                let isWeak = attributes.contains { $0.attribute == "source.decl.attribute.weak" }
                
                if !isWeak {
                    if let offset = property.offset {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .error,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "Delegate property '\(propertyName)' not weak - causes retain cycle. Use: weak var \(propertyName): \(typeName)?"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}

