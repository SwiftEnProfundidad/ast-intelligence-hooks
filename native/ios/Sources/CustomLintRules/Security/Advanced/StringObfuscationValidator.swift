// ═══════════════════════════════════════════════════════════════
// Security - String Obfuscation Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct StringObfuscationValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "security_string_obfuscation",
        name: "Security - Sensitive String Obfuscation",
        description: "Sensitive strings (API endpoints, keys) should be obfuscated in release builds",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("apiKey") || line.contains("baseURL") || line.contains("endpoint") {
                if line.contains("= \"") && !line.contains("ProcessInfo") && !line.contains("Bundle.main") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Hardcoded sensitive string - obfuscate or load from encrypted config: Bundle.main.object(forInfoDictionaryKey: \"API_KEY\")"
                    ))
                }
            }
        }
        
        return violations
    }
}
