// ═══════════════════════════════════════════════════════════════
// Architecture - Domain Purity Rule
// ═══════════════════════════════════════════════════════════════
// Domain layer must have ZERO framework dependencies

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct DomainPurityRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "architecture_domain_purity",
        name: "Architecture - Domain Layer Purity",
        description: "Domain layer must not import UIKit, SwiftUI, or other frameworks (Clean Architecture)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            // Domain/Entities/User.swift
            import Foundation  // ✅ OK (standard library)
            
            struct User {
                let id: UUID
                let name: String
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            // Domain/Entities/User.swift
            ↓import UIKit  // ❌ Framework dependency in Domain!
            
            struct User {
                let avatar: UIImage
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let filePath = file.path ?? ""
        
        let isDomainLayer = filePath.contains("/Domain/") ||
                           filePath.contains("/domain/") ||
                           filePath.contains("Domain.swift") ||
                           filePath.contains("/Entities/") ||
                           filePath.contains("/UseCases/") ||
                           filePath.contains("/Repositories/") &&
                           !filePath.contains("Implementation")
        
        guard isDomainLayer else { return [] }
        
        let forbiddenImports: [(framework: String, reason: String, alternative: String)] = [
            ("UIKit", "UI framework", "Use protocol/typealias in Domain, concrete type in Presentation"),
            ("SwiftUI", "UI framework", "Domain should be UI-agnostic"),
            ("Combine", "Reactive framework", "Use protocols or async/await in Domain"),
            ("Alamofire", "Networking library", "Use URLSession protocol in Domain"),
            ("SDWebImage", "Image loading library", "Use Data/URL in Domain"),
            ("Kingfisher", "Image loading library", "Use Data/URL in Domain"),
            ("RealmSwift", "Database framework", "Use Repository protocol in Domain"),
            ("CoreData", "Database framework", "Use Repository protocol in Domain"),
            ("Firebase", "Third-party SDK", "Abstract behind Repository"),
            ("Supabase", "Third-party SDK", "Abstract behind Repository"),
            ("AppKit", "macOS UI framework", "Domain should be platform-agnostic"),
        ]
        
        let contents = file.contents
        let lines = contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            let trimmedLine = line.trimmingCharacters(in: .whitespaces)
            
            guard trimmedLine.hasPrefix("import ") else { continue }
            
            for (framework, reason, alternative) in forbiddenImports {
                if trimmedLine.contains("import \(framework)") {
                    let byteOffset = ByteCount(contents.prefix(through: contents.index(contents.startIndex, offsetBy: contents.distance(from: contents.startIndex, to: contents.range(of: line)?.lowerBound ?? contents.startIndex))).utf8.count)
                    
                    let message = """
                    🚨 CRITICAL: Domain Layer Violation
                    
                    File: \(filePath)
                    Import: \(framework)
                    Reason: \(reason)
                    
                    Clean Architecture - Domain Layer Rules:
                    
                    DEPENDENCY RULE:
                    Domain → NOTHING
                    Application → Domain
                    Infrastructure → Domain
                    Presentation → Domain
                    
                    Domain layer is the CORE of your app:
                    ✅ Business rules
                    ✅ Entities
                    ✅ Use Cases
                    ✅ Repository interfaces
                    ✅ Value Objects
                    
                    Domain layer must NOT depend on:
                    ❌ UI frameworks (UIKit, SwiftUI)
                    ❌ Networking libraries (Alamofire)
                    ❌ Databases (CoreData, Realm)
                    ❌ Third-party SDKs (Firebase)
                    ❌ Platform-specific code
                    
                    WHY?
                    1. Testability: Domain logic testable without UI
                    2. Portability: Reuse domain in iOS, macOS, watchOS
                    3. Independence: Change UI without touching business logic
                    4. Longevity: Domain code survives framework changes
                    
                    CURRENT (WRONG):
                    ```swift
                    // Domain/Entities/User.swift
                    import UIKit  // ❌ VIOLATION
                    
                    struct User {
                        let id: UUID
                        let name: String
                        let avatar: UIImage  // ❌ UI type in Domain
                    }
                    ```
                    
                    SOLUTION (\(alternative)):
                    
                    Option 1 (Protocol):
                    ```swift
                    // Domain/Entities/User.swift
                    import Foundation  // ✅ OK
                    
                    struct User {
                        let id: UUID
                        let name: String
                        let avatarData: Data  // ✅ Platform-agnostic
                    }
                    
                    // Presentation/Extensions/User+UI.swift
                    import UIKit
                    
                    extension User {
                        var avatarImage: UIImage? {
                            UIImage(data: avatarData)
                        }
                    }
                    ```
                    
                    Option 2 (Repository Pattern):
                    ```swift
                    // Domain/Repositories/UserRepository.swift
                    protocol UserRepositoryProtocol {
                        func fetchUser(id: UUID) async throws -> User
                    }
                    
                    // Infrastructure/Repositories/UserRepository.swift
                    import Firebase  // ✅ OK in Infrastructure
                    
                    final class UserRepository: UserRepositoryProtocol {
                        func fetchUser(id: UUID) async throws -> User {
                            // Firebase implementation
                        }
                    }
                    ```
                    
                    Option 3 (Dependency Inversion):
                    ```swift
                    // Domain/Services/ImageLoadingService.swift
                    protocol ImageLoadingServiceProtocol {
                        func loadImage(from url: URL) async throws -> Data
                    }
                    
                    // Infrastructure/Services/ImageLoadingService.swift
                    import Kingfisher  // ✅ OK in Infrastructure
                    
                    final class ImageLoadingService: ImageLoadingServiceProtocol {
                        func loadImage(from url: URL) async throws -> Data {
                            // Kingfisher implementation
                        }
                    }
                    ```
                    
                    ALLOWED IN DOMAIN:
                    ✅ Foundation (Standard library)
                    ✅ Swift standard library
                    ✅ Custom protocols
                    ✅ Pure Swift types
                    
                    TESTING BENEFIT:
                    ```swift
                    // DomainTests/CreateUserUseCaseTests.swift
                    func testCreateUser() async throws {
                        // ✅ No UIKit needed for test!
                        let useCase = CreateUserUseCase(
                            repository: MockUserRepository()
                        )
                        
                        let user = try await useCase.execute(
                            name: "Test",
                            email: "test@test.com"
                        )
                        
                        XCTAssertEqual(user.name, "Test")
                    }
                    ```
                    
                    REAL-WORLD EXAMPLE:
                    
                    Bad (Coupled):
                    ```swift
                    // Domain/UseCases/UpdateProfileUseCase.swift
                    import UIKit  // ❌
                    
                    struct UpdateProfileUseCase {
                        func execute(avatar: UIImage) async throws {
                            // Tightly coupled to iOS
                        }
                    }
                    ```
                    
                    Good (Decoupled):
                    ```swift
                    // Domain/UseCases/UpdateProfileUseCase.swift
                    import Foundation  // ✅
                    
                    struct UpdateProfileUseCase {
                        private let repository: UserRepositoryProtocol
                        
                        func execute(avatarData: Data) async throws {
                            try await repository.updateAvatar(avatarData)
                        }
                    }
                    ```
                    
                    Uncle Bob's Advice:
                    "The business rules should not know anything about the UI.
                     They should not depend on the UI framework."
                    
                    This is a CRITICAL architecture violation.
                    Refactor IMMEDIATELY for maintainability.
                    """
                    
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file, byteOffset: byteOffset),
                        reason: message
                    ))
                }
            }
        }
        
        return violations
    }
}

