// ═══════════════════════════════════════════════════════════════
// Memory - deinit Validator
// ═══════════════════════════════════════════════════════════════
// Validates classes with resources have proper deinit

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct DeinitValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "deinit_required",
        name: "deinit Required for Resources",
        description: "Classes with Timer/NotificationCenter/Observers need deinit for cleanup",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            class ViewController {
                var timer: Timer?
                
                deinit {
                    timer?.invalidate()
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            class ↓ViewController {
                var timer: Timer?
                // Missing deinit!
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        var violations: [StyleViolation] = []
        
        structure.dictionary.walkSubstructure { substructure in
            guard let kind = substructure.kind,
                  kind == SwiftDeclarationKind.class.rawValue,
                  let offset = substructure.offset,
                  let name = substructure.name else { return }
            
            let bodyOffset = substructure.bodyOffset ?? 0
            let bodyLength = substructure.bodyLength ?? 0
            let body = file.stringView.substringWithByteRange(
                start: bodyOffset,
                length: bodyLength
            ) ?? ""
            
            let resourceTypes = ["Timer", "NotificationCenter", "observer", "Listener", "Subscriber", "Cancellable"]
            let hasResources = resourceTypes.contains { body.contains($0) }
            let hasDeinit = substructure.substructure.contains { sub in
                sub.name == "deinit"
            }
            
            if hasResources && !hasDeinit {
                let message = """
                Class '\(name)' has resources without deinit cleanup
                
                Resources detected: Timer, NotificationCenter, observers
                Problem: Resources not cleaned up → memory leaks
                
                Solution:
                deinit {
                    timer?.invalidate()
                    NotificationCenter.default.removeObserver(self)
                    cancellables.forEach { $0.cancel() }
                }
                
                Verify deinit is called:
                - Use Instruments (Leaks, Allocations)
                - Add print("\\(Self.self) deinitialized") in development
                """
                
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file, byteOffset: offset),
                    reason: message
                ))
            }
        }
        
        return violations
    }
}

