// ═══════════════════════════════════════════════════════════════
// Architecture - Protocol Composition Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ProtocolCompositionValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "architecture_protocol_composition",
        name: "Architecture - Protocol Composition",
        description: "Complex protocols should be composed from smaller, focused protocols",
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
            let requirements = protocolDict.substructure.filter {
                $0.kind == "source.lang.swift.decl.function.method.instance" ||
                $0.kind == "source.lang.swift.decl.var.instance"
            }
            
            if requirements.count > 7 {
                let inherits = protocolDict.inheritedTypes ?? []
                
                if inherits.isEmpty {
                    if let offset = protocolDict.offset {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .warning,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "Large protocol with \(requirements.count) requirements - split into smaller protocols and compose: protocol Large: Small1, Small2 { }"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}
