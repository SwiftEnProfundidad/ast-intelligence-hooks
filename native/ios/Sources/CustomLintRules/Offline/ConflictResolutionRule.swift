// ═══════════════════════════════════════════════════════════════
// Offline - Conflict Resolution Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ConflictResolutionRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "offline_conflict_resolution",
        name: "Offline - Conflict Resolution Strategy",
        description: "Data sync operations must have conflict resolution strategy for offline modifications",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let functions = structure.dictionary.substructure.flatMap { $0.substructure }.filter {
            $0.kind == "source.lang.swift.decl.function.method.instance"
        }
        
        for function in functions {
            let functionName = function.name ?? ""
            if functionName.contains("sync") || functionName.contains("merge") {
                let contents = file.contents
                if let offset = function.offset, let length = function.length {
                    let start = contents.index(contents.startIndex, offsetBy: offset)
                    let end = contents.index(start, offsetBy: min(length, contents.count - offset))
                    let functionText = String(contents[start..<end])
                    
                    let hasConflictHandling = functionText.contains("conflict") || 
                                             functionText.contains("version") ||
                                             functionText.contains("timestamp") ||
                                             functionText.contains("lastModified")
                    
                    if !hasConflictHandling {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .warning,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "Sync function '\(functionName)' without conflict resolution - implement strategy: last-write-wins, version-based, or timestamp-based merge"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}
