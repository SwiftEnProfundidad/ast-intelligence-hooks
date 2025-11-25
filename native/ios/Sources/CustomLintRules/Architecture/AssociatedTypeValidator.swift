// ═══════════════════════════════════════════════════════════════
// Architecture - Associated Type Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct AssociatedTypeValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "architecture_associated_type",
        name: "Architecture - Protocol Associated Type",
        description: "Generic protocols should use associatedtype for type flexibility",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let protocols = structure.dictionary.substructure.filter {
            $0.kind == "source.lang.swift.decl.protocol"
        }
        
        for protocolDict in protocols {
            let contents = file.contents
            if let offset = protocolDict.offset, let length = protocolDict.length {
                let start = contents.index(contents.startIndex, offsetBy: offset)
                let end = contents.index(start, offsetBy: min(length, contents.count - offset))
                let protocolText = String(contents[start..<end])
                
                let hasGeneric = protocolText.contains("<") && protocolText.contains(">")
                let hasAssociatedType = protocolText.contains("associatedtype")
                
                if hasGeneric && !hasAssociatedType {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file, byteOffset: ByteCount(offset)),
                        reason: "Protocol with generic constraint - prefer associatedtype over generic parameter for protocol-oriented design"
                    ))
                }
            }
        }
        
        return violations
    }
}
