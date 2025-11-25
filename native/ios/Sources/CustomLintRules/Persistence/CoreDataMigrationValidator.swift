// ═══════════════════════════════════════════════════════════════
// Persistence - CoreData Migration Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct CoreDataMigrationValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "persistence_coredata_migration",
        name: "Persistence - CoreData Migration Plan",
        description: "CoreData model changes require migration plan to prevent data loss",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        if contents.contains("NSPersistentContainer") || contents.contains("NSManagedObjectModel") {
            let hasMigration = contents.contains("NSMappingModel") ||
                             contents.contains("NSMigrationManager") ||
                             contents.contains("lightweightMigration") ||
                             contents.contains("shouldMigrateStoreAutomatically")
            
            if !hasMigration {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: 1),
                    reason: "CoreData setup without migration strategy - add lightweight migration or custom mapping model to prevent data loss on schema changes"
                ))
            }
        }
        
        return violations
    }
}
