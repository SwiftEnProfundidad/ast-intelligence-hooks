// ═══════════════════════════════════════════════════════════════
// OCP Switch Rule - Unit Tests
// ═══════════════════════════════════════════════════════════════

import XCTest
@testable import CustomLintRules
import SwiftLintCore
import SourceKittenFramework

final class OCPSwitchRuleTests: XCTestCase {
    
    // MARK: - makeSUT
    
    private func makeSUT() -> OCPSwitchRule {
        return OCPSwitchRule()
    }
    
    // MARK: - Tests
    
    func test_smallSwitch_noViolation() {
        let code = """
        func getStatus() -> String {
            switch status {
            case .pending: return "Pending"
            case .approved: return "Approved"
            case .rejected: return "Rejected"
            }
        }
        """
        
        let violations = validate(code)
        
        XCTAssertTrue(violations.isEmpty, "Switch with ≤5 cases should not trigger violation")
    }
    
    func test_enumSwitch_noViolation() {
        let code = """
        enum OrderStatus {
            case pending, processing, shipped, delivered, cancelled, returned
        }
        
        func handleStatus(_ status: OrderStatus) {
            switch status {
            case .pending: handlePending()
            case .processing: handleProcessing()
            case .shipped: handleShipped()
            case .delivered: handleDelivered()
            case .cancelled: handleCancelled()
            case .returned: handleReturned()
            }
        }
        """
        
        let violations = validate(code)
        
        XCTAssertTrue(violations.isEmpty, "Enum switch should not trigger violation (exhaustive)")
    }
    
    func test_largeSwitchOnString_triggersViolation() {
        let code = """
        func processPayment(type: String) {
            switch type {
            case "credit_card": handleCC()
            case "paypal": handlePayPal()
            case "bitcoin": handleBitcoin()
            case "apple_pay": handleApplePay()
            case "google_pay": handleGooglePay()
            case "bank_transfer": handleBank()
            case "cash": handleCash()
            }
        }
        """
        
        let violations = validate(code)
        
        XCTAssertFalse(violations.isEmpty, "Large switch on String should trigger OCP violation")
        XCTAssertTrue(violations[0].reason.contains("OCP"), "Should mention OCP principle")
        XCTAssertTrue(violations[0].reason.contains("protocol"), "Should suggest protocol pattern")
    }
    
    func test_veryLargeSwitch_error() {
        let code = """
        func getDiscount(tier: Int) -> Double {
            switch tier {
            case 1: return 0.05
            case 2: return 0.10
            case 3: return 0.15
            case 4: return 0.20
            case 5: return 0.25
            case 6: return 0.30
            case 7: return 0.35
            case 8: return 0.40
            case 9: return 0.45
            case 10: return 0.50
            case 11: return 0.55
            }
        }
        """
        
        let violations = validate(code)
        
        XCTAssertFalse(violations.isEmpty, ">10 cases should trigger ERROR")
        XCTAssertEqual(violations[0].severity, .error, "Very large switch should be ERROR")
    }
    
    // MARK: - Helpers
    
    private func validate(_ code: String) -> [StyleViolation] {
        let sut = makeSUT()
        let file = SwiftLintFile(contents: code)
        return sut.validate(file: file)
    }
}

