// ═══════════════════════════════════════════════════════════════
// Architecture - Interactor Purity Rule (VIPER)
// ═══════════════════════════════════════════════════════════════
// Interactors must not import UI frameworks (VIPER architecture)

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct InteractorPurityRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "architecture_interactor_purity",
        name: "Architecture - Interactor Purity (VIPER)",
        description: "Interactors must not import UI frameworks (VIPER business logic)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            import Foundation
            
            protocol UserInteractorProtocol {
                func fetchUser(id: UUID) async throws -> User
            }
            
            final class UserInteractor: UserInteractorProtocol {
                func fetchUser(id: UUID) async throws -> User {
                    // Business logic only
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            ↓import UIKit
            
            final class UserInteractor {
                var displayController: UIViewController?
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let filePath = file.path ?? ""
        
        let isInteractor = filePath.contains("Interactor.swift") ||
                          filePath.contains("/Interactors/") ||
                          filePath.contains("/UseCases/")
        
        guard isInteractor else { return [] }
        
        let contents = file.contents
        let lines = contents.components(separatedBy: .newlines)
        
        let forbiddenImports: [(framework: String, reason: String)] = [
            ("UIKit", "UI framework in business logic"),
            ("SwiftUI", "SwiftUI in business logic"),
            ("AppKit", "macOS UI in business logic"),
        ]
        
        for (_, line) in lines.enumerated() {
            let trimmedLine = line.trimmingCharacters(in: .whitespaces)
            guard trimmedLine.hasPrefix("import ") else { continue }
            
            for (framework, reason) in forbiddenImports {
                if trimmedLine.contains("import \(framework)") {
                    let byteOffset = ByteCount(contents.prefix(through: contents.index(contents.startIndex, offsetBy: contents.distance(from: contents.startIndex, to: contents.range(of: line)?.lowerBound ?? contents.startIndex))).utf8.count)
                    
                    let message = """
                    🚨 CRITICAL: Interactor Purity Violation (VIPER)
                    
                    File: \(filePath)
                    Import: \(framework)
                    Reason: \(reason)
                    
                    VIPER Architecture - Interactor Rules:
                    
                    VIPER LAYERS:
                    View ← Presenter ← Interactor ← Entity
                                  ↓
                               Router
                    
                    INTERACTOR RESPONSIBILITIES:
                    ✅ Business logic execution
                    ✅ Data manipulation
                    ✅ Use Case orchestration
                    ✅ Repository communication
                    ✅ Entity transformation
                    
                    INTERACTOR MUST NOT:
                    ❌ Import UI frameworks
                    ❌ Know about View/Presenter
                    ❌ Handle navigation
                    ❌ Create UI components
                    ❌ Format for display
                    
                    WHY VIPER?
                    - Testability: Pure business logic
                    - Reusability: Share across platforms
                    - Independence: Change UI without touching logic
                    - Single Responsibility: Each layer one job
                    
                    CURRENT (VIOLATION):
                    ```swift
                    import UIKit  // ❌
                    
                    final class UserInteractor {
                        func loadUser() {
                            // Business logic...
                            
                            // Show alert
                            let alert = UIAlertController(...)  // ❌ UI in Interactor!
                        }
                    }
                    ```
                    
                    CORRECT (VIPER):
                    ```swift
                    import Foundation  // ✅
                    
                    protocol UserInteractorOutput: AnyObject {
                        func didLoadUser(_ user: User)
                        func didFailLoading(error: Error)
                    }
                    
                    final class UserInteractor {
                        weak var output: UserInteractorOutput?
                        private let repository: UserRepositoryProtocol
                        
                        func loadUser() {
                            do {
                                let user = try await repository.fetch()
                                output?.didLoadUser(user)  // ✅ Data only
                            } catch {
                                output?.didFailLoading(error: error)
                            }
                        }
                    }
                    
                    // Presenter handles UI
                    final class UserPresenter: UserInteractorOutput {
                        weak var view: UserViewProtocol?
                        
                        func didLoadUser(_ user: User) {
                            let viewModel = UserViewModel(user: user)
                            view?.display(viewModel)  // ✅ Presenter → View
                        }
                        
                        func didFailLoading(error: Error) {
                            view?.showError(message: error.localizedDescription)
                        }
                    }
                    ```
                    
                    TESTING BENEFIT:
                    ```swift
                    final class UserInteractorTests: XCTestCase {
                        func testLoadUser() async {
                            // ✅ No UI needed
                            let mockRepository = MockUserRepository()
                            let mockOutput = MockInteractorOutput()
                            
                            let interactor = UserInteractor(
                                repository: mockRepository
                            )
                            interactor.output = mockOutput
                            
                            await interactor.loadUser()
                            
                            // Pure logic test
                            XCTAssertTrue(mockOutput.didLoadUserCalled)
                        }
                    }
                    
                    // Fast: <1ms
                    // No UIKit initialization
                    ```
                    
                    VIPER FLOW:
                    ```
                    User Tap
                       ↓
                    View → Presenter
                              ↓
                         Interactor (Business Logic)
                              ↓
                         Repository (Data)
                              ↓
                         Entity (Model)
                              ↓
                         Interactor (Transform)
                              ↓
                         Presenter (Format)
                              ↓
                         View (Display)
                    ```
                    
                    INTERACTOR PROTOCOLS:
                    ```swift
                    // Input: From Presenter
                    protocol UserInteractorInput {
                        func fetchUser(id: UUID)
                        func updateUser(_ user: User)
                        func deleteUser(id: UUID)
                    }
                    
                    // Output: To Presenter
                    protocol UserInteractorOutput: AnyObject {
                        func didFetchUser(_ user: User)
                        func didUpdateUser()
                        func didDeleteUser()
                        func didFail(error: Error)
                    }
                    
                    // Interactor implements Input
                    final class UserInteractor: UserInteractorInput {
                        weak var output: UserInteractorOutput?
                        
                        // Pure business logic
                    }
                    ```
                    
                    COMPARISON WITH MVC:
                    
                    MVC (Massive View Controller):
                    ```swift
                    class UserViewController: UIViewController {
                        func loadUser() {
                            // UI setup ✅
                            // Business logic ❌
                            // Data fetching ❌
                            // Navigation ❌
                            // All in one place → 1000+ lines
                        }
                    }
                    ```
                    
                    VIPER (Separated):
                    ```swift
                    View: 100 lines (Display only)
                    Presenter: 150 lines (Coordination)
                    Interactor: 200 lines (Business logic) ✅
                    Entity: 50 lines (Data model)
                    Router: 100 lines (Navigation)
                    
                    Total: 600 lines BUT each testable independently
                    ```
                    
                    REAL-WORLD EXAMPLE:
                    
                    E-commerce Checkout:
                    ```swift
                    // ❌ BAD (Interactor with UI)
                    import UIKit
                    
                    final class CheckoutInteractor {
                        func processPayment() {
                            // Validate card
                            // Process payment
                            
                            // Show success alert
                            let alert = UIAlertController(...)  // ❌
                        }
                    }
                    ```
                    
                    ```swift
                    // ✅ GOOD (Pure business logic)
                    import Foundation
                    
                    final class CheckoutInteractor {
                        weak var output: CheckoutInteractorOutput?
                        private let paymentGateway: PaymentGatewayProtocol
                        private let orderRepository: OrderRepositoryProtocol
                        
                        func processPayment(card: CreditCard, amount: Money) async {
                            do {
                                // Validate
                                try validateCard(card)
                                try validateAmount(amount)
                                
                                // Process
                                let transaction = try await paymentGateway.charge(
                                    card: card,
                                    amount: amount
                                )
                                
                                // Save order
                                let order = Order(transaction: transaction)
                                try await orderRepository.save(order)
                                
                                // Notify Presenter
                                output?.paymentSucceeded(order: order)
                            } catch {
                                output?.paymentFailed(error: error)
                            }
                        }
                        
                        private func validateCard(_ card: CreditCard) throws {
                            guard card.isValid else {
                                throw PaymentError.invalidCard
                            }
                        }
                        
                        private func validateAmount(_ amount: Money) throws {
                            guard amount.value > 0 else {
                                throw PaymentError.invalidAmount
                            }
                        }
                    }
                    
                    // Presenter handles UI
                    final class CheckoutPresenter: CheckoutInteractorOutput {
                        func paymentSucceeded(order: Order) {
                            view?.showSuccessScreen(orderId: order.id)
                            router?.navigateToOrderConfirmation(order: order)
                        }
                        
                        func paymentFailed(error: Error) {
                            view?.showError(message: error.userFriendlyMessage)
                        }
                    }
                    ```
                    
                    ALLOWED IN INTERACTOR:
                    ✅ Foundation
                    ✅ Domain layer (Entities)
                    ✅ Repository protocols
                    ✅ Business rule validation
                    ✅ Data transformation
                    ✅ async/await
                    
                    FORBIDDEN IN INTERACTOR:
                    ❌ UIKit/SwiftUI
                    ❌ View references
                    ❌ Presenter creation
                    ❌ Navigation logic
                    ❌ UI formatting
                    
                    VIPER is overkill for simple screens.
                    Use for complex business logic flows.
                    
                    This is a CRITICAL architecture violation.
                    Refactor to respect VIPER boundaries.
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
