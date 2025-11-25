// ═══════════════════════════════════════════════════════════════
// SwiftUI Navigation - Scroll Position Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ScrollPositionRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_scroll_position",
        name: "SwiftUI - Scroll Position (iOS 17+)",
        description: "Use scrollPosition() modifier for programmatic scrolling instead of ScrollViewReader in iOS 17+",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            ScrollView {
                LazyVStack {
                    ...
                }
                .scrollPosition(id: $scrollPosition)
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            ScrollViewReader { proxy in  // ↓ Use scrollPosition() in iOS 17+
                ScrollView {
                    ...
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
            if line.contains("ScrollViewReader") && !line.contains("//") {
                let nextLines = lines[(index+1)...min(index+5, lines.count-1)].joined()
                if !nextLines.contains("#available") && !nextLines.contains("iOS 16") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "ScrollViewReader - use .scrollPosition(id: $position) in iOS 17+ for simpler scroll control with @State var scrollPosition: UUID?"
                    ))
                }
            }
        }
        
        return violations
    }
}

