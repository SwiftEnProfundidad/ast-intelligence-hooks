// ═══════════════════════════════════════════════════════════════
// Architecture - UseCase Single Responsibility
// ═══════════════════════════════════════════════════════════════
// UseCases must have single responsibility (Clean Architecture)

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct UseCaseSRPRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "architecture_usecase_srp",
        name: "Architecture - UseCase SRP",
        description: "UseCases must have single public method (execute/call) - Single Responsibility",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            protocol CreateUserUseCaseProtocol {
                func execute(name: String, email: String) async throws -> User
            }
            
            final class CreateUserUseCase: CreateUserUseCaseProtocol {
                func execute(name: String, email: String) async throws -> User {
                    // One responsibility
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            final class ↓UserUseCase {
                func createUser() { }
                func updateUser() { }
                func deleteUser() { }
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let filePath = file.path ?? ""
        
        guard filePath.contains("UseCase.swift") else { return [] }
        
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        structure.dictionary.walkSubstructure { substructure in
            guard let kind = substructure.kind,
                  (kind == SwiftDeclarationKind.class.rawValue || kind == SwiftDeclarationKind.struct.rawValue),
                  let name = substructure.name,
                  name.contains("UseCase"),
                  let offset = substructure.offset else { return }
            
            var publicMethods: [String] = []
            
            substructure.walkSubstructure { methodStructure in
                guard let methodKind = methodStructure.kind,
                      methodKind == SwiftDeclarationKind.functionMethodInstance.rawValue,
                      let methodName = methodStructure.name else { return }
                
                let accessibility = methodStructure.accessibility ?? "internal"
                
                if accessibility == "public" || accessibility == "internal" {
                    if !methodName.starts(with: "init") && !methodName.starts(with: "deinit") {
                        publicMethods.append(methodName)
                    }
                }
            }
            
            if publicMethods.count > 1 {
                let message = """
                🚨 HIGH: UseCase with Multiple Responsibilities
                
                UseCase: \(name)
                Public Methods: \(publicMethods.joined(separator: ", "))
                Count: \(publicMethods.count)
                
                Single Responsibility Principle - UseCases:
                
                RULE: One UseCase = One Action
                
                WHY?
                - Easier to test
                - Easier to understand
                - Easier to modify
                - Better separation of concerns
                - Follows SOLID principles
                
                CURRENT (WRONG - God UseCase):
                ```swift
                final class UserUseCase {
                    func createUser() { }      // Action 1
                    func updateUser() { }      // Action 2
                    func deleteUser() { }      // Action 3
                    func fetchAllUsers() { }   // Action 4
                }
                
                // Problem: Too many responsibilities
                // Hard to test each action independently
                // Changes to one affect others
                ```
                
                CORRECT (SRP - Separate UseCases):
                ```swift
                // CreateUserUseCase.swift
                final class CreateUserUseCase {
                    private let repository: UserRepositoryProtocol
                    
                    func execute(name: String, email: String) async throws -> User {
                        try validateEmail(email)
                        return try await repository.create(name: name, email: email)
                    }
                    
                    private func validateEmail(_ email: String) throws {
                        // Validation logic
                    }
                }
                
                // UpdateUserUseCase.swift
                final class UpdateUserUseCase {
                    func execute(user: User) async throws {
                        // Update logic
                    }
                }
                
                // DeleteUserUseCase.swift
                final class DeleteUserUseCase {
                    func execute(userId: UUID) async throws {
                        // Delete logic
                    }
                }
                
                // FetchAllUsersUseCase.swift
                final class FetchAllUsersUseCase {
                    func execute() async throws -> [User] {
                        // Fetch logic
                    }
                }
                ```
                
                BENEFITS:
                - Each UseCase testable independently
                - Easy to modify one without affecting others
                - Clear naming: CreateUserUseCase vs UserUseCase
                - Follows Clean Architecture
                
                NAMING CONVENTIONS:
                ✅ VerbNounUseCase (CreateOrderUseCase)
                ✅ execute() or call() as main method
                ❌ NounUseCase (UserUseCase - too generic)
                ❌ Multiple public methods
                
                TESTING:
                ```swift
                func testCreateUser() async {
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
                
                DEPENDENCY INJECTION:
                ```swift
                final class CreateUserUseCase {
                    private let userRepository: UserRepositoryProtocol
                    private let emailValidator: EmailValidatorProtocol
                    private let eventBus: EventBusProtocol
                    
                    init(
                        userRepository: UserRepositoryProtocol,
                        emailValidator: EmailValidatorProtocol,
                        eventBus: EventBusProtocol
                    ) {
                        self.userRepository = userRepository
                        self.emailValidator = emailValidator
                        self.eventBus = eventBus
                    }
                    
                    func execute(name: String, email: String) async throws -> User {
                        try emailValidator.validate(email)
                        let user = try await userRepository.create(name: name, email: email)
                        await eventBus.publish(UserCreatedEvent(user: user))
                        return user
                    }
                }
                ```
                
                REFACTORING:
                
                Step 1: Identify responsibilities
                Step 2: Extract each to new UseCase
                Step 3: Update callers
                Step 4: Remove old god UseCase
                
                This is a HIGH architecture issue.
                Refactor to single-responsibility UseCases.
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

