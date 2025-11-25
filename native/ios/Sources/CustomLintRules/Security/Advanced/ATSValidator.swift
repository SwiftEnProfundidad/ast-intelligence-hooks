// ═══════════════════════════════════════════════════════════════
// Security - App Transport Security Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ATSValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "security_ats_validation",
        name: "Security - App Transport Security",
        description: "HTTP requests must be HTTPS or explicitly allowed in Info.plist NSAppTransportSecurity",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("http://") && !line.contains("https://") && !line.contains("localhost") {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .error,
                    location: Location(file: file.path, line: index + 1),
                    reason: "HTTP URL detected - use HTTPS or add exception in Info.plist NSAppTransportSecurity (not recommended for production)"
                ))
            }
        }
        
        return violations
    }
}
