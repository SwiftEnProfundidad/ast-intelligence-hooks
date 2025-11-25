// ═══════════════════════════════════════════════════════════════
// Performance - Core Data Performance Rule
// ═══════════════════════════════════════════════════════════════
// Core Data queries must use batch operations and predicates

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct CoreDataPerformanceRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "performance_coredata_optimization",
        name: "Performance - Core Data Optimization",
        description: "Core Data queries in loops cause N+1 problem (Use batch fetch requests)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            let request = NSFetchRequest<User>(entityName: "User")
            request.predicate = NSPredicate(format: "id IN %@", userIds)
            let users = try context.fetch(request)
            """)
        ],
        triggeringExamples: [
            Example("""
            for id in userIds {
                let request = NSFetchRequest<User>(entityName: "User")
                request.predicate = NSPredicate(format: "id == %@", id)
                let user = try? ↓context.fetch(request).first
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        let coreDataInLoopPattern = "for\\s+\\w+\\s+in[^{]+\\{[^}]*NSFetchRequest|for\\s+\\w+\\s+in[^{]+\\{[^}]*\\.fetch\\("
        guard let regex = try? NSRegularExpression(pattern: coreDataInLoopPattern, options: [.dotMatchesLineSeparators]) else {
            return []
        }
        
        let nsString = contents as NSString
        let matches = regex.matches(in: contents, range: NSRange(location: 0, length: nsString.length))
        
        for match in matches {
            let byteOffset = ByteCount(nsString.substring(with: NSRange(location: 0, length: match.range.location)).utf8.count)
            
            let message = """
            🚨 HIGH: Core Data N+1 Query Problem
            
            Performance Impact: O(n) queries instead of O(1)
            
            CURRENT (SLOW):
            ```swift
            for userId in userIds {
                let request = NSFetchRequest<User>(entityName: "User")
                request.predicate = NSPredicate(format: "id == %@", userId)
                let user = try context.fetch(request).first
                // Process user
            }
            
            // 100 users = 100 queries = 2-5 seconds
            ```
            
            SOLUTION (IN predicate):
            ```swift
            let request = NSFetchRequest<User>(entityName: "User")
            request.predicate = NSPredicate(format: "id IN %@", userIds)
            let users = try context.fetch(request)
            
            // 100 users = 1 query = 50ms
            // 40-100x faster!
            ```
            
            BATCH OPERATIONS:
            ```swift
            // Batch fetch
            let fetchRequest = NSFetchRequest<User>(entityName: "User")
            fetchRequest.relationshipKeyPathsForPrefetching = ["orders", "address"]
            
            // Batch update
            let batchUpdate = NSBatchUpdateRequest(entityName: "User")
            batchUpdate.predicate = NSPredicate(format: "isActive == NO")
            batchUpdate.propertiesToUpdate = ["deletedAt": Date()]
            
            // Batch delete
            let batchDelete = NSBatchDeleteRequest(fetchRequest: fetchRequest)
            ```
            
            This is a HIGH performance issue.
            Use batch operations or IN predicates.
            """
            
            violations.append(StyleViolation(
                ruleDescription: Self.description,
                severity: .warning,
                location: Location(file: file, byteOffset: byteOffset),
                reason: message
            ))
        }
        
        return violations
    }
}

