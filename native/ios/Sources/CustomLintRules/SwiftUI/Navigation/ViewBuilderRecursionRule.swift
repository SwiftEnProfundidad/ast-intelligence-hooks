// ═══════════════════════════════════════════════════════════════
// SwiftUI Navigation - ViewBuilder Recursion Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ViewBuilderRecursionRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_viewbuilder_recursion",
        name: "SwiftUI - ViewBuilder Recursion Limit",
        description: "ViewBuilder recursion depth must not exceed 10 levels to prevent compiler hang",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            var body: some View {
                VStack { HStack { Text("OK") } }  // Depth: 3
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            var body: some View {
                VStack { HStack { VStack { HStack { VStack { ... } } } } }  // ↓ Depth > 10
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("var body: some View") {
                let nextLines = lines[(index+1)...min(index+30, lines.count-1)].joined()
                let depth = countViewNestingDepth(in: nextLines)
                if depth > 10 {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "ViewBuilder recursion depth \(depth) exceeds 10 - extract nested views into separate computed properties or components"
                    ))
                }
            }
        }
        
        return violations
    }
    
    private func countViewNestingDepth(in text: String) -> Int {
        let views = ["VStack", "HStack", "ZStack", "ScrollView", "List", "ForEach"]
        var maxDepth = 0
        var currentDepth = 0
        
        for char in text {
            if char == "{" { currentDepth += 1 }
            if char == "}" { currentDepth -= 1 }
            maxDepth = max(maxDepth, currentDepth)
        }
        
        return maxDepth
    }
}

