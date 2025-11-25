// ═══════════════════════════════════════════════════════════════
// Testing - BDD Naming Validator (Given-When-Then)
// ═══════════════════════════════════════════════════════════════
// Validates test names follow BDD conventions

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct BDDNamingValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "test_bdd_naming",
        name: "BDD Test Naming Convention",
        description: "Test names should follow Given_When_Then or test_should pattern",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            func test_givenValidUser_whenLogin_thenSucceeds() {}
            func test_shouldReturnError_whenInvalidInput() {}
            """)
        ],
        triggeringExamples: [
            Example("""
            func ↓testLogin() {}
            func ↓testValidation() {}
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        guard file.path?.contains("Test") == true else {
            return []
        }
        
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        var violations: [StyleViolation] = []
        
        structure.dictionary.walkSubstructure { substructure in
            guard let kind = substructure.kind,
                  kind == SwiftDeclarationKind.functionMethodInstance.rawValue,
                  let offset = substructure.offset,
                  let name = substructure.name else { return }
            
            guard name.hasPrefix("test") else { return }
            
            let hasGivenWhenThen = name.contains("given") || name.contains("when") || name.contains("then")
            let hasShould = name.contains("should")
            let hasUnderscores = name.contains("_")
            
            let isWellNamed = (hasGivenWhenThen && hasUnderscores) || hasShould
            
            if !isWellNamed && name != "setUp" && name != "tearDown" {
                let message = """
                Test name '\(name)' doesn't follow BDD convention
                
                Problem: Unclear what the test validates
                
                BDD Naming Patterns:
                
                1. Given-When-Then:
                   test_givenEmptyCart_whenAddItem_thenCartHasOneItem()
                   test_givenInvalidEmail_whenValidate_thenThrowsError()
                
                2. Should pattern:
                   test_shouldReturnError_whenInvalidInput()
                   test_shouldUpdateUI_whenDataChanges()
                
                3. Descriptive with underscores:
                   test_loginWithValidCredentials_succeeds()
                   test_fetchOrders_returnsEmptyArray_whenNoData()
                
                Benefits:
                - Self-documenting tests
                - Clear intent
                - Easy to understand failures
                - Specification by example
                
                Avoid:
                - testLogin() ❌ (what about login?)
                - testValidation() ❌ (too vague)
                - testCase1() ❌ (meaningless)
                """
                
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file, byteOffset: offset),
                    reason: message
                ))
            }
        }
        
        return violations
    }
}

