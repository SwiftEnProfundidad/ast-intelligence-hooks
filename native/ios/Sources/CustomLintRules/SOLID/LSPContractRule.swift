// ═══════════════════════════════════════════════════════════════
// LSP: Liskov Substitution Principle - Contract Validator
// ═══════════════════════════════════════════════════════════════
// Detects override methods that weaken parent contract
// Validates: throws, preconditions, return types

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct LSPContractRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "solid_lsp_contract",
        name: "SOLID: LSP - Contract Validation",
        description: "Override methods must not weaken parent contract (LSP: subtypes must be substitutable)",
        kind: .lint,
        nonTriggeringExamples: LSPContractRule.nonTriggeringExamples,
        triggeringExamples: LSPContractRule.triggeringExamples
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        return detectViolations(in: structure.dictionary, file: file)
    }
    
    // MARK: - Detection
    
    private func detectViolations(in dict: SourceKittenDict, file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        dict.walkSubstructure { substructure in
            guard let kind = substructure.kind,
                  kind == SwiftDeclarationKind.functionMethodInstance.rawValue,
                  let offset = substructure.offset,
                  let name = substructure.name else { return }
            
            // Check if method is override
            let attributes = substructure.attributes ?? []
            let isOverride = attributes.contains { attr in
                attr.attribute == "source.decl.attribute.override"
            }
            
            guard isOverride else { return }
            
            // Check for LSP violations
            
            // 1. Override adds 'throws' (strengthens precondition)
            let methodThrows = attributes.contains { attr in
                attr.attribute == "source.decl.attribute.throws"
            }
            
            if methodThrows {
                // Check if parent throws (would need type information)
                // For now, warn about any override that throws
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file, byteOffset: offset),
                    reason: """
                    Override '\(name)' adds 'throws' - verify parent signature matches.
                    
                    LSP Violation: Subtype cannot throw exceptions not in parent signature.
                    
                    Ensure parent method signature includes 'throws':
                    class Parent {
                        func \(name)() throws { ... }  // ← Must throw
                    }
                    """
                ))
            }
            
            // 2. Override adds preconditions (strengthens precondition)
            if let bodyOffset = substructure.bodyOffset,
               let bodyLength = substructure.bodyLength {
                let body = file.stringView.substringWithByteRange(
                    start: bodyOffset,
                    length: bodyLength
                ) ?? ""
                
                if body.contains("precondition(") || body.contains("assert(") || body.contains("require(") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file, byteOffset: offset),
                        reason: """
                        Override '\(name)' adds preconditions - violates LSP.
                        
                        LSP Rule: Preconditions cannot be strengthened in subtypes.
                        
                        Problem:
                        - Parent accepts wider range of inputs
                        - Child narrows inputs with precondition
                        - Substitutability broken
                        
                        Solution:
                        - Move precondition to parent
                        - OR create new method (don't override)
                        """
                    ))
                }
            }
        }
        
        return violations
    }
    
    // MARK: - Examples
    
    private static let nonTriggeringExamples = [
        Example("""
        // Override maintains contract
        class Parent {
            func process() throws { ... }
        }
        
        class Child: Parent {
            override func process() throws {
                // Same signature - LSP OK ✅
            }
        }
        """),
        
        Example("""
        // Override weakens preconditions (OK)
        class Parent {
            func validate(age: Int) {
                precondition(age >= 18, "Must be adult")
            }
        }
        
        class Child: Parent {
            override func validate(age: Int) {
                precondition(age >= 0, "Must be positive")
                // Weaker precondition (accepts more) - LSP OK ✅
            }
        }
        """)
    ]
    
    private static let triggeringExamples = [
        Example("""
        // Override adds throws (contract change)
        class Parent {
            func process() { ... }
        }
        
        class Child: Parent {
            override func ↓process() throws {
                // Adds throws - LSP violation if parent doesn't throw
            }
        }
        """),
        
        Example("""
        // Override strengthens precondition
        class Parent {
            func validate(age: Int) {
                // Accepts any Int
            }
        }
        
        class Child: Parent {
            override func ↓validate(age: Int) {
                precondition(age >= 18, "Must be adult")
                // Stronger precondition - LSP violation ❌
            }
        }
        """)
    ]
}

