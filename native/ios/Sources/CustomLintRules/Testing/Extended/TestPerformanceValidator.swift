// ═══════════════════════════════════════════════════════════════
// Testing - Test Performance Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct TestPerformanceValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "testing_performance",
        name: "Testing - Fast Test Enforcement",
        description: "Unit tests should complete in <10ms, integration tests <100ms",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard file.path?.contains("Tests") ?? false else { return [] }
        
        let lines = file.contents.components(separatedBy: .newlines)
        for (index, line) in lines.enumerated() {
            if line.contains("Thread.sleep") || line.contains("sleep(") {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .error,
                    location: Location(file: file.path, line: index + 1),
                    reason: "Thread.sleep in test - causes slow tests, use XCTWaiter or async expectations instead"
                ))
            }
        }
        
        return violations
    }
}
