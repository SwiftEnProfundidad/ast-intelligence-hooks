// ═══════════════════════════════════════════════════════════════
// Swift 6 - nonisolated(unsafe) Validator
// ═══════════════════════════════════════════════════════════════
// Validates justified usage of nonisolated(unsafe) (Swift 6 escape hatch)

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct NonisolatedUnsafeValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swift6_nonisolated_unsafe",
        name: "Swift 6 - nonisolated(unsafe) Justification",
        description: "nonisolated(unsafe) must be justified with comment (Swift 6 data race escape hatch)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            @MainActor
            class ViewModel {
                // SAFETY: Cache is thread-safe via internal lock
                nonisolated(unsafe) private let cache: NSCache<NSString, Data>
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            @MainActor
            class ViewModel {
                ↓nonisolated(unsafe) private var count: Int = 0
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        let lines = contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("nonisolated(unsafe)") {
                let previousLine = index > 0 ? lines[index - 1] : ""
                let hasSafetyComment = previousLine.contains("// SAFETY:") || 
                                      previousLine.contains("// Safe:") ||
                                      previousLine.contains("/// SAFETY:")
                
                if !hasSafetyComment {
                    let lineContent = line.trimmingCharacters(in: .whitespaces)
                    let byteOffset = ByteCount(contents.prefix(through: contents.index(contents.startIndex, offsetBy: contents.distance(from: contents.startIndex, to: contents.range(of: line)?.lowerBound ?? contents.startIndex))).utf8.count)
                    
                    let message = """
                    nonisolated(unsafe) without safety justification
                    
                    Swift 6 Data Race Safety Escape Hatch:
                    
                    Problem: Bypassing compiler safety checks
                    
                    Current (DANGEROUS):
                    \(lineContent)  // ❌ Why is this safe?
                    
                    Solution - JUSTIFY with SAFETY comment:
                    // SAFETY: NSCache is thread-safe via internal locks
                    nonisolated(unsafe) private let cache: NSCache<...>
                    
                    // SAFETY: Dispatch queue provides synchronization
                    nonisolated(unsafe) private let queue = DispatchQueue()
                    
                    // SAFETY: Immutable after init, never mutated
                    nonisolated(unsafe) private let config: Config
                    
                    When is nonisolated(unsafe) acceptable?
                    
                    1. Thread-safe types:
                       - NSCache (has internal locks)
                       - DispatchQueue
                       - os_unfair_lock wrappers
                    
                    2. Immutable after init:
                       - Never mutated
                       - Set once in init
                       - Only read afterwards
                    
                    3. Legacy compatibility:
                       - Objective-C interop
                       - Cannot change to actor
                    
                    4. Performance-critical:
                       - Profiled bottleneck
                       - Manual synchronization proven
                    
                    When is it NOT acceptable?
                    
                    ❌ var count: Int  // Mutable primitive
                    ❌ var array: [T]  // Mutable collection
                    ❌ var dict: [K:V]  // Mutable dictionary
                    ❌ "Performance" without profiling
                    ❌ "It works in my tests"
                    
                    Better Alternatives:
                    
                    1. Use actor:
                    actor SafeCounter {
                        var count: Int = 0
                    }
                    
                    2. Use @MainActor:
                    @MainActor
                    class ViewModel {
                        var state: State  // Main thread only
                    }
                    
                    3. Use OSAllocatedUnfairLock (iOS 16+):
                    final class ThreadSafe<T> {
                        private let lock = OSAllocatedUnfairLock()
                        private var value: T
                        
                        func withLock<R>(_ body: (inout T) -> R) -> R {
                            lock.withLock {
                                body(&value)
                            }
                        }
                    }
                    
                    Remember: nonisolated(unsafe) = "Trust me, compiler"
                    → Document WHY you're trustworthy
                    """
                    
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file, byteOffset: byteOffset),
                        reason: message
                    ))
                }
            }
        }
        
        return violations
    }
}

