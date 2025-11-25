// ═══════════════════════════════════════════════════════════════
// Security - Secure Enclave Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct SecureEnclaveValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "security_secure_enclave",
        name: "Security - Secure Enclave Usage",
        description: "Cryptographic keys should use Secure Enclave when available",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        if contents.contains("SecKeyCreateRandomKey") || contents.contains("kSecAttrKeyType") {
            let usesSecureEnclave = contents.contains("kSecAttrTokenIDSecureEnclave") ||
                                   contents.contains(".secureEnclave")
            
            if !usesSecureEnclave {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: 1),
                    reason: "Cryptographic key creation without Secure Enclave - add kSecAttrTokenID: kSecAttrTokenIDSecureEnclave for hardware-backed security"
                ))
            }
        }
        
        return violations
    }
}
