// ═══════════════════════════════════════════════════════════════
// God Class Detection (>500 lines)
// ═══════════════════════════════════════════════════════════════
// Detects classes/structs with too many lines (violates SRP)
// Rule: Classes should be < 500 lines

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct GodClassDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "no_god_class",
        name: "No God Classes (>500 lines)",
        description: "Classes/structs should be < 500 lines. Split into smaller, focused types.",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            // Small, focused class (CORRECT)
            class OrderViewModel {  // ~150 lines
                // Single responsibility
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            // God class (VIOLATION)
            class ↓MassiveViewController {
                // 800 lines of mixed responsibilities ❌
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
                  (kind == SwiftDeclarationKind.class.rawValue || 
                   kind == SwiftDeclarationKind.struct.rawValue),
                  let offset = substructure.offset,
                  let bodyLength = substructure.bodyLength,
                  let name = substructure.name else { return }
            
            // Calculate line count from byte length (approximate)
            let lineCount = bodyLength / 40  // Rough estimate: ~40 bytes per line
            
            if lineCount > 500 {
                let message = """
                God Class: '\(name)' has ~\(lineCount) lines (limit: 500)
                
                Problem: Large classes violate Single Responsibility Principle
                
                God Class symptoms:
                - Too many responsibilities
                - Hard to understand
                - Hard to test
                - High coupling
                - Frequent changes
                
                Refactor strategies:
                
                1. Extract collaborators:
                   // BEFORE: MassiveViewController (800 lines)
                   
                   // AFTER:
                   class OrdersViewController {}      // 150 lines
                   class OrdersViewModel {}           // 200 lines
                   class OrdersDataSource {}          // 150 lines
                   class OrdersCoordinator {}         // 100 lines
                
                2. Move logic to domain:
                   // Business logic → UseCases
                   // Data access → Repositories
                
                3. Extract view components:
                   // Large view → Smaller subviews
                
                4. Use composition:
                   // Inheritance → Protocol composition
                
                Benefits of smaller classes:
                - Easier to understand
                - Easier to test
                - Lower coupling
                - Better reusability
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
}
