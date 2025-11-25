// ═══════════════════════════════════════════════════════════════
// Background - Background Task Battery Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct BackgroundTaskBatteryRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "background_task_battery_optimization",
        name: "Background - Task Battery Optimization",
        description: "BGTaskScheduler tasks must complete quickly (<30s) to avoid battery drain and OS termination",
        kind: .performance,
        nonTriggeringExamples: [
            Example("""
            task.setTaskCompleted(success: true)
            """)
        ],
        triggeringExamples: [
            Example("""
            while true {  // ↓ Infinite loop in background task
                process()
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("BGTaskScheduler") || line.contains("BGProcessingTask") || line.contains("BGAppRefreshTask") {
                let nextLines = lines[(index+1)...min(index+15, lines.count-1)].joined()
                if nextLines.contains("while true") || nextLines.contains("Timer") || nextLines.contains("DispatchQueue.main.async") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Background task with infinite loop or timer - tasks must complete within 30s budget to avoid battery drain and OS termination"
                    ))
                }
            }
        }
        
        return violations
    }
}
