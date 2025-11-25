// ═══════════════════════════════════════════════════════════════
// Testing - Spy Preference Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct SpyPreferenceValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "testing_spy_preference",
        name: "Testing - Spies Over Mocks",
        description: "Prefer spies over mocks/stubs to verify real behavior",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard file.path?.contains("Tests") ?? false else { return [] }
        guard let structure = try? Structure(file: file) else { return [] }
        
        let classes = structure.dictionary.substructure.filter {
            $0.kind == "source.lang.swift.decl.class"
        }
        
        for classDict in classes {
            let className = classDict.name ?? ""
            if className.contains("Mock") || className.contains("Stub") {
                let methods = classDict.substructure.filter {
                    $0.kind == "source.lang.swift.decl.function.method.instance"
                }
                
                let allMethodsReturnVoid = methods.allSatisfy { ($0.typeName ?? "").contains("Void") }
                
                if allMethodsReturnVoid && methods.count > 3 {
                    if let offset = classDict.offset {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .warning,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "Mock/Stub '\(className)' with many void methods - prefer Spy that tracks calls to real implementation for better test coverage"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}
