// ═══════════════════════════════════════════════════════════════
// SwiftUI Modern - onChange Modern Syntax Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct OnChangeModernSyntaxRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_onchange_modern_syntax",
        name: "SwiftUI - onChange Modern Syntax (iOS 17+)",
        description: "Use modern onChange(of:initial:) with two-parameter closure in iOS 17+",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            .onChange(of: searchText, initial: true) { oldValue, newValue in
                performSearch(newValue)
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            .onChange(of: searchText) { newValue in  // ↓ Use two-parameter closure
                performSearch(newValue)
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains(".onChange(of:") {
                let nextLine = index + 1 < lines.count ? lines[index + 1] : ""
                let hasOldNewParams = nextLine.contains("oldValue") && nextLine.contains("newValue")
                let hasInitial = line.contains("initial:")
                
                if !hasOldNewParams && !hasInitial {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: ".onChange with old syntax - use .onChange(of: value, initial: false) { oldValue, newValue in } for iOS 17+ with access to previous value"
                    ))
                }
            }
        }
        
        return violations
    }
}

