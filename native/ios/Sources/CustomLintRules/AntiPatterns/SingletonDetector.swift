// ═══════════════════════════════════════════════════════════════
// Anti-Pattern: Singleton Detection
// ═══════════════════════════════════════════════════════════════
// Detects singleton pattern usage (violates DIP, hard to test)
// Rule: NO static let shared, inject dependencies instead

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct SingletonDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "no_singleton_pattern",
        name: "Anti-Pattern - No Singletons",
        description: "Singletons violate DIP and are hard to test. Use Dependency Injection instead.",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            // Dependency Injection (CORRECT)
            class OrderViewModel {
                private let repository: OrdersRepositoryProtocol
                
                init(repository: OrdersRepositoryProtocol) {
                    self.repository = repository
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            // Singleton (VIOLATION)
            class ↓OrderService {
                static let shared = OrderService()
                private init() {}
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        var violations: [StyleViolation] = []
        
        structure.dictionary.walkSubstructure { substructure in
            guard let kind = substructure.kind,
                  kind == SwiftDeclarationKind.varStatic.rawValue,
                  let offset = substructure.offset,
                  let name = substructure.name else { return }
            
            // Check if name is "shared", "sharedInstance", "default", "instance"
            let singletonNames = ["shared", "sharedInstance", "default", "instance"]
            
            if singletonNames.contains(name.lowercased()) {
                let message = """
                Singleton detected: 'static let \(name)'
                
                Anti-Pattern: Singletons violate Dependency Inversion Principle
                
                Problems:
                - Hard to test (can't inject mocks)
                - Hidden dependencies
                - Global state
                - Thread safety issues
                - Impossible to have multiple instances
                
                Refactor to Dependency Injection:
                
                // BEFORE (Singleton):
                class OrderService {
                    static let shared = OrderService()
                    private init() {}
                }
                
                // Usage:
                OrderService.shared.fetchOrders()  // ❌
                
                // AFTER (DI):
                protocol OrderServiceProtocol {
                    func fetchOrders() async throws -> [Order]
                }
                
                class OrderService: OrderServiceProtocol {
                    init() {}  // Normal initializer
                }
                
                // Inject in ViewModel:
                class OrdersViewModel {
                    private let orderService: OrderServiceProtocol
                    
                    init(orderService: OrderServiceProtocol) {
                        self.orderService = orderService
                    }
                }
                
                Benefits:
                - Testable (inject fake service)
                - Explicit dependencies
                - Multiple instances possible
                - No global state
                """
                
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .error,
                    location: Location(file: file, byteOffset: offset),
                    reason: message
                ))
            }
        }
        
        return violations
    }
}

