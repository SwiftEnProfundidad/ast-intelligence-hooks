// ═══════════════════════════════════════════════════════════════
// Security - Hardcoded API Key Detector
// ═══════════════════════════════════════════════════════════════
// Detects API keys, tokens, secrets hardcoded in source

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct HardcodedAPIKeyDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "security_hardcoded_api_key",
        name: "Security - Hardcoded API Keys Forbidden",
        description: "API keys, tokens, secrets must not be hardcoded (CRITICAL security breach)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            let apiKey = ProcessInfo.processInfo.environment["API_KEY"] ?? ""
            let token = KeychainManager.shared.retrieve(key: "auth_token")
            """)
        ],
        triggeringExamples: [
            Example("""
            let ↓apiKey = "sk_live_abc123def456"
            let ↓token = "ghp_1234567890abcdef"
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        let lines = contents.components(separatedBy: .newlines)
        
        let suspiciousPatterns: [(pattern: String, name: String, severity: String)] = [
            ("sk_live_[a-zA-Z0-9]{32,}", "Stripe Live Key", "CRITICAL"),
            ("sk_test_[a-zA-Z0-9]{32,}", "Stripe Test Key", "HIGH"),
            ("ghp_[a-zA-Z0-9]{36,}", "GitHub Personal Access Token", "CRITICAL"),
            ("gho_[a-zA-Z0-9]{36,}", "GitHub OAuth Token", "CRITICAL"),
            ("AKIA[0-9A-Z]{16}", "AWS Access Key", "CRITICAL"),
            ("[0-9a-f]{64}", "Potential Secret (64 hex)", "HIGH"),
            ("AIza[0-9A-Za-z\\-_]{35}", "Google API Key", "CRITICAL"),
            ("['\"]ya29\\.[0-9A-Za-z\\-_]+['\"]", "Google OAuth Token", "CRITICAL"),
            ("xox[baprs]-[0-9a-zA-Z]{10,48}", "Slack Token", "CRITICAL"),
            ("[0-9]+-[0-9A-Za-z_]{32}\\.apps\\.googleusercontent\\.com", "Google OAuth Client", "HIGH"),
            ("SG\\.[a-zA-Z0-9]{22}\\.[a-zA-Z0-9]{43}", "SendGrid API Key", "CRITICAL"),
            ("key-[0-9a-zA-Z]{32}", "Mailgun API Key", "CRITICAL"),
            ("access_token['\"]?\\s*[:=]\\s*['\"][a-zA-Z0-9_\\-\\.]{20,}['\"]", "Generic Access Token", "HIGH"),
            ("api_key['\"]?\\s*[:=]\\s*['\"][a-zA-Z0-9_\\-]{20,}['\"]", "Generic API Key", "HIGH"),
            ("secret['\"]?\\s*[:=]\\s*['\"][a-zA-Z0-9_\\-]{20,}['\"]", "Generic Secret", "HIGH"),
            ("password['\"]?\\s*[:=]\\s*['\"][a-zA-Z0-9_\\-@!]{8,}['\"]", "Hardcoded Password", "CRITICAL"),
            ("bearer\\s+[a-zA-Z0-9_\\-\\.]{20,}", "Bearer Token", "CRITICAL"),
            ("private_key['\"]?\\s*[:=]", "Private Key Reference", "CRITICAL"),
        ]
        
        for (index, line) in lines.enumerated() {
            let trimmedLine = line.trimmingCharacters(in: .whitespaces)
            
            guard !trimmedLine.hasPrefix("//"),
                  !trimmedLine.hasPrefix("/*"),
                  !trimmedLine.contains("example"),
                  !trimmedLine.contains("Example"),
                  !trimmedLine.contains("EXAMPLE"),
                  !trimmedLine.contains("dummy"),
                  !trimmedLine.contains("test"),
                  !trimmedLine.contains("TODO") else {
                continue
            }
            
            for (pattern, keyType, severity) in suspiciousPatterns {
                guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else {
                    continue
                }
                
                let nsString = line as NSString
                let matches = regex.matches(in: line, range: NSRange(location: 0, length: nsString.length))
                
                for match in matches {
                    let matchedString = nsString.substring(with: match.range)
                    
                    let byteOffset = ByteCount(contents.prefix(through: contents.index(contents.startIndex, offsetBy: contents.distance(from: contents.startIndex, to: contents.range(of: line)?.lowerBound ?? contents.startIndex))).utf8.count)
                    
                    let message = """
                    🚨 CRITICAL SECURITY BREACH: Hardcoded \(keyType) detected
                    
                    Detected Pattern: \(matchedString)
                    Severity: \(severity)
                    
                    IMMEDIATE RISKS:
                    ❌ Credential theft via Git history
                    ❌ Unauthorized API access
                    ❌ Financial loss (Stripe, AWS charges)
                    ❌ Data breach
                    ❌ Account compromise
                    ❌ Compliance violation (PCI-DSS, GDPR)
                    
                    NEVER HARDCODE:
                    - API keys
                    - Access tokens
                    - OAuth secrets
                    - Passwords
                    - Private keys
                    - Certificates
                    - Encryption keys
                    
                    CORRECT SOLUTIONS:
                    
                    1. Environment Variables:
                    ```swift
                    let apiKey = ProcessInfo.processInfo.environment["API_KEY"] ?? ""
                    
                    // In Xcode:
                    // Edit Scheme → Run → Arguments → Environment Variables
                    // API_KEY = $(API_KEY)
                    ```
                    
                    2. xcconfig Files (NOT in Git):
                    ```
                    // Config.xcconfig (add to .gitignore)
                    API_KEY = your_key_here
                    
                    // Config.xcconfig.template (commit this)
                    API_KEY = YOUR_KEY_HERE
                    
                    // Access in code:
                    Bundle.main.infoDictionary?["API_KEY"]
                    ```
                    
                    3. Keychain (Runtime):
                    ```swift
                    KeychainManager.shared.save(
                        key: "api_key",
                        value: apiKey
                    )
                    
                    let apiKey = KeychainManager.shared.retrieve(
                        key: "api_key"
                    )
                    ```
                    
                    4. Backend Proxy (BEST):
                    ```swift
                    // Never expose keys to client
                    // iOS → Your Backend → Third-party API
                    
                    APIClient.shared.request(
                        endpoint: "/api/proxy/stripe",
                        method: .post
                    )
                    
                    // Backend handles actual API key
                    ```
                    
                    5. CI/CD Secrets:
                    - GitHub Actions: Repository Secrets
                    - GitLab CI: Variables (masked)
                    - Bitrise: Secrets
                    - Fastlane: .env.secret (not in Git)
                    
                    IF ALREADY COMMITTED:
                    
                    1. IMMEDIATELY revoke the key/token
                    2. Generate new credentials
                    3. Remove from Git history:
                       ```bash
                       git filter-repo --path <file> --invert-paths
                       git push origin --force --all
                       ```
                    4. Rotate ALL related credentials
                    5. Audit access logs for unauthorized use
                    6. Update security incident log
                    
                    DETECTION TOOLS:
                    - TruffleHog (Git history scanner)
                    - git-secrets (pre-commit hook)
                    - GitHub Secret Scanning
                    - GitGuardian
                    
                    COMPLIANCE:
                    - PCI-DSS: Requirement 3 (Protect stored data)
                    - GDPR: Article 32 (Security of processing)
                    - SOC 2: CC6.1 (Logical access controls)
                    
                    This is a CRITICAL security vulnerability.
                    Fix IMMEDIATELY before deploying.
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

