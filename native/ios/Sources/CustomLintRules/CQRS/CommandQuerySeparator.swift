// ═══════════════════════════════════════════════════════════════
// CQRS - Command/Query Separation Validator
// ═══════════════════════════════════════════════════════════════
// Detects: Queries with side effects, Commands returning data
// Rule: Queries read, Commands write (never both)

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct CommandQuerySeparator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "cqrs_command_query_separation",
        name: "CQRS - Command/Query Separation",
        description: "Queries should not have side effects. Commands should not return data.",
        kind: .lint,
        nonTriggeringExamples: CommandQuerySeparator.nonTriggeringExamples,
        triggeringExamples: CommandQuerySeparator.triggeringExamples
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        return detectViolations(in: structure.dictionary, file: file)
    }
    
    // MARK: - Detection
    
    private func detectViolations(in dict: SourceKittenDict, file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        dict.walkSubstructure { substructure in
            guard let kind = substructure.kind,
                  kind == SwiftDeclarationKind.functionMethodInstance.rawValue,
                  let offset = substructure.offset,
                  let name = substructure.name else { return }
            
            // Classify method as Command or Query
            let isCommand = isCommandMethod(name, substructure: substructure)
            let isQuery = isQueryMethod(name, substructure: substructure)
            
            // Skip if not clearly Command or Query
            guard isCommand || isQuery else { return }
            
            // Check for violations
            if isQuery {
                // Queries should NOT have side effects
                let hasSideEffects = detectSideEffects(substructure, file: file)
                
                if hasSideEffects {
                    let message = """
                    CQRS Violation: Query method '\(name)' has side effects.
                    
                    CQRS Rule: Queries should only READ, never WRITE.
                    
                    Problem: Query modifies state or calls mutating methods.
                    
                    Detected side effects:
                    - Property assignments
                    - Mutating method calls
                    - State modifications
                    
                    Refactor:
                    1. Separate read and write:
                       // Query (read only)
                       func getOrders() -> [Order] {
                           return repository.fetch()  // No mutations
                       }
                       
                       // Command (write only)
                       func updateOrderCache(orders: [Order]) {
                           cache = orders  // Mutation in separate method
                       }
                    
                    2. If caching is needed, use computed property:
                       private(set) var cachedOrders: [Order] = []
                       
                       func fetchOrders() async throws -> [Order] {
                           let orders = try await repository.fetch()
                           // Update cache AFTER returning (or use @Published)
                           return orders
                       }
                    
                    Benefits:
                    - Predictable (queries don't change state)
                    - Testable (no hidden side effects)
                    - Cacheable (queries are idempotent)
                    """
                    
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file, byteOffset: offset),
                        reason: message
                    ))
                }
            } else if isCommand {
                // Commands should NOT return data (except success/error)
                let returnsData = detectDataReturn(substructure, file: file)
                
                if returnsData {
                    let message = """
                    CQRS Violation: Command method '\(name)' returns data.
                    
                    CQRS Rule: Commands should WRITE, not return business data.
                    
                    Problem: Command returns entity/DTO instead of just success/error.
                    
                    Allowed returns for Commands:
                    - Void
                    - Bool (success flag)
                    - Result<Void, Error>
                    - ID (of created entity)
                    
                    NOT allowed:
                    - Full entities (User, Order, etc.)
                    - Arrays of data
                    - DTOs with business data
                    
                    Refactor:
                    // BEFORE (violation):
                    func createOrder(_ order: Order) -> Order {
                        let saved = repository.save(order)
                        return saved  // ❌ Returns data
                    }
                    
                    // AFTER (CQRS compliant):
                    func createOrder(_ order: Order) async throws -> OrderID {
                        let id = try await repository.save(order)
                        return id  // ✅ Returns only ID
                    }
                    
                    // Separate query to get data:
                    func getOrder(id: OrderID) async throws -> Order {
                        return try await repository.fetch(id)
                    }
                    
                    Benefits:
                    - Clear separation (write vs read)
                    - Scalable (can optimize separately)
                    - Cacheable (queries independent)
                    """
                    
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file, byteOffset: offset),
                        reason: message
                    ))
                }
            }
        }
        
        return violations
    }
    
    // MARK: - Helpers
    
    private func isCommandMethod(_ name: String, substructure: SourceKittenDict) -> Bool {
        let commandPrefixes = ["create", "update", "delete", "add", "remove", "set", "save", "insert"]
        return commandPrefixes.contains { name.lowercased().hasPrefix($0) }
    }
    
    private func isQueryMethod(_ name: String, substructure: SourceKittenDict) -> Bool {
        let queryPrefixes = ["get", "fetch", "find", "load", "list", "search", "query"]
        return queryPrefixes.contains { name.lowercased().hasPrefix($0) }
    }
    
    private func detectSideEffects(_ substructure: SourceKittenDict, file: SwiftLintFile) -> Bool {
        guard let bodyOffset = substructure.bodyOffset,
              let bodyLength = substructure.bodyLength else {
            return false
        }
        
        let body = file.stringView.substringWithByteRange(
            start: bodyOffset,
            length: bodyLength
        ) ?? ""
        
        // Simple heuristic: check for assignments
        let hasAssignment = body.contains(" = ") || body.contains("append(") || body.contains("remove(")
        
        return hasAssignment
    }
    
    private func detectDataReturn(_ substructure: SourceKittenDict, file: SwiftLintFile) -> Bool {
        guard let typename = substructure.typeName else {
            return false
        }
        
        // Allowed return types for commands
        let allowedReturns = ["Void", "Bool", "Result", "ID", "UUID"]
        
        return !allowedReturns.contains { typename.contains($0) }
    }
    
    // MARK: - Examples
    
    private static let nonTriggeringExamples = [
        Example("""
        // Query (read only) - CORRECT ✅
        func getOrders() async throws -> [Order] {
            return try await repository.fetch()  // No mutations
        }
        """),
        
        Example("""
        // Command (write only) - CORRECT ✅
        func createOrder(_ order: Order) async throws -> OrderID {
            return try await repository.save(order)  // Returns only ID
        }
        """),
        
        Example("""
        // Separate Command and Query - CORRECT ✅
        func saveUser(_ user: User) async throws {
            try await repository.save(user)
        }
        
        func getUser(id: UUID) async throws -> User {
            return try await repository.fetch(id)
        }
        """)
    ]
    
    private static let triggeringExamples = [
        Example("""
        // Query with side effects - VIOLATION ❌
        func ↓getOrders() async throws -> [Order] {
            let orders = try await repository.fetch()
            self.cachedOrders = orders  // Side effect!
            return orders
        }
        """),
        
        Example("""
        // Command returning data - VIOLATION ❌
        func ↓createOrder(_ order: Order) async throws -> Order {
            let saved = try await repository.save(order)
            return saved  // Should only return ID
        }
        """)
    ]
}

