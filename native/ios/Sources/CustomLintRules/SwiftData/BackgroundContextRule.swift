// ═══════════════════════════════════════════════════════════════
// SwiftData - Background Context Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct BackgroundContextRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftdata_background_context",
        name: "SwiftData - Background Context Usage",
        description: "Heavy SwiftData operations must use background ModelContext for thread safety",
        kind: .performance,
        nonTriggeringExamples: [
            Example("""
            Task {
                let backgroundContext = ModelContext(modelContainer)
                await backgroundContext.save()
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            Task {
                modelContext.save()  // ↓ Using main context in Task
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if (line.contains("Task {") || line.contains("Task.detached")) && !line.contains("test") {
                let nextLines = lines[(index+1)...min(index+10, lines.count-1)].joined()
                if nextLines.contains("modelContext") && !nextLines.contains("ModelContext(") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "ModelContext used in Task without creating background context - create: let backgroundContext = ModelContext(modelContainer) for thread safety"
                    ))
                }
            }
        }
        
        return violations
    }
}
