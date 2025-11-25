// ═══════════════════════════════════════════════════════════════
// Magic Number Detection
// ═══════════════════════════════════════════════════════════════
// Detects hardcoded numeric literals (except 0, 1, -1)
// Rule: Use named constants for clarity

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct MagicNumberDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "no_magic_numbers",
        name: "No Magic Numbers",
        description: "Hardcoded numbers should be named constants for clarity",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            // Named constant (CORRECT)
            private let maxRetries = 3
            private let defaultTimeout: TimeInterval = 30.0
            
            func retry() {
                for _ in 0..<maxRetries { }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            // Magic number (VIOLATION)
            func retry() {
                for _ in 0..<↓3 { }  // What is 3?
                sleep(↓30)            // What is 30?
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        let contents = file.contents
        var violations: [StyleViolation] = []
        
        // Regex to match numeric literals (not 0, 1, -1)
        let pattern = "\\b([2-9]|[1-9]\\d+)(\\.\\d+)?\\b"
        
        guard let regex = try? NSRegularExpression(pattern: pattern) else {
            return []
        }
        
        let nsString = contents as NSString
        let matches = regex.matches(in: contents, range: NSRange(location: 0, length: nsString.length))
        
        for match in matches {
            let matchedText = nsString.substring(with: match.range)
            
            let message = """
            Magic number: '\(matchedText)'
            
            Problem: Unexplained numbers reduce code clarity
            
            What does '\(matchedText)' mean?
            - Maximum retries?
            - Timeout duration?
            - Buffer size?
            - Business rule threshold?
            
            Refactor to named constant:
            
            // BEFORE:
            if orders.count > \(matchedText) {
                // What is \(matchedText)?
            }
            
            // AFTER:
            private let maxOrdersPerBatch = \(matchedText)
            
            if orders.count > maxOrdersPerBatch {
                // Clear meaning ✅
            }
            
            Benefits:
            - Self-documenting code
            - Easy to change (one place)
            - Type safety
            - Business rules visible
            
            Exceptions (allowed):
            - 0, 1, -1 (obvious meanings)
            - Array indices in loops
            - Boolean conversions (0/1)
            """
            
            violations.append(StyleViolation(
                ruleDescription: Self.description,
                severity: .warning,
                location: Location(file: file, byteOffset: ByteCount(match.range.location)),
                reason: message
            ))
        }
        
        return violations
    }
}

