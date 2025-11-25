// ═══════════════════════════════════════════════════════════════
// Security - HTTPS Enforcer
// ═══════════════════════════════════════════════════════════════
// Ensures all URLs use HTTPS (App Transport Security)

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct HTTPSEnforcer: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "security_https_required",
        name: "HTTPS Required (ATS)",
        description: "All URLs must use HTTPS for App Transport Security",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            let url = URL(string: "https://api.example.com")
            """)
        ],
        triggeringExamples: [
            Example("""
            let url = ↓URL(string: "http://api.example.com")
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        let content = file.contents
        var violations: [StyleViolation] = []
        
        let httpPattern = try? NSRegularExpression(
            pattern: #"(?:URL|url)\s*\(\s*string:\s*"http://(?!localhost)"#
        )
        
        guard let regex = httpPattern else { return [] }
        
        let nsString = content as NSString
        let matches = regex.matches(
            in: content,
            range: NSRange(location: 0, length: nsString.length)
        )
        
        for match in matches {
            let message = """
            HTTP URL detected - use HTTPS
            
            App Transport Security (ATS) VIOLATION
            
            Problem: HTTP is not secure
            - Data transmitted in plain text
            - Vulnerable to man-in-the-middle attacks
            - ATS blocks HTTP by default (iOS 9+)
            
            Solution:
            let url = URL(string: "https://api.example.com")  // ✅
            
            Exception for localhost:
            - http://localhost OK (development)
            - http://127.0.0.1 OK (development)
            
            If MUST use HTTP (rare):
            - Add exception to Info.plist (NSAppTransportSecurity)
            - Document security justification
            - Use only for legacy APIs
            """
            
            violations.append(StyleViolation(
                ruleDescription: Self.description,
                severity: .error,
                location: Location(file: file, byteOffset: ByteCount(match.range.location)),
                reason: message
            ))
        }
        
        return violations
    }
}

