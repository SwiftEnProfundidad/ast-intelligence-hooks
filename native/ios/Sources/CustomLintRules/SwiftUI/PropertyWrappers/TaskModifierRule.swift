// ═══════════════════════════════════════════════════════════════
// SwiftUI PropertyWrappers - Task Modifier Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct TaskModifierRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_task_modifier",
        name: "SwiftUI - .task() Modifier",
        description: "Use .task() modifier instead of .onAppear for async operations",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            .task {
                await viewModel.loadData()
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            .onAppear {
                Task {  // ↓ Use .task() instead
                    await viewModel.loadData()
                }
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains(".onAppear") {
                let nextLines = lines[(index+1)...min(index+5, lines.count-1)].joined()
                if nextLines.contains("Task {") || nextLines.contains("await") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: ".onAppear with Task - use .task() modifier for automatic cancellation: .task { await load() } cancels on view disappear"
                    ))
                }
            }
        }
        
        return violations
    }
}

