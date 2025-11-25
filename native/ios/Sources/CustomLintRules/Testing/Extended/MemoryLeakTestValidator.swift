// ═══════════════════════════════════════════════════════════════
// Testing - Memory Leak Test Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct MemoryLeakTestValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "testing_memory_leak",
        name: "Testing - trackForMemoryLeaks Helper",
        description: "Tests should use trackForMemoryLeaks helper to detect memory leaks",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard file.path?.contains("Tests") ?? false else { return [] }
        
        let lines = file.contents.components(separatedBy: .newlines)
        for (index, line) in lines.enumerated() {
            if line.contains("makeSUT()") || line.contains("= SUT(") {
                let nextLines = lines[(index+1)...min(index+3, lines.count-1)].joined()
                if !nextLines.contains("trackForMemoryLeaks") && !nextLines.contains("addTeardownBlock") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "SUT creation without memory leak tracking - add trackForMemoryLeaks(sut) to detect retain cycles"
                    ))
                }
            }
        }
        
        return violations
    }
}
