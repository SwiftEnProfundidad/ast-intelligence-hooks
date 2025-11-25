// ═══════════════════════════════════════════════════════════════
// Localization - NSLocalizedString Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct NSLocalizedStringValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "localization_nslocalizedstring",
        name: "NSLocalizedString Required",
        description: "User-facing strings should use NSLocalizedString for internationalization",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            Text(NSLocalizedString("welcome_message", comment: ""))
            """)
        ],
        triggeringExamples: [
            Example("""
            ↓Text("Welcome to the app")
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        let content = file.contents
        var violations: [StyleViolation] = []
        
        let textPattern = try? NSRegularExpression(pattern: #"Text\s*\(\s*"([^"]{15,})"\s*\)"#)
        
        guard let regex = textPattern else { return [] }
        
        let nsString = content as NSString
        let matches = regex.matches(in: content, range: NSRange(location: 0, length: nsString.length))
        
        for match in matches {
            let fullMatch = nsString.substring(with: match.range)
            
            if !fullMatch.contains("NSLocalizedString") {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file, byteOffset: ByteCount(match.range.location)),
                    reason: "Hardcoded string - use NSLocalizedString for i18n"
                ))
            }
        }
        
        return violations
    }
}

