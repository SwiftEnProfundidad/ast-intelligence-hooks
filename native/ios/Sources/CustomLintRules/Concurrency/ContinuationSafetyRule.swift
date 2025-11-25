// ═══════════════════════════════════════════════════════════════
// Concurrency - Continuation Safety Rule
// ═══════════════════════════════════════════════════════════════
// CheckedContinuation must resume exactly once

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ContinuationSafetyRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "concurrency_continuation_safety",
        name: "Concurrency - Continuation Resume Once",
        description: "Continuations must resume exactly once (Data race/deadlock/corruption)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            func fetchData() async throws -> Data {
                try await withCheckedThrowingContinuation { continuation in
                    urlSession.dataTask(with: url) { data, response, error in
                        if let error {
                            continuation.resume(throwing: error)
                        } else if let data {
                            continuation.resume(returning: data)
                        } else {
                            continuation.resume(throwing: DataError.noData)
                        }
                    }.resume()
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            func ↓fetchData() async throws -> Data {
                try await withCheckedThrowingContinuation { continuation in
                    urlSession.dataTask(with: url) { data, _, error in
                        if let data {
                            continuation.resume(returning: data)
                        }
                        // ❌ Missing else → never resumes on error
                    }.resume()
                }
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        let continuationPatterns = [
            "withCheckedContinuation",
            "withCheckedThrowingContinuation",
            "withUnsafeContinuation",
            "withUnsafeThrowingContinuation"
        ]
        
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        structure.dictionary.walkSubstructure { substructure in
            guard let kind = substructure.kind,
                  kind == SwiftDeclarationKind.functionMethodInstance.rawValue,
                  let offset = substructure.offset else { return }
            
            let bodyOffset = substructure.bodyOffset ?? 0
            let bodyLength = substructure.bodyLength ?? 0
            let body = file.stringView.substringWithByteRange(
                start: bodyOffset,
                length: bodyLength
            ) ?? ""
            
            let hasContinuation = continuationPatterns.contains { body.contains($0) }
            guard hasContinuation else { return }
            
            let resumeCount = body.components(separatedBy: "continuation.resume").count - 1
            let hasIfElse = body.contains("if") && body.contains("else")
            let hasGuard = body.contains("guard")
            let hasSwitch = body.contains("switch")
            
            if resumeCount == 0 {
                let message = """
                🚨 CRITICAL: Continuation Never Resumes - DEADLOCK
                
                Problem: Continuation created but never resumed
                
                CONSEQUENCE:
                ❌ Task waits FOREVER
                ❌ Memory leaked
                ❌ UI frozen
                ❌ Watchdog kill
                
                WHY IT'S CRITICAL:
                
                Continuation = Bridge from callbacks to async/await
                
                Rule: MUST call resume() exactly once
                - resume() zero times → DEADLOCK
                - resume() twice → CRASH or data race
                
                CURRENT (DEADLOCK):
                ```swift
                func fetchData() async throws -> Data {
                    try await withCheckedThrowingContinuation { continuation in
                        URLSession.shared.dataTask(with: url) { data, _, error in
                            if let data {
                                continuation.resume(returning: data)
                            }
                            // ❌ If error, never resumes → DEADLOCK
                        }.resume()
                    }
                }
                
                // Caller:
                let data = await fetchData()  // Hangs FOREVER
                ```
                
                SOLUTION (ALL PATHS RESUME):
                ```swift
                func fetchData() async throws -> Data {
                    try await withCheckedThrowingContinuation { continuation in
                        URLSession.shared.dataTask(with: url) { data, response, error in
                            if let error {
                                continuation.resume(throwing: error)  // ✅
                            } else if let data {
                                continuation.resume(returning: data)  // ✅
                            } else {
                                continuation.resume(
                                    throwing: URLError(.badServerResponse)
                                )  // ✅
                            }
                        }.resume()
                    }
                }
                ```
                
                PATTERN 1 (If-Else Chain):
                ```swift
                withCheckedContinuation { continuation in
                    callback { result, error in
                        if let result {
                            continuation.resume(returning: result)
                        } else if let error {
                            continuation.resume(returning: nil)  // or throw
                        } else {
                            continuation.resume(returning: nil)  // fallback
                        }
                    }
                }
                ```
                
                PATTERN 2 (Guard + Return):
                ```swift
                withCheckedContinuation { continuation in
                    callback { result, error in
                        guard error == nil else {
                            continuation.resume(returning: nil)
                            return
                        }
                        
                        guard let result else {
                            continuation.resume(returning: nil)
                            return
                        }
                        
                        continuation.resume(returning: result)
                    }
                }
                ```
                
                PATTERN 3 (Result Type):
                ```swift
                func fetchData() async -> Result<Data, Error> {
                    await withCheckedContinuation { continuation in
                        URLSession.shared.dataTask(with: url) { data, _, error in
                            if let error {
                                continuation.resume(returning: .failure(error))
                            } else if let data {
                                continuation.resume(returning: .success(data))
                            } else {
                                continuation.resume(
                                    returning: .failure(URLError(.unknown))
                                )
                            }
                        }.resume()
                    }
                }
                ```
                
                PATTERN 4 (Switch Exhaustive):
                ```swift
                withCheckedContinuation { continuation in
                    delegate.request { state in
                        switch state {
                        case .success(let data):
                            continuation.resume(returning: data)
                        case .failure(let error):
                            continuation.resume(returning: nil)
                        case .cancelled:
                            continuation.resume(returning: nil)
                        }
                    }
                }
                ```
                
                CHECKED vs UNSAFE:
                
                Checked (Development):
                ```swift
                // ✅ Use in development
                // Crashes if resumed twice → helps find bugs
                withCheckedContinuation { continuation in
                    // ...
                }
                ```
                
                Unsafe (Production - DANGEROUS):
                ```swift
                // ⚠️ Use ONLY if performance-critical
                // NO crash if resumed twice → undefined behavior
                withUnsafeContinuation { continuation in
                    // ...
                }
                ```
                
                TESTING:
                ```swift
                func testContinuationTimeout() async {
                    let task = Task {
                        await fetchData()
                    }
                    
                    // Wait with timeout
                    let result = await withThrowingTaskGroup(of: Data?.self) { group in
                        group.addTask { try await task.value }
                        group.addTask {
                            try await Task.sleep(for: .seconds(5))
                            throw TimeoutError()
                        }
                        return try await group.next()
                    }
                    
                    XCTAssertNotNil(result, "Continuation never resumed")
                }
                ```
                
                DOUBLE RESUME CRASH:
                ```swift
                withCheckedContinuation { continuation in
                    DispatchQueue.main.async {
                        continuation.resume(returning: 1)
                    }
                    DispatchQueue.global().async {
                        continuation.resume(returning: 2)  // ❌ CRASH
                    }
                }
                
                // Runtime error: "CheckedContinuation resumed multiple times"
                ```
                
                BEST PRACTICES:
                1. Use if-else-else (not just if-else)
                2. Use guard + early return
                3. Use switch (exhaustive)
                4. Add default case always
                5. Test timeout scenarios
                6. Log before resume (debug)
                
                CANCELLATION:
                ```swift
                withCheckedContinuation { continuation in
                    let task = someOperation { result in
                        if Task.isCancelled {
                            continuation.resume(
                                throwing: CancellationError()
                            )
                        } else {
                            continuation.resume(returning: result)
                        }
                    }
                }
                ```
                
                Swift Concurrency Philosophy:
                "Continuation is a contract:
                 Resume exactly once, or pay the price."
                
                This is a CRITICAL data race/deadlock risk.
                Fix IMMEDIATELY.
                """
                
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .error,
                    location: Location(file: file, byteOffset: offset),
                    reason: message
                ))
            } else if resumeCount > 0 && !hasIfElse && !hasGuard && !hasSwitch {
                let message = """
                ⚠️ WARNING: Continuation May Not Resume on All Paths
                
                Detected: \(resumeCount) resume call(s) without clear branching
                
                Ensure ALL code paths resume exactly once.
                
                Use:
                - if-else-else (not just if)
                - guard with early return
                - switch (exhaustive)
                - Result type
                
                Review carefully to prevent deadlocks.
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

