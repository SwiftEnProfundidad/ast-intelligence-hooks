// ═══════════════════════════════════════════════════════════════
// DIP: Dependency Inversion Principle - Concrete Dependency Detector
// ═══════════════════════════════════════════════════════════════
// Detects high-level modules depending on concrete implementations
// Suggests protocol abstraction

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct DIPDependencyRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "solid_dip_dependency",
        name: "SOLID: DIP - Dependency Abstraction",
        description: "High-level modules should depend on protocols, not concrete types (DIP)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            // Depends on protocol (CORRECT)
            class OrderViewModel {
                private let repository: OrdersRepositoryProtocol  // ← Protocol
                
                init(repository: OrdersRepositoryProtocol) {
                    self.repository = repository
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            // Depends on concrete (VIOLATION)
            class ↓OrderViewModel {
                private let repository = OrdersRepository()  // ← Concrete
                
                // DIP violation: ViewModel knows about infrastructure detail
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        // Detect if file is high-level module
        let filePath = file.path ?? ""
        let isHighLevel = filePath.contains("/ViewModel") ||
                          filePath.contains("/UseCase") ||
                          filePath.contains("/Application/")
        
        guard isHighLevel else {
            return []  // Only check high-level modules
        }
        
        return detectViolations(in: structure.dictionary, file: file)
    }
    
    private func detectViolations(in dict: SourceKittenDict, file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        dict.walkSubstructure { substructure in
            guard let kind = substructure.kind,
                  kind == SwiftDeclarationKind.varInstance.rawValue,
                  let offset = substructure.offset,
                  let name = substructure.name,
                  let typeName = substructure.typeName else { return }
            
            // Check if property is concrete service/repository
            let isConcrete = (typeName.hasSuffix("Service") ||
                            typeName.hasSuffix("Repository") ||
                            typeName.hasSuffix("Manager") ||
                            typeName.hasSuffix("Client")) &&
                            !typeName.hasSuffix("Protocol")
            
            guard isConcrete else { return }
            
            let message = """
            Property '\(name): \(typeName)' depends on concrete type - violates DIP.
            
            DIP Principle: High-level should depend on abstractions, not details.
            
            Current:
            private let \(name): \(typeName)  // ← Concrete
            
            Refactor:
            1. Create protocol:
               protocol \(typeName)Protocol {
                   // Interface methods
               }
            
            2. Make concrete conform:
               class \(typeName): \(typeName)Protocol {
                   // Implementation
               }
            
            3. Inject protocol:
               private let \(name): \(typeName)Protocol  // ← Protocol
               
               init(\(name): \(typeName)Protocol) {
                   self.\(name) = \(name)
               }
            
            Benefits:
            - Testable (inject mocks)
            - Flexible (swap implementations)
            - Loosely coupled
            """
            
            violations.append(StyleViolation(
                ruleDescription: Self.description,
                severity: .error,
                location: Location(file: file, byteOffset: offset),
                reason: message
            ))
        }
        
        return violations
    }
}

