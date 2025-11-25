// ═══════════════════════════════════════════════════════════════
// Security - Jailbreak Detection Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct JailbreakDetectionValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "security_jailbreak_detection",
        name: "Security - Jailbreak Detection",
        description: "Security-critical apps should implement jailbreak detection",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        let isSecurityCritical = contents.contains("Keychain") || 
                                contents.contains("BiometricAuth") ||
                                contents.contains("SecureEnclave")
        
        if isSecurityCritical {
            let hasJailbreakCheck = contents.contains("isJailbroken") ||
                                  contents.contains("/Applications/Cydia") ||
                                  contents.contains("fileExists.*bin/bash")
            
            if !hasJailbreakCheck {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: 1),
                    reason: "Security-critical code without jailbreak detection - check FileManager.default.fileExists(atPath: \"/Applications/Cydia.app\") || /private/var/lib/apt"
                ))
            }
        }
        
        return violations
    }
}
