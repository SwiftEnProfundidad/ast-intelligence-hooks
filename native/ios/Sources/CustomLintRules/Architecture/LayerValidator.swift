// ═══════════════════════════════════════════════════════════════
// Clean Architecture - Layer Boundary Validator
// ═══════════════════════════════════════════════════════════════
// Detects violations of layer dependencies in Clean Architecture
// Domain → Application → Infrastructure → Presentation
// Rule: Inner layers CANNOT depend on outer layers

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct LayerValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "clean_arch_layer_boundary",
        name: "Clean Architecture - Layer Boundaries",
        description: "Inner layers cannot depend on outer layers. Domain must be independent.",
        kind: .lint,
        nonTriggeringExamples: LayerValidator.nonTriggeringExamples,
        triggeringExamples: LayerValidator.triggeringExamples
    )
    
    public init() {}
    
    // Layer hierarchy (inner → outer)
    private enum Layer: Int {
        case domain = 1        // Core business logic
        case application = 2   // Use cases
        case infrastructure = 3 // External services, DB
        case presentation = 4   // UI, ViewModels
        
        var allowedDependencies: [Layer] {
            switch self {
            case .domain:
                return []  // Domain depends on NOTHING
            case .application:
                return [.domain]  // Application can use Domain
            case .infrastructure:
                return [.domain, .application]  // Infrastructure can use Domain + Application
            case .presentation:
                return [.domain, .application]  // Presentation can use Domain + Application (NOT Infrastructure directly)
            }
        }
    }
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        let filePath = file.path ?? ""
        
        // Determine current file's layer
        guard let currentLayer = detectLayer(from: filePath) else {
            return []  // Not in a recognized layer
        }
        
        // Analyze imports
        let imports = extractImports(from: file)
        var violations: [StyleViolation] = []
        
        for importStatement in imports {
            if let importedLayer = detectLayer(from: importStatement.module),
               !currentLayer.allowedDependencies.contains(importedLayer),
               importedLayer != currentLayer {  // Same layer OK
                
                let message = """
                Clean Architecture violation: \(currentLayer) → \(importedLayer)
                
                Layer Hierarchy (inner → outer):
                1. Domain (Core business logic)
                2. Application (Use cases)
                3. Infrastructure (External services)
                4. Presentation (UI)
                
                Current file: \(currentLayer) layer
                Importing from: \(importedLayer) layer
                
                Rule: Inner layers cannot depend on outer layers.
                
                Allowed dependencies for \(currentLayer):
                \(currentLayer.allowedDependencies.isEmpty ? "- NONE (independent)" : currentLayer.allowedDependencies.map { "- \($0)" }.joined(separator: "\n"))
                
                Problem: \(currentLayer) trying to import \(importedLayer)
                
                Solution:
                1. If \(importedLayer) has logic needed by \(currentLayer):
                   → Define protocol in \(currentLayer)
                   → Implement in \(importedLayer)
                   → Use Dependency Inversion (DIP)
                
                2. If importing UI from business logic:
                   → NEVER do this
                   → Business logic must be UI-independent
                
                Example (Domain needs data):
                // Domain/Repositories/OrdersRepositoryProtocol.swift
                protocol OrdersRepositoryProtocol {
                    func fetch() async throws -> [Order]
                }
                
                // Infrastructure/Repositories/OrdersRepository.swift
                class OrdersRepository: OrdersRepositoryProtocol {
                    // Implementation with Supabase/CoreData
                }
                """
                
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .error,
                    location: Location(file: file, byteOffset: importStatement.offset),
                    reason: message
                ))
            }
        }
        
        return violations
    }
    
    // MARK: - Helpers
    
    private func detectLayer(from path: String) -> Layer? {
        let lowercasedPath = path.lowercased()
        
        if lowercasedPath.contains("/domain/") {
            return .domain
        } else if lowercasedPath.contains("/application/") {
            return .application
        } else if lowercasedPath.contains("/infrastructure/") {
            return .infrastructure
        } else if lowercasedPath.contains("/presentation/") || 
                  lowercasedPath.contains("/viewmodel") ||
                  lowercasedPath.contains("/views/") {
            return .presentation
        }
        
        return nil
    }
    
    private struct Import {
        let module: String
        let offset: ByteCount
    }
    
    private func extractImports(from file: SwiftLintFile) -> [Import] {
        var imports: [Import] = []
        let contents = file.contents
        
        // Regex to match: import SomeModule
        let pattern = "^\\s*import\\s+([A-Za-z0-9_/]+)"
        
        guard let regex = try? NSRegularExpression(pattern: pattern, options: .anchorsMatchLines) else {
            return []
        }
        
        let nsString = contents as NSString
        let matches = regex.matches(in: contents, range: NSRange(location: 0, length: nsString.length))
        
        for match in matches {
            if match.numberOfRanges > 1 {
                let moduleRange = match.range(at: 1)
                let module = nsString.substring(with: moduleRange)
                
                imports.append(Import(
                    module: module,
                    offset: ByteCount(match.range.location)
                ))
            }
        }
        
        return imports
    }
    
    // MARK: - Examples
    
    private static let nonTriggeringExamples = [
        Example("""
        // Domain/Entities/Order.swift
        import Foundation
        
        struct Order {
            let id: UUID
            let items: [OrderItem]
        }
        // Domain has NO dependencies ✅
        """),
        
        Example("""
        // Application/UseCases/CreateOrderUseCase.swift
        import Foundation
        import Domain  // ← Application CAN use Domain ✅
        
        class CreateOrderUseCase {
            private let repository: OrdersRepositoryProtocol
        }
        """),
        
        Example("""
        // Presentation/ViewModels/OrdersViewModel.swift
        import Foundation
        import Domain       // ← Presentation CAN use Domain ✅
        import Application  // ← Presentation CAN use Application ✅
        
        class OrdersViewModel: ObservableObject {
            private let createOrder: CreateOrderUseCase
        }
        """)
    ]
    
    private static let triggeringExamples = [
        Example("""
        // Domain/Entities/Order.swift
        import Foundation
        ↓import Infrastructure  // ← VIOLATION: Domain depends on outer layer
        
        struct Order {
            let repository: OrdersRepository  // Domain knows about Infrastructure!
        }
        """),
        
        Example("""
        // Domain/UseCases/ProcessOrderUseCase.swift
        import Foundation
        ↓import Presentation  // ← VIOLATION: Domain depends on UI
        
        class ProcessOrderUseCase {
            func execute(viewModel: OrderViewModel) {  // Business logic coupled to UI!
            }
        }
        """),
        
        Example("""
        // Application/UseCases/CreateOrderUseCase.swift
        import Foundation
        ↓import Infrastructure  // ← VIOLATION: Application depends on Infrastructure
        
        class CreateOrderUseCase {
            private let repository = OrdersRepository()  // Concrete dependency!
        }
        """)
    ]
}

