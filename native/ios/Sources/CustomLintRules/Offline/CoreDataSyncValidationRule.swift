// ═══════════════════════════════════════════════════════════════
// Offline - CoreData Sync Validation Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct CoreDataSyncValidationRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "offline_coredata_sync",
        name: "Offline - CoreData Sync Metadata",
        description: "CoreData entities must have sync metadata (syncStatus, lastSyncedAt) for offline-first architecture",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let classes = structure.dictionary.substructure.filter {
            $0.kind == "source.lang.swift.decl.class"
        }
        
        for classDict in classes {
            let inherits = classDict.inheritedTypes ?? []
            if inherits.contains("NSManagedObject") {
                let properties = classDict.substructure.filter {
                    $0.kind == "source.lang.swift.decl.var.instance"
                }
                
                let propertyNames = properties.compactMap { $0.name }
                let hasSyncMetadata = propertyNames.contains { 
                    $0 == "syncStatus" || $0 == "lastSyncedAt" || $0 == "needsSync" 
                }
                
                if !hasSyncMetadata {
                    if let offset = classDict.offset {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .error,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "CoreData entity without sync metadata - add syncStatus: String and lastSyncedAt: Date for offline-first sync"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}
