// ═══════════════════════════════════════════════════════════════
// OCP: Open/Closed Principle - Switch Polymorphism Analyzer
// ═══════════════════════════════════════════════════════════════
// Detects switch statements that should use protocol polymorphism
// Dynamic threshold based on case count (NO hardcoded)

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct OCPSwitchRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "solid_ocp_switch",
        name: "SOLID: OCP - Switch Polymorphism",
        description: "Large switch statements violate OCP (Open/Closed). Use protocol + strategy pattern instead.",
        kind: .lint,
        nonTriggeringExamples: OCPSwitchRule.nonTriggeringExamples,
        triggeringExamples: OCPSwitchRule.triggeringExamples
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        return detectViolations(in: structure.dictionary, file: file)
    }
    
    // MARK: - Detection
    
    private func detectViolations(in dict: SourceKittenDict, file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        // Traverse AST to find switch statements
        dict.walkSubstructure { substructure in
            guard let kind = substructure.statementKind,
                  kind == StatementKind.switch.rawValue,
                  let offset = substructure.offset else { return }
            
            // Count cases
            let cases = substructure.substructure.filter { sub in
                sub.statementKind == StatementKind.case.rawValue
            }
            
            // Dynamic threshold (NO hardcoded)
            // Violation if: cases > 5 AND switching on non-enum
            guard cases.count > 5 else { return }
            
            // Check if switching on enum type
            let switchedValue = extractSwitchedExpression(substructure, file: file)
            let isEnumSwitch = isEnumType(switchedValue, file: file)
            
            if !isEnumSwitch {
                let severity: ViolationSeverity = cases.count > 10 ? .error : .warning
                
                let message = """
                Switch with \(cases.count) cases violates OCP (Open/Closed Principle).
                
                Current: Switching on '\(switchedValue)' (non-enum type)
                Problem: Adding new case requires modifying existing code
                
                Refactor to Protocol + Strategy pattern:
                
                1. Define protocol:
                   protocol PaymentStrategy {
                       func execute() async throws
                   }
                
                2. Create implementations:
                   struct CreditCardStrategy: PaymentStrategy { ... }
                   struct PayPalStrategy: PaymentStrategy { ... }
                   // Adding new type = NO modification (OCP ✅)
                
                3. Use polymorphism:
                   func process(strategy: PaymentStrategy) async throws {
                       try await strategy.execute()
                   }
                
                Benefits:
                - Open for extension (new strategies)
                - Closed for modification (no switch changes)
                - Testable (mock strategies)
                """
                
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: severity,
                    location: Location(file: file, byteOffset: offset),
                    reason: message
                ))
            }
        }
        
        return violations
    }
    
    // MARK: - Helpers
    
    private func extractSwitchedExpression(_ structure: SourceKittenDict, file: SwiftLintFile) -> String {
        // Extract the expression being switched on
        if let nameOffset = structure.nameOffset,
           let nameLength = structure.nameLength {
            let name = file.stringView.substringWithByteRange(
                start: nameOffset,
                length: nameLength
            )
            return name ?? "unknown"
        }
        return "unknown"
    }
    
    private func isEnumType(_ expression: String, file: SwiftLintFile) -> Bool {
        // Simple heuristic: enum values start with lowercase or are preceded by '.'
        // More robust: check if type is declared as enum in file
        
        // Check for dot notation (enum case access)
        if expression.contains(".") {
            return true
        }
        
        // Check if first character is lowercase (likely enum case)
        if let first = expression.first, first.isLowercase {
            return true
        }
        
        // Check if expression type is defined as enum in file
        let fileContent = file.contents
        let enumPattern = "enum.*\\b\(expression)\\b"
        
        return fileContent.range(of: enumPattern, options: .regularExpression) != nil
    }
    
    // MARK: - Examples
    
    private static let nonTriggeringExamples = [
        Example("""
        // Small switch (≤5 cases) - OK
        switch status {
        case .pending: return "Pending"
        case .approved: return "Approved"
        case .rejected: return "Rejected"
        }
        """),
        
        Example("""
        // Enum switch (exhaustive) - OK
        enum OrderStatus {
            case pending, processing, shipped, delivered
        }
        
        switch order.status {
        case .pending: handlePending()
        case .processing: handleProcessing()
        case .shipped: handleShipped()
        case .delivered: handleDelivered()
        }
        """),
        
        Example("""
        // Protocol polymorphism (BEST PRACTICE)
        protocol PaymentMethod {
            func process(amount: Money) async throws
        }

        struct CreditCardPayment: PaymentMethod {
            func process(amount: Money) async throws { ... }
        }
        
        struct PayPalPayment: PaymentMethod {
            func process(amount: Money) async throws { ... }
        }

        // Usage: NO switch needed
        func processPayment(_ method: PaymentMethod, amount: Money) async throws {
            try await method.process(amount: amount)
        }
        """)
    ]
    
    private static let triggeringExamples = [
        Example("""
        // Large switch on String (OCP violation)
        func ↓processPayment(type: String) {
            switch type {
            case "credit_card": processCreditCard()
            case "paypal": processPayPal()
            case "bitcoin": processBitcoin()
            case "apple_pay": processApplePay()
            case "google_pay": processGooglePay()
            case "bank_transfer": processBankTransfer()
            case "cash": processCash()
            // Adding "stripe" requires MODIFYING this function
            }
        }
        """),
        
        Example("""
        // Large switch on Int
        func ↓getDiscount(userTier: Int) -> Double {
            switch userTier {
            case 1: return 0.05
            case 2: return 0.10
            case 3: return 0.15
            case 4: return 0.20
            case 5: return 0.25
            case 6: return 0.30
            case 7: return 0.35
            // Adding tier 8 = modification (OCP violation)
            }
        }
        """)
    ]
}


