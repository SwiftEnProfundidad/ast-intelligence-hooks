// ═══════════════════════════════════════════════════════════════
// DDD Pattern Matcher - Domain Model Validator
// ═══════════════════════════════════════════════════════════════
// Detects DDD anti-patterns: Anemic models, missing value objects, etc.

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct DDDPatternMatcher: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "ddd_pattern_validation",
        name: "DDD - Domain Model Patterns",
        description: "Domain entities should have behavior, not just data (avoid anemic models)",
        kind: .lint,
        nonTriggeringExamples: DDDPatternMatcher.nonTriggeringExamples,
        triggeringExamples: DDDPatternMatcher.triggeringExamples
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        let filePath = file.path ?? ""
        
        // Only check Domain layer
        guard filePath.contains("/Domain/") else {
            return []
        }
        
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        return detectAnemicModels(in: structure.dictionary, file: file)
    }
    
    // MARK: - Anemic Model Detection
    
    private func detectAnemicModels(in dict: SourceKittenDict, file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        dict.walkSubstructure { substructure in
            guard let kind = substructure.kind,
                  (kind == SwiftDeclarationKind.struct.rawValue || 
                   kind == SwiftDeclarationKind.class.rawValue),
                  let offset = substructure.offset,
                  let name = substructure.name else { return }
            
            // Skip if in /ValueObjects/ or /Entities/ (likely DTOs)
            let filePath = file.path ?? ""
            if filePath.contains("/DTO") || filePath.contains("/Response") {
                return  // DTOs are allowed to be anemic
            }
            
            // Count properties vs methods
            let properties = substructure.substructure.filter { sub in
                sub.kind == SwiftDeclarationKind.varInstance.rawValue ||
                sub.kind == SwiftDeclarationKind.varStatic.rawValue
            }
            
            let methods = substructure.substructure.filter { sub in
                sub.kind == SwiftDeclarationKind.functionMethodInstance.rawValue ||
                sub.kind == SwiftDeclarationKind.functionMethodStatic.rawValue
            }
            
            // Filter out computed properties (they count as behavior)
            let storedProperties = properties.filter { prop in
                !isComputedProperty(prop, file: file)
            }
            
            // Anemic if: >3 properties AND no business methods
            let propertyCount = storedProperties.count
            let methodCount = methods.filter { !isInitializer($0) }.count
            
            if propertyCount > 3 && methodCount == 0 {
                let message = """
                Anemic Domain Model: '\(name)' has \(propertyCount) properties but no behavior.
                
                DDD Anti-Pattern: Anemic Domain Model
                Problem: Data structures without business logic
                
                Current structure:
                - Properties: \(propertyCount)
                - Business methods: 0
                
                DDD Rich Model (CORRECT):
                
                struct Order {
                    private(set) var items: [OrderItem]
                    private(set) var status: OrderStatus
                    private(set) var total: Money
                    
                    // ✅ BUSINESS LOGIC in domain model
                    mutating func addItem(_ item: OrderItem) throws {
                        guard status == .draft else {
                            throw OrderError.cannotModifySubmittedOrder
                        }
                        items.append(item)
                        recalculateTotal()
                    }
                    
                    mutating func submit() throws {
                        guard !items.isEmpty else {
                            throw OrderError.emptyOrder
                        }
                        guard total >= Money.minimumOrderAmount else {
                            throw OrderError.belowMinimumAmount
                        }
                        status = .submitted
                    }
                    
                    private mutating func recalculateTotal() {
                        total = items.reduce(Money.zero) { $0 + $1.price }
                    }
                }
                
                Benefits of Rich Models:
                - Business rules in one place
                - Invariants enforced
                - Harder to misuse
                - Self-documenting
                
                Note: If this is a Value Object or DTO, move to appropriate folder.
                """
                
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file, byteOffset: offset),
                    reason: message
                ))
            }
        }
        
        return violations
    }
    
    // MARK: - Helpers
    
    private func isComputedProperty(_ dict: SourceKittenDict, file: SwiftLintFile) -> Bool {
        // Computed properties have getters/setters
        guard let bodyOffset = dict.bodyOffset,
              let bodyLength = dict.bodyLength else {
            return false
        }
        
        let body = file.stringView.substringWithByteRange(
            start: bodyOffset,
            length: bodyLength
        ) ?? ""
        
        return body.contains("get") || body.contains("return")
    }
    
    private func isInitializer(_ dict: SourceKittenDict) -> Bool {
        return dict.name == "init"
    }
    
    // MARK: - Examples
    
    private static let nonTriggeringExamples = [
        Example("""
        // Rich Domain Model (CORRECT)
        struct Order {
            private(set) var items: [OrderItem]
            private(set) var status: OrderStatus
            
            mutating func addItem(_ item: OrderItem) throws {
                guard status == .draft else {
                    throw OrderError.cannotModifySubmittedOrder
                }
                items.append(item)
            }
            
            mutating func submit() throws {
                guard !items.isEmpty else {
                    throw OrderError.emptyOrder
                }
                status = .submitted
            }
        }
        """),
        
        Example("""
        // Value Object (allowed to be data-only)
        struct Money: Equatable {
            let amount: Decimal
            let currency: Currency
        }
        """)
    ]
    
    private static let triggeringExamples = [
        Example("""
        // Anemic Model (anti-pattern)
        struct ↓Order {
            var items: [OrderItem]
            var status: OrderStatus
            var total: Money
            var customer: Customer
            // NO business logic - just a data bag ❌
        }
        
        // Logic scattered in services instead of domain
        class OrderService {
            func addItem(to order: Order, item: OrderItem) {
                // Business logic OUTSIDE domain model ❌
            }
        }
        """)
    ]
}

