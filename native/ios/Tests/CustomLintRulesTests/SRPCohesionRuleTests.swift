// ═══════════════════════════════════════════════════════════════
// SRP Cohesion Rule - Unit Tests
// ═══════════════════════════════════════════════════════════════

import XCTest
@testable import CustomLintRules
import SwiftLintCore
import SourceKittenFramework

final class SRPCohesionRuleTests: XCTestCase {
    
    // MARK: - makeSUT (System Under Test)
    
    private func makeSUT() -> SRPCohesionRule {
        return SRPCohesionRule()
    }
    
    // MARK: - Tests
    
    func test_highCohesion_noViolation() {
        let code = """
        class UserValidator {
            private let rules: [Rule]
            
            func validate(_ user: User) -> Bool {
                return rules.allSatisfy { $0.check(user) }
            }
            
            func formatErrors() -> String {
                return rules.map(\.errorMessage).joined()
            }
        }
        """
        
        let violations = validate(code)
        
        XCTAssertTrue(violations.isEmpty, "High cohesion class should have no violations")
    }
    
    func test_lowCohesion_triggersViolation() {
        let code = """
        class UserController {
            private let validator: Validator
            private let database: Database
            private let router: Router
            
            func validateUser() {
                validator.check()
            }
            
            func saveUser() {
                database.save()
            }
            
            func navigateToSettings() {
                router.push()
            }
        }
        """
        
        let violations = validate(code)
        
        XCTAssertFalse(violations.isEmpty, "Low cohesion class should trigger violation")
        XCTAssertTrue(violations[0].reason.contains("LCOM"), "Should mention LCOM metric")
        XCTAssertTrue(violations[0].reason.contains("responsibilities"), "Should mention responsibilities")
    }
    
    func test_singleResponsibility_noViolation() {
        let code = """
        struct OrderMapper {
            func toDTO(_ order: Order) -> OrderDTO {
                return OrderDTO(id: order.id)
            }
            
            func fromDTO(_ dto: OrderDTO) -> Order {
                return Order(id: dto.id)
            }
        }
        """
        
        let violations = validate(code)
        
        XCTAssertTrue(violations.isEmpty, "Single responsibility class should have no violations")
    }
    
    // MARK: - Helpers
    
    private func validate(_ code: String) -> [StyleViolation] {
        let sut = makeSUT()
        let file = SwiftLintFile(contents: code)
        return sut.validate(file: file)
    }
}

