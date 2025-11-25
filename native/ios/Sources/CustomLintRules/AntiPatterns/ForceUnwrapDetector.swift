// ═══════════════════════════════════════════════════════════════
// Force Unwrap Detection (!)
// ═══════════════════════════════════════════════════════════════
// Detects force unwrapping operators (crash-prone)
// Rule: Use if let, guard let, ??, or optional chaining instead

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ForceUnwrapDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "no_force_unwrap",
        name: "No Force Unwrapping (!)",
        description: "Force unwrapping can crash. Use safe unwrapping (if let, guard let, ??)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            // Safe unwrapping (CORRECT)
            if let user = optionalUser {
                print(user.name)
            }
            
            guard let user = optionalUser else { return }
            
            let name = optionalUser?.name ?? "Unknown"
            """)
        ],
        triggeringExamples: [
            Example("""
            // Force unwrap (VIOLATION)
            let user = ↓optionalUser!
            let name = ↓dict["key"]!
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        let contents = file.contents
        var violations: [StyleViolation] = []
        
        // Regex to match force unwrap: something!
        // But NOT: @IBOutlet, @IBAction (allowed exceptions)
        let pattern = "(?<!@IBOutlet )(?<!@IBAction )\\w+!"
        
        guard let regex = try? NSRegularExpression(pattern: pattern) else {
            return []
        }
        
        let nsString = contents as NSString
        let matches = regex.matches(in: contents, range: NSRange(location: 0, length: nsString.length))
        
        for match in matches {
            let matchedText = nsString.substring(with: match.range)
            
            // Skip if it's a type (MyType!)
            if matchedText.first?.isUppercase == true {
                continue
            }
            
            let message = """
            Force unwrap detected: '\(matchedText)'
            
            Problem: Force unwrapping crashes if value is nil
            
            Safe alternatives:
            
            1. if let (for single use):
               if let value = optionalValue {
                   use(value)
               }
            
            2. guard let (for early return):
               guard let value = optionalValue else {
                   return  // or throw error
               }
               use(value)  // value available in scope
            
            3. Nil coalescing (default value):
               let value = optionalValue ?? defaultValue
            
            4. Optional chaining:
               let name = user?.profile?.name
            
            5. Conditional binding:
               let name = user.flatMap { $0.name }
            
            Only use ! for:
            - @IBOutlet (guaranteed by Interface Builder)
            - Fatal programmer errors (never-nil invariants)
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

