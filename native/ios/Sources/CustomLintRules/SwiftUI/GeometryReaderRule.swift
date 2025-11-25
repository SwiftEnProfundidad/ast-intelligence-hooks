// ═══════════════════════════════════════════════════════════════
// SwiftUI - GeometryReader Moderation Rule
// ═══════════════════════════════════════════════════════════════
// GeometryReader overuse impacts performance

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct GeometryReaderRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_geometryreader_moderation",
        name: "SwiftUI - GeometryReader Moderation",
        description: "GeometryReader should be used sparingly (Performance impact)",
        kind: .lint,
        nonTriggeringExamples: [Example("// Justified use of GeometryReader")],
        triggeringExamples: [Example("GeometryReader { geometry in")]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        let geometryReaderCount = contents.components(separatedBy: "GeometryReader").count - 1
        
        if geometryReaderCount > 2 {
            violations.append(StyleViolation(
                ruleDescription: Self.description,
                severity: .warning,
                location: Location(file: file, line: 1, character: 1),
                reason: "🚨 HIGH: Multiple GeometryReader instances (\(geometryReaderCount)). GeometryReader has performance cost. Use alignment guides, Layout protocol, or @ViewBuilder instead when possible."
            ))
        }
        
        return violations
    }
}

