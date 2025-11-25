// ═══════════════════════════════════════════════════════════════
// Security - Biometric Auth Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct BiometricAuthValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "security_biometric_auth",
        name: "Security - Biometric Authentication",
        description: "Biometric auth must handle fallback and errors properly",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        if contents.contains("LAContext") && contents.contains("evaluatePolicy") {
            let hasFallback = contents.contains("fallbackTitle") || contents.contains("devicePasscode")
            
            if !hasFallback {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: 1),
                    reason: "Biometric auth without fallback - set LAContext.localizedFallbackTitle for device passcode fallback"
                ))
            }
        }
        
        return violations
    }
}
