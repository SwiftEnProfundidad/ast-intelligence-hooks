// ═══════════════════════════════════════════════════════════════
// Code Organization - MARK Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct MARKValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "organization_mark_required",
        name: "MARK Sections Required",
        description: "Large files (>100 lines) should have MARK: sections for organization",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            class MyClass {
                // MARK: - Properties
                var name: String
                
                // MARK: - Lifecycle
                func viewDidLoad() {}
                
                // MARK: - Helpers
                private func helper() {}
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            class ↓MyClass {
                // 150 lines without MARK sections
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        let lineCount = file.lines.count
        
        guard lineCount > 100 else { return [] }
        
        let content = file.contents
        let hasMARK = content.contains("// MARK:") || content.contains("MARK: -")
        
        if !hasMARK {
            return [StyleViolation(
                ruleDescription: Self.description,
                severity: .warning,
                location: Location(file: file, line: 1),
                reason: """
                File with \(lineCount) lines without MARK: sections
                
                Add MARK: for organization:
                // MARK: - Properties
                // MARK: - Lifecycle  
                // MARK: - Public Methods
                // MARK: - Private Methods
                // MARK: - Helpers
                """
            )]
        }
        
        return []
    }
}

