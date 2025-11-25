// ═══════════════════════════════════════════════════════════════
// Architecture - Repository Protocol Rule
// ═══════════════════════════════════════════════════════════════
// Repositories must have protocol abstraction (Dependency Inversion)

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct RepositoryProtocolRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "architecture_repository_protocol",
        name: "Architecture - Repository Protocol Abstraction",
        description: "Concrete repositories must implement protocol (DIP - Dependency Inversion)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            protocol UserRepositoryProtocol {
                func fetchUser(id: UUID) async throws -> User
            }
            
            final class UserRepository: UserRepositoryProtocol {
                func fetchUser(id: UUID) async throws -> User {
                    // Implementation
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            final class ↓UserRepository {
                func fetchUser(id: UUID) async throws -> User {
                    // No protocol
                }
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let filePath = file.path ?? ""
        
        guard filePath.contains("Repository.swift") &&
              !filePath.contains("Protocol.swift") else { return [] }
        
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        structure.dictionary.walkSubstructure { substructure in
            guard let kind = substructure.kind,
                  kind == SwiftDeclarationKind.class.rawValue,
                  let name = substructure.name,
                  name.contains("Repository"),
                  let offset = substructure.offset else { return }
            
            let inheritedTypes = substructure.inheritedTypes ?? []
            let hasProtocol = inheritedTypes.contains { $0.contains("Protocol") }
            
            if !hasProtocol {
                let message = """
                🚨 HIGH: Repository Without Protocol
                
                Repository: \(name)
                
                Dependency Inversion Principle:
                
                RULE: Depend on abstractions, not concretions
                
                CURRENT (VIOLATION):
                ```swift
                // ❌ Concrete class, no abstraction
                final class UserRepository {
                    func fetchUser(id: UUID) async throws -> User {
                        // Firebase implementation
                    }
                }
                
                // UseCase depends on CONCRETE class
                final class FetchUserUseCase {
                    private let repository: UserRepository  // ❌ Tight coupling
                }
                
                // Problems:
                // - Cannot mock for testing
                // - Cannot swap implementations
                // - Hard to change data source
                ```
                
                CORRECT (DIP):
                ```swift
                // ✅ Protocol abstraction
                protocol UserRepositoryProtocol {
                    func fetchUser(id: UUID) async throws -> User
                }
                
                // Implementation
                final class UserRepository: UserRepositoryProtocol {
                    func fetchUser(id: UUID) async throws -> User {
                        // Firebase implementation
                    }
                }
                
                // UseCase depends on PROTOCOL
                final class FetchUserUseCase {
                    private let repository: UserRepositoryProtocol  // ✅ Abstraction
                    
                    init(repository: UserRepositoryProtocol) {
                        self.repository = repository
                    }
                }
                ```
                
                BENEFITS:
                
                1. Testability:
                ```swift
                final class MockUserRepository: UserRepositoryProtocol {
                    func fetchUser(id: UUID) async throws -> User {
                        return User(id: id, name: "Test")  // ✅ Mock
                    }
                }
                
                func testFetchUser() async {
                    let useCase = FetchUserUseCase(
                        repository: MockUserRepository()  // ✅ Inject mock
                    )
                    
                    let user = try await useCase.execute(id: testId)
                    XCTAssertEqual(user.name, "Test")
                }
                ```
                
                2. Flexibility:
                ```swift
                // Switch data source without changing UseCase
                let repository: UserRepositoryProtocol = useFirebase ?
                    FirebaseUserRepository() :
                    LocalUserRepository()
                ```
                
                3. Multiple Implementations:
                ```swift
                protocol UserRepositoryProtocol { }
                
                final class FirebaseUserRepository: UserRepositoryProtocol { }
                final class CoreDataUserRepository: UserRepositoryProtocol { }
                final class InMemoryUserRepository: UserRepositoryProtocol { }
                final class RemoteAPIUserRepository: UserRepositoryProtocol { }
                
                // Choose at runtime or DI configuration
                ```
                
                DEPENDENCY INJECTION:
                ```swift
                // Protocol
                protocol UserRepositoryProtocol {
                    func fetchUser(id: UUID) async throws -> User
                }
                
                // Implementation
                final class UserRepository: UserRepositoryProtocol {
                    // Real implementation
                }
                
                // Environment (SwiftUI)
                extension EnvironmentValues {
                    var userRepository: UserRepositoryProtocol {
                        get { self[UserRepositoryKey.self] }
                        set { self[UserRepositoryKey.self] = newValue }
                    }
                }
                
                // Usage
                @Environment(\\.userRepository) var repository
                ```
                
                PROTOCOL NAMING:
                ✅ UserRepositoryProtocol (explicit)
                ✅ UserRepositoryType (type suffix)
                ✅ UserRepositorying (gerund)
                ❌ IUserRepository (C# style, not Swift)
                
                This is a HIGH architecture issue.
                Add protocol abstraction for testability.
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

