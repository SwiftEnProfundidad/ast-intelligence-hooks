// ═══════════════════════════════════════════════════════════════
// Persistence - CloudKit Sync Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct CloudKitSyncValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "persistence_cloudkit_sync",
        name: "Persistence - CloudKit Synchronization",
        description: "CloudKit sync must handle conflicts and network availability",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        if contents.contains("CKContainer") || contents.contains("CloudKit") {
            let hasConflictHandling = contents.contains("serverRecordChanged") ||
                                     contents.contains("CKRecordConflict") ||
                                     contents.contains("resolveConflict")
            
            if !hasConflictHandling {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: 1),
                    reason: "CloudKit usage without conflict resolution - handle CKError.serverRecordChanged for offline sync"
                ))
            }
        }
        
        return violations
    }
}
