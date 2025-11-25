// ═══════════════════════════════════════════════════════════════
// Memory Management - Retain Cycle Detection
// ═══════════════════════════════════════════════════════════════
// Detects closures without [weak self] that can create retain cycles

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct RetainCycleDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "retain_cycle_detection",
        name: "Retain Cycle - Weak Self Required",
        description: "Closures capturing self should use [weak self] to prevent retain cycles",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            service.fetch { [weak self] result in
                guard let self else { return }
                self.handleResult(result)
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            service.fetch { ↓result in
                self.handleResult(result)
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        return detectViolations(in: structure.dictionary, file: file)
    }
    
    private func detectViolations(in dict: SourceKittenDict, file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        dict.walkSubstructure { substructure in
            guard let kind = substructure.kind,
                  kind == SwiftExpressionKind.closure.rawValue,
                  let offset = substructure.offset,
                  let bodyOffset = substructure.bodyOffset,
                  let bodyLength = substructure.bodyLength else { return }
            
            let body = file.stringView.substringWithByteRange(
                start: bodyOffset,
                length: bodyLength
            ) ?? ""
            
            let hasSelfUsage = body.contains("self.") || body.contains("self?")
            let hasWeakSelf = body.contains("[weak self]") || body.contains("[unowned self]")
            
            if hasSelfUsage && !hasWeakSelf {
                let message = """
                Closure captures 'self' strongly - potential retain cycle
                
                Problem: Strong reference to self in closure can create retain cycle
                
                Scenario:
                class ViewController {
                    var service: Service?
                    
                    func setup() {
                        service?.fetch { result in
                            self.process(result)  // ← Strong capture
                        }
                    }
                }
                
                Retain cycle: ViewController → Service → Closure → ViewController
                
                Solution:
                service?.fetch { [weak self] result in
                    guard let self else { return }
                    self.process(result)  // ✅ Safe
                }
                
                When to use [unowned self]:
                - Only if self DEFINITELY outlives closure
                - Prefer [weak self] (safer)
                
                Non-escaping closures:
                - Don't need [weak self] (not stored)
                - map, filter, forEach are non-escaping by default
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

