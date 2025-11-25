// ═══════════════════════════════════════════════════════════════
// Persistence - SwiftData Schema Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct SwiftDataSchemaValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "persistence_swiftdata_schema",
        name: "Persistence - SwiftData Schema Versioning",
        description: "SwiftData schemas must use VersionedSchema for migration support",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        if contents.contains("@Model") && !contents.contains("test") {
            let hasVersionedSchema = contents.contains("VersionedSchema") ||
                                    contents.contains("SchemaMigrationPlan")
            
            if !hasVersionedSchema {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: 1),
                    reason: "SwiftData @Model without VersionedSchema - define schema versions to support safe migrations"
                ))
            }
        }
        
        return violations
    }
}
