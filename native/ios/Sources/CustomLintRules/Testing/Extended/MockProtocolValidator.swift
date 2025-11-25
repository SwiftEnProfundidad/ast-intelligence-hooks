// ═══════════════════════════════════════════════════════════════
// Testing - Mock Protocol Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct MockProtocolValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "testing_mock_protocol",
        name: "Testing - Protocol-based Mocking",
        description: "Test mocks should conform to protocols, not subclass concrete types",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard file.path?.contains("Tests") ?? false else { return [] }
        guard let structure = try? Structure(file: file) else { return [] }
        
        let classes = structure.dictionary.substructure.filter {
            $0.kind == "source.lang.swift.decl.class" &&
            ($0.name?.contains("Mock") ?? false || $0.name?.contains("Spy") ?? false)
        }
        
        for classDict in classes {
            let inherits = classDict.inheritedTypes ?? []
            let inheritsProtocol = inherits.contains { $0.hasSuffix("Protocol") || !$0.contains("NS") }
            
            if !inheritsProtocol && inherits.count > 0 {
                if let offset = classDict.offset {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file, byteOffset: ByteCount(offset)),
                        reason: "Mock class inheriting concrete type - conform to protocol instead for better testability"
                    ))
                }
            }
        }
        
        return violations
    }
}
