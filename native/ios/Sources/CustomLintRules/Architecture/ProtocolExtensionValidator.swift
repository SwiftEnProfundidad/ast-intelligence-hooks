// ═══════════════════════════════════════════════════════════════
// Architecture - Protocol Extension Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ProtocolExtensionValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "architecture_protocol_extension",
        name: "Architecture - Protocol Extension Default Implementation",
        description: "Protocol extensions should provide default implementations to reduce boilerplate",
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
            let protocolName = protocolDict.name ?? ""
            let requirements = protocolDict.substructure.count
            
            if requirements > 3 {
                let contents = file.contents
                let hasExtension = contents.contains("extension \(protocolName)")
                
                if !hasExtension {
                    if let offset = protocolDict.offset {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .warning,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "Protocol '\(protocolName)' with \(requirements) requirements without extension - provide default implementations to reduce conformance boilerplate"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}
