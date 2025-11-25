// ═══════════════════════════════════════════════════════════════
// SwiftUI Modern - Animation Abuse Detector
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct AnimationAbuseDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_animation_abuse",
        name: "SwiftUI - Animation Abuse Detection",
        description: "Excessive .animation() modifiers cause performance issues - use explicit animations",
        kind: .performance,
        nonTriggeringExamples: [
            Example("""
            Button("Tap") {
                withAnimation(.spring()) { expanded.toggle() }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            VStack {
                ForEach(items) { item in
                    ItemView(item)
                        .animation(.default, value: item.id)  // ↓ Animation in ForEach
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
            if line.contains("ForEach") {
                let nextLines = lines[(index+1)...min(index+10, lines.count-1)].joined()
                if nextLines.contains(".animation(") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: ".animation() in ForEach causes N animations per update - use withAnimation in button action or .transaction for explicit control"
                    ))
                }
            }
        }
        
        return violations
    }
}

