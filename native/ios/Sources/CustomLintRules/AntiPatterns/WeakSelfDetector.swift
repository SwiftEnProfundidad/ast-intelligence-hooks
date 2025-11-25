// ═══════════════════════════════════════════════════════════════
// Weak Self Detection in Closures
// ═══════════════════════════════════════════════════════════════
// Detects closures without [weak self] (retain cycles)
// Rule: Use [weak self] in closures to prevent memory leaks

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct WeakSelfDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "weak_self_required",
        name: "Weak Self in Closures",
        description: "Closures should use [weak self] to prevent retain cycles",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            // Weak self (CORRECT)
            service.fetch { [weak self] result in
                guard let self else { return }
                self.processResult(result)
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            // Missing weak self (VIOLATION)
            service.fetch { ↓result in
                self.processResult(result)  // Retain cycle!
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        let contents = file.contents
        var violations: [StyleViolation] = []
        
        // Simple heuristic: find closures with self but no [weak self]
        let lines = contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            // Check if line has closure opening
            if line.contains("{") && !line.contains("[weak self]") && !line.contains("[unowned self]") {
                // Check next few lines for self usage
                let nextLines = lines.dropFirst(index).prefix(10).joined()
                
                if nextLines.contains("self.") || nextLines.contains("self?") {
                    let message = """
                    Closure uses 'self' without [weak self] capture
                    
                    Problem: Strong reference to self creates retain cycle
                    
                    Memory leak scenario:
                    class ViewController {
                        var service: Service?
                        
                        func setup() {
                            service?.fetch { result in
                                self.processResult(result)  // ← self captured strongly
                            }
                        }
                    }
                    
                    // ViewController → Service (closure) → ViewController
                    // Retain cycle! Neither can be deallocated
                    
                    Solution with [weak self]:
                    
                    service?.fetch { [weak self] result in
                        guard let self else { return }
                        self.processResult(result)
                    }
                    
                    // OR (Swift 5.8+):
                    service?.fetch { [weak self] result in
                        guard let self else { return }
                        processResult(result)  // implicit self
                    }
                    
                    When to use [unowned self]:
                    - Only if self DEFINITELY outlives the closure
                    - Prefer [weak self] (safer)
                    
                    When [weak self] is NOT needed:
                    - Non-escaping closures (default in Swift)
                    - No strong reference from closure back to self
                    """
                    
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file, line: index + 1),
                        reason: message
                    ))
                }
            }
        }
        
        return violations
    }
}

