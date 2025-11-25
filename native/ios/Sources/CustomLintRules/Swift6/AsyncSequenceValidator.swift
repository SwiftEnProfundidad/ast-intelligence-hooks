// ═══════════════════════════════════════════════════════════════
// Swift 6 - AsyncSequence Validator
// ═══════════════════════════════════════════════════════════════
// Validates proper AsyncSequence usage for streaming data

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct AsyncSequenceValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swift6_async_sequence",
        name: "Swift 6 - AsyncSequence Streaming",
        description: "Use AsyncSequence for streaming data instead of callbacks (Swift 6 async iteration)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            func watchUpdates() -> AsyncStream<Update> {
                AsyncStream { continuation in
                    let observer = database.observe { update in
                        continuation.yield(update)
                    }
                    
                    continuation.onTermination = { _ in
                        observer.cancel()
                    }
                }
            }
            
            for await update in watchUpdates() {
                process(update)
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            func ↓watchUpdates(callback: @escaping (Update) -> Void) {
                database.observe { update in
                    callback(update)
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
            let declaration = file.stringView.substringWithByteRange(
                start: ByteCount(offset),
                length: ByteCount((bodyOffset - offset) + 10)
            ) ?? ""
            
            let hasCallbackParam = declaration.contains("@escaping") && 
                                  (declaration.contains("->") || declaration.contains("Void"))
            let isObserver = name.contains("watch") || 
                           name.contains("observe") || 
                           name.contains("stream")
            
            if hasCallbackParam && isObserver {
                let message = """
                Callback-based streaming - use AsyncSequence
                
                Swift 6 Async Iteration:
                
                Problem: Callback hell for streams
                
                Current (CALLBACK HELL):
                func \(name)(callback: @escaping (Update) -> Void) {
                    observer.observe { update in
                        callback(update)  // ❌ Not structured
                    }
                }
                
                Issues:
                - No cancellation
                - Memory management complex
                - Error handling difficult
                - No backpressure
                
                Solution 1 (AsyncStream):
                func \(name)() -> AsyncStream<Update> {
                    AsyncStream { continuation in
                        let observer = database.observe { update in
                            continuation.yield(update)
                        }
                        
                        continuation.onTermination = { @Sendable _ in
                            observer.cancel()
                        }
                    }
                }
                
                Usage:
                for await update in \(name)() {
                    if Task.isCancelled { break }
                    await process(update)
                }
                
                Solution 2 (AsyncThrowingStream):
                func \(name)() -> AsyncThrowingStream<Update, Error> {
                    AsyncThrowingStream { continuation in
                        let observer = database.observe(
                            onNext: { update in
                                continuation.yield(update)
                            },
                            onError: { error in
                                continuation.finish(throwing: error)
                            },
                            onComplete: {
                                continuation.finish()
                            }
                        )
                        
                        continuation.onTermination = { @Sendable _ in
                            observer.cancel()
                        }
                    }
                }
                
                Solution 3 (Custom AsyncSequence):
                struct UpdateSequence: AsyncSequence {
                    typealias Element = Update
                    
                    func makeAsyncIterator() -> AsyncIterator {
                        AsyncIterator(observer: database.createObserver())
                    }
                    
                    struct AsyncIterator: AsyncIteratorProtocol {
                        let observer: Observer
                        
                        mutating func next() async -> Update? {
                            await observer.next()
                        }
                    }
                }
                
                Benefits:
                - Structured concurrency
                - Automatic cancellation
                - Memory safety (Sendable)
                - Backpressure support
                - Swift 6 data race safety
                
                Real-World Examples:
                - WebSocket streams
                - Database observers
                - Network events
                - File changes
                - Sensor data
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

