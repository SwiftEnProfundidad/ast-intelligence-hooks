// ═══════════════════════════════════════════════════════════════
// SwiftUI PropertyWrappers - FocusState Validation Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct FocusStateValidationRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_focusstate_validation",
        name: "SwiftUI - @FocusState Validation",
        description: "@FocusState must use enum for multiple fields to enable sequential navigation",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            enum Field: Hashable { case email, password }
            @FocusState private var focusedField: Field?
            """)
        ],
        triggeringExamples: [
            Example("""
            @FocusState private var emailFocused: Bool  // ↓ Use enum for multiple fields
            @FocusState private var passwordFocused: Bool
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        var focusStateCount = 0
        var firstFocusLine = 0
        
        for (index, line) in lines.enumerated() {
            if line.contains("@FocusState") {
                focusStateCount += 1
                if focusStateCount == 1 {
                    firstFocusLine = index + 1
                }
                if focusStateCount > 1 && !line.contains("enum") && !line.contains("?") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: firstFocusLine),
                        reason: "Multiple @FocusState properties (\(focusStateCount)) - use enum Field: Hashable { case field1, field2 } @FocusState var focused: Field? for sequential navigation"
                    ))
                    break
                }
            }
        }
        
        return violations
    }
}

