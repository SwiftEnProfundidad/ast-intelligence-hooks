// ═══════════════════════════════════════════════════════════════
// Security - Keychain Usage Validator
// ═══════════════════════════════════════════════════════════════
// Ensures sensitive data uses Keychain, not UserDefaults

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct KeychainValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "security_keychain_required",
        name: "Keychain for Sensitive Data",
        description: "Passwords/tokens must use Keychain, not UserDefaults",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            func saveToken(_ token: String) {
                KeychainWrapper.standard.set(token, forKey: "authToken")
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            func ↓saveToken(_ token: String) {
                UserDefaults.standard.set(token, forKey: "authToken")
            }
            """)
        ]
    )
    
    public init() {}
    
    private let sensitiveKeywords = ["password", "token", "secret", "key", "auth", "credential", "pin"]
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        var violations: [StyleViolation] = []
        
        structure.dictionary.walkSubstructure { substructure in
            guard let kind = substructure.kind,
                  kind == SwiftDeclarationKind.functionMethodInstance.rawValue,
                  let offset = substructure.offset,
                  let name = substructure.name,
                  let bodyOffset = substructure.bodyOffset,
                  let bodyLength = substructure.bodyLength else { return }
            
            let body = file.stringView.substringWithByteRange(
                start: bodyOffset,
                length: bodyLength
            ) ?? ""
            
            let nameLower = name.lowercased()
            let bodyLower = body.lowercased()
            
            let hasSensitiveData = sensitiveKeywords.contains { keyword in
                nameLower.contains(keyword) || bodyLower.contains(keyword)
            }
            
            let usesUserDefaults = body.contains("UserDefaults")
            let usesKeychain = body.contains("Keychain") || body.contains("SecItem")
            
            if hasSensitiveData && usesUserDefaults && !usesKeychain {
                let message = """
                Sensitive data in UserDefaults - use Keychain
                
                SECURITY VIOLATION: Passwords/tokens in UserDefaults
                
                Problem:
                - UserDefaults stores data unencrypted
                - Readable by jailbroken devices
                - Synced to iCloud (potential leak)
                - Not secure for sensitive data
                
                Current (INSECURE):
                UserDefaults.standard.set(token, forKey: "authToken")  // ❌
                
                Refactor to Keychain (SECURE):
                
                // Option 1: Security framework
                let query: [String: Any] = [
                    kSecClass as String: kSecClassGenericPassword,
                    kSecAttrAccount as String: "authToken",
                    kSecValueData as String: tokenData
                ]
                SecItemAdd(query as CFDictionary, nil)
                
                // Option 2: KeychainSwift wrapper
                let keychain = KeychainSwift()
                keychain.set(token, forKey: "authToken")  // ✅
                
                Benefits:
                - Encrypted by system
                - Secure Enclave support
                - Not in backups
                - Face ID/Touch ID integration
                """
                
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .error,
                    location: Location(file: file, byteOffset: offset),
                    reason: message
                ))
            }
        }
        
        return violations
    }
}

