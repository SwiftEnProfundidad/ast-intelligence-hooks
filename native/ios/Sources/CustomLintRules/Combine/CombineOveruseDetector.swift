// ═══════════════════════════════════════════════════════════════
// Combine - Overuse Detector
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct CombineOveruseDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "combine_overuse",
        name: "Combine - Overuse Detection",
        description: "Prefer async/await over Combine for simple async operations",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        let combineCount = contents.components(separatedBy: "import Combine").count - 1
        let asyncCount = contents.components(separatedBy: "async").count - 1
        
        if combineCount > 0 && asyncCount == 0 && contents.contains("Future") {
            violations.append(StyleViolation(
                ruleDescription: Self.description,
                severity: .warning,
                location: Location(file: file.path, line: 1),
                reason: "Using Combine Future for single async operation - prefer async/await for simpler code: async throws -> T"
            ))
        }
        
        return violations
    }
}
