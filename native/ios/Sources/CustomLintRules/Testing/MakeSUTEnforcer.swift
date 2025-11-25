// ═══════════════════════════════════════════════════════════════
// Testing - makeSUT Pattern Enforcer
// ═══════════════════════════════════════════════════════════════
// Enforces makeSUT factory pattern in tests

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct MakeSUTEnforcer: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "test_makesut_required",
        name: "makeSUT Pattern Required",
        description: "Test classes should use makeSUT factory for System Under Test creation",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            final class MyTests: XCTestCase {
                func test_something() {
                    let sut = makeSUT()
                    XCTAssertTrue(sut.isValid)
                }
                
                private func makeSUT() -> MyClass {
                    return MyClass()
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            final class ↓MyTests: XCTestCase {
                func test_something() {
                    let instance = MyClass()  // ❌ Direct instantiation
                }
            }
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
                  kind == SwiftDeclarationKind.class.rawValue,
                  let offset = substructure.offset,
                  let name = substructure.name else { return }
            
            guard name.contains("Test") else { return }
            
            let methods = substructure.substructure.filter { sub in
                sub.kind == SwiftDeclarationKind.functionMethodInstance.rawValue
            }
            
            let testMethods = methods.filter { method in
                method.name?.hasPrefix("test") == true
            }
            
            let hasMakeSUT = methods.contains { method in
                method.name?.contains("makeSUT") == true || method.name?.contains("sut") == true
            }
            
            if testMethods.count > 2 && !hasMakeSUT {
                let message = """
                Test class without makeSUT factory pattern
                
                Problem: Tests instantiate SUT directly
                
                Current (BAD):
                func test_feature() {
                    let instance = MyClass(dep1, dep2)  // ❌ Duplicado
                }
                
                func test_anotherFeature() {
                    let instance = MyClass(dep1, dep2)  // ❌ Duplicado
                }
                
                Refactor with makeSUT (GOOD):
                private func makeSUT(
                    dep1: Dep1 = Dep1Spy(),
                    dep2: Dep2 = Dep2Spy()
                ) -> MyClass {
                    return MyClass(dep1: dep1, dep2: dep2)
                }
                
                func test_feature() {
                    let sut = makeSUT()  // ✅ Clean
                }
                
                func test_withCustomDep() {
                    let sut = makeSUT(dep1: CustomDep())  // ✅ Flexible
                }
                
                Benefits:
                - DRY (don't repeat yourself)
                - Easy to modify setup
                - Clear dependencies
                - Testability
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

