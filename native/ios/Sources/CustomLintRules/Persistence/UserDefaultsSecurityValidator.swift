// ═══════════════════════════════════════════════════════════════
// Persistence - UserDefaults Security Validator (CRITICAL)
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct UserDefaultsSecurityValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "persistence_userdefaults_security",
        name: "Persistence - UserDefaults Security",
        description: "UserDefaults must NOT store sensitive data (passwords, tokens, keys)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            UserDefaults.standard.set(theme, forKey: "app_theme")
            UserDefaults.standard.set(language, forKey: "selected_language")
            """)
        ],
        triggeringExamples: [
            Example("""
            UserDefaults.standard.set(↓password, forKey: "user_password")
            UserDefaults.standard.set(↓apiKey, forKey: "api_key")
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        let sensitiveKeys = ["password", "token", "secret", "key", "auth", "credential", "pin", "biometric"]
        
        for (index, line) in lines.enumerated() {
            if line.contains("UserDefaults") && line.contains("set(") {
                for sensitiveKey in sensitiveKeys {
                    if line.lowercased().contains(sensitiveKey) {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .error,
                            location: Location(file: file.path, line: index + 1),
                            reason: "UserDefaults storing sensitive data ('\(sensitiveKey)') - use Keychain for passwords/tokens/secrets: KeychainHelper.save(\(sensitiveKey), forKey: \"key\")"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}
