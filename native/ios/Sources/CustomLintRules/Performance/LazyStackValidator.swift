// ═══════════════════════════════════════════════════════════════
// Performance - Lazy Stack Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct LazyStackValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "performance_lazy_stack",
        name: "LazyVStack for Large Lists",
        description: "VStack with ForEach over large arrays should use LazyVStack",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            LazyVStack {
                ForEach(items) { item in
                    ItemView(item)
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            ↓VStack {
                ForEach(largeArray) { item in
                    ItemView(item)
                }
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        let content = file.contents
        var violations: [StyleViolation] = []
        
        let vstackForEachPattern = try? NSRegularExpression(
            pattern: #"VStack\s*\{[^}]*ForEach"#
        )
        
        guard let regex = vstackForEachPattern else { return [] }
        
        let nsString = content as NSString
        let matches = regex.matches(in: content, range: NSRange(location: 0, length: nsString.length))
        
        for match in matches {
            violations.append(StyleViolation(
                ruleDescription: Self.description,
                severity: .warning,
                location: Location(file: file, byteOffset: ByteCount(match.range.location)),
                reason: """
                VStack with ForEach - use LazyVStack for performance
                
                Problem: VStack creates ALL views immediately
                Solution: LazyVStack creates views on demand
                
                Performance impact:
                - VStack: O(n) memory, all views rendered
                - LazyVStack: O(visible) memory, on-demand rendering
                """
            ))
        }
        
        return violations
    }
}

