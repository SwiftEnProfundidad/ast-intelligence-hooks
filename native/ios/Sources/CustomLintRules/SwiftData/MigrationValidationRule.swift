// ═══════════════════════════════════════════════════════════════
// SwiftData - Migration Validation Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct MigrationValidationRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftdata_migration_validation",
        name: "SwiftData - Migration Validation",
        description: "Schema versions must have proper VersionedSchema and SchemaMigrationPlan to prevent data loss",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            enum StoreSchemaV1: VersionedSchema {
                static var versionIdentifier = Schema.Version(1, 0, 0)
                static var models: [any PersistentModel.Type] { [Store.self] }
            }
            
            enum StoreMigrationPlan: SchemaMigrationPlan {
                static var schemas: [any VersionedSchema.Type] { [StoreSchemaV1.self, StoreSchemaV2.self] }
                static var stages: [MigrationStage] { [migrateV1toV2] }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            enum StoreSchemaV1: VersionedSchema {  // ↓ Missing migration plan
                static var models: [any PersistentModel.Type] { [Store.self] }
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        if contents.contains("VersionedSchema") {
            let hasMigrationPlan = contents.contains("SchemaMigrationPlan") ||
                                  contents.contains("MigrationStage")
            
            if !hasMigrationPlan {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .error,
                    location: Location(file: file.path, line: 1),
                    reason: "VersionedSchema without SchemaMigrationPlan - define migration stages to prevent data loss on schema changes: enum MyMigrationPlan: SchemaMigrationPlan { static var stages: [MigrationStage] }"
                ))
            }
        }
        
        return violations
    }
}
