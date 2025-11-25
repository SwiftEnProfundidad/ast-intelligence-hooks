// ═══════════════════════════════════════════════════════════════
// Swift 6 - TaskGroup Validator
// ═══════════════════════════════════════════════════════════════
// Validates proper TaskGroup usage for parallel async operations

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct TaskGroupValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swift6_task_group",
        name: "Swift 6 - TaskGroup Parallelism",
        description: "Use TaskGroup for parallel operations instead of sequential await (Swift 6 structured concurrency)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            func loadAll() async -> [Data] {
                await withTaskGroup(of: Data?.self) { group in
                    for url in urls {
                        group.addTask {
                            try? await loadData(from: url)
                        }
                    }
                    
                    var results: [Data] = []
                    for await result in group {
                        if let data = result {
                            results.append(data)
                        }
                    }
                    return results
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            func ↓loadAll() async -> [Data] {
                var results: [Data] = []
                for url in urls {
                    if let data = await loadData(from: url) {
                        results.append(data)
                    }
                }
                return results
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
            
            let hasForLoop = body.contains("for ") && body.contains(" in ")
            let hasAwaitInLoop = body.contains("await ") && hasForLoop
            let hasTaskGroup = body.contains("withTaskGroup") || body.contains("withThrowingTaskGroup")
            
            if hasAwaitInLoop && !hasTaskGroup {
                let awaitCount = body.components(separatedBy: "await").count - 1
                
                if awaitCount > 2 {
                    let message = """
                    Sequential await in loop - use TaskGroup for parallelism
                    
                    Swift 6 Structured Concurrency:
                    
                    Problem: Operations run sequentially
                    
                    Current (SLOW - \(awaitCount) sequential awaits):
                    func \(name)() async {
                        for url in urls {
                            await fetch(url)  // ❌ One at a time
                        }
                    }
                    
                    Time: n × operation_time
                    
                    Solution (FAST - Parallel):
                    func \(name)() async {
                        await withTaskGroup(of: Data?.self) { group in
                            for url in urls {
                                group.addTask {
                                    try? await fetch(url)  // ✅ All in parallel
                                }
                            }
                            
                            var results: [Data] = []
                            for await result in group {
                                if let data = result {
                                    results.append(data)
                                }
                            }
                            return results
                        }
                    }
                    
                    Time: max(operation_time)
                    
                    With Error Handling:
                    await withThrowingTaskGroup(of: Data.self) { group in
                        for url in urls {
                            group.addTask {
                                try await fetch(url)
                            }
                        }
                        
                        return try await group.reduce(into: []) { result, data in
                            result.append(data)
                        }
                    }
                    
                    Benefits:
                    - True parallelism
                    - Faster execution
                    - Structured cancellation
                    - Memory efficient
                    
                    TaskGroup guarantees:
                    - All tasks complete before return
                    - Automatic cancellation propagation
                    - No task leaks
                    """
                    
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file, byteOffset: offset),
                        reason: message
                    ))
                }
            }
        }
        
        return violations
    }
}

