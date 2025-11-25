// ═══════════════════════════════════════════════════════════════
// Testing - XCTest Usage Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct XCTestUsageValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "testing_xctest_usage",
        name: "Testing - XCTest Framework Usage",
        description: "Test classes must inherit from XCTestCase",
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
            let inherits = classDict.inheritedTypes ?? []
            let inheritsXCTestCase = inherits.contains("XCTestCase")
            
            if !inheritsXCTestCase {
                if let offset = classDict.offset {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file, byteOffset: ByteCount(offset)),
                        reason: "Test class must inherit from XCTestCase"
                    ))
                }
            }
        }
        
        return violations
    }
}
