// ═══════════════════════════════════════════════════════════════
// Persistence - FileManager Security Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct FileManagerSecurityValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "persistence_filemanager_security",
        name: "Persistence - FileManager Security",
        description: "FileManager operations must use secure directories and validate paths",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("FileManager") && line.contains("createFile") {
                if line.contains("tmp/") || line.contains("/tmp/") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "File creation in /tmp - use FileManager.default.urls(for: .documentDirectory) for persistent secure storage"
                    ))
                }
            }
        }
        
        return violations
    }
}
