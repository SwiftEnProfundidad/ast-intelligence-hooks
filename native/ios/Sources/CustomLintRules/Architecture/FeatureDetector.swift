// ═══════════════════════════════════════════════════════════════
// Feature-First Architecture - Structure Validator
// ═══════════════════════════════════════════════════════════════
// Detects files not organized by feature (anti-pattern: technical grouping)
// Enforces: Features/ instead of ViewModels/, Services/, etc.

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct FeatureDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "feature_first_structure",
        name: "Feature-First Architecture",
        description: "Files should be organized by feature, not by technical type",
        kind: .lint,
        nonTriggeringExamples: FeatureDetector.nonTriggeringExamples,
        triggeringExamples: FeatureDetector.triggeringExamples
    )
    
    public init() {}
    
    // Technical folders (anti-pattern)
    private let technicalFolders = [
        "ViewModels", "Services", "Managers", "Controllers",
        "Helpers", "Utilities", "Models", "Views"
    ]
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        let filePath = file.path ?? ""
        
        // Check if file is in technical folder
        for technicalFolder in technicalFolders {
            if filePath.contains("/\(technicalFolder)/") {
                // Check if NOT in allowed locations (Infrastructure, Shared)
                if !filePath.contains("/Infrastructure/") &&
                   !filePath.contains("/Shared/") &&
                   !filePath.contains("/Domain/Entities/") &&  // Domain entities OK
                   !filePath.contains("/Tests/") {
                    
                    let message = """
                    Feature-First violation: File in technical folder '/\(technicalFolder)/'
                    
                    Anti-Pattern: Grouping by technical type
                    ❌ /ViewModels/OrderViewModel.swift
                    ❌ /ViewModels/UserViewModel.swift
                    ❌ /Services/OrderService.swift
                    ❌ /Services/UserService.swift
                    
                    Problem:
                    - Related code scattered across folders
                    - Hard to find all code for a feature
                    - Violates feature cohesion
                    
                    Feature-First Pattern (CORRECT):
                    ✅ /Features/Orders/
                        ├── OrdersView.swift
                        ├── OrdersViewModel.swift
                        ├── OrdersRepository.swift
                        └── Models/Order.swift
                    
                    ✅ /Features/Users/
                        ├── UsersView.swift
                        ├── UsersViewModel.swift
                        └── UsersRepository.swift
                    
                    Benefits:
                    - Feature cohesion (all related code together)
                    - Easy to find code
                    - Easy to delete features
                    - Clear feature boundaries
                    
                    Refactor:
                    Move '\(filePath.components(separatedBy: "/").last ?? "file")'
                    To: /Features/<FeatureName>/
                    
                    Allowed technical folders:
                    - /Infrastructure/ (shared infrastructure)
                    - /Shared/ (shared utilities)
                    - /Domain/Entities/ (domain models)
                    """
                    
                    return [StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file, byteOffset: 0),
                        reason: message
                    )]
                }
            }
        }
        
        return []
    }
    
    // MARK: - Examples
    
    private static let nonTriggeringExamples = [
        Example("""
        // Features/Orders/OrdersViewModel.swift
        import Foundation
        
        class OrdersViewModel: ObservableObject {
            // Feature-first organization ✅
        }
        """),
        
        Example("""
        // Features/Users/UserProfile/ProfileView.swift
        import SwiftUI
        
        struct ProfileView: View {
            // Nested features ✅
        }
        """),
        
        Example("""
        // Infrastructure/Network/APIClient.swift
        import Foundation
        
        class APIClient {
            // Shared infrastructure ✅
        }
        """)
    ]
    
    private static let triggeringExamples = [
        Example("""
        // ↓ViewModels/OrdersViewModel.swift
        import Foundation
        
        class OrdersViewModel: ObservableObject {
            // Technical grouping (anti-pattern) ❌
        }
        """),
        
        Example("""
        // ↓Services/OrderService.swift
        import Foundation
        
        class OrderService {
            // Should be in Features/Orders/ ❌
        }
        """)
    ]
}

