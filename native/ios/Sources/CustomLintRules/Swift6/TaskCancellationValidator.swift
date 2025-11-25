// ═══════════════════════════════════════════════════════════════
// Swift 6 - Task Cancellation Validator
// ═══════════════════════════════════════════════════════════════
// Validates proper Task cancellation handling

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct TaskCancellationValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swift6_task_cancellation",
        name: "Swift 6 - Task Cancellation",
        description: "Long-running tasks must check for cancellation (Task.isCancelled)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            func process() async {
                for item in items {
                    if Task.isCancelled { return }
                    await processItem(item)
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            func ↓process() async {
                for item in largeArray {
                    await processItem(item)
                }
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
                  kind == SwiftDeclarationKind.functionMethodInstance.rawValue,
                  let offset = substructure.offset,
                  let name = substructure.name else { return }
            
            let bodyOffset = substructure.bodyOffset ?? 0
            let bodyLength = substructure.bodyLength ?? 0
            let body = file.stringView.substringWithByteRange(
                start: bodyOffset,
                length: bodyLength
            ) ?? ""
            
            let isAsync = body.contains("async")
            let hasLoop = body.contains("for ") || body.contains("while ")
            let checksCancellation = body.contains("Task.isCancelled") || body.contains("Task.checkCancellation")
            
            if isAsync && hasLoop && !checksCancellation {
                let message = """
                Async loop without cancellation check
                
                Swift 6 Structured Concurrency:
                
                Problem: Long-running task doesn't check cancellation
                
                Current (BAD):
                func \(name)() async {
                    for item in largeArray {
                        await process(item)  // ❌ Never checks cancellation
                    }
                }
                
                Refactor (GOOD):
                func \(name)() async {
                    for item in largeArray {
                        if Task.isCancelled { return }  // ✅ Check each iteration
                        await process(item)
                    }
                }
                
                OR use throwing:
                func \(name)() async throws {
                    for item in largeArray {
                        try Task.checkCancellation()  // ✅ Throws CancellationError
                        await process(item)
                    }
                }
                
                Benefits:
                - Responsive cancellation
                - Resource cleanup
                - Battery efficiency
                - Better UX (instant stop)
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

