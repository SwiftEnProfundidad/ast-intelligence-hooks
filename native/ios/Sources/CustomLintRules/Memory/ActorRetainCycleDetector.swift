// ═══════════════════════════════════════════════════════════════
// Memory - Actor Retain Cycle Detector
// ═══════════════════════════════════════════════════════════════
// Detects retain cycles in actor closures (Swift 6 specific)

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ActorRetainCycleDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "memory_actor_retain_cycle",
        name: "Memory - Actor Retain Cycles",
        description: "Actors must use [weak self] in escaping closures (Swift 6 memory safety)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            actor DataManager {
                func startTimer() {
                    Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
                        guard let self else { return }
                        await self.update()
                    }
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            actor DataManager {
                func startTimer() {
                    Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
                        await ↓self.update()  // ❌ Retain cycle!
                    }
                }
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        structure.dictionary.walkSubstructure { substructure in
            guard let kind = substructure.kind,
                  kind == SwiftDeclarationKind.actor.rawValue,
                  let actorName = substructure.name else { return }
            
            substructure.walkSubstructure { methodStructure in
                guard let methodKind = methodStructure.kind,
                      methodKind == SwiftDeclarationKind.functionMethodInstance.rawValue,
                      let offset = methodStructure.offset else { return }
                
                let bodyOffset = methodStructure.bodyOffset ?? 0
                let bodyLength = methodStructure.bodyLength ?? 0
                let body = file.stringView.substringWithByteRange(
                    start: bodyOffset,
                    length: bodyLength
                ) ?? ""
                
                let hasEscapingClosure = body.contains("@escaping") ||
                                        body.contains("Timer") ||
                                        body.contains("DispatchQueue") ||
                                        body.contains("NotificationCenter") ||
                                        body.contains("URLSession") ||
                                        body.contains("Task {")
                
                guard hasEscapingClosure else { return }
                
                let hasCaptureList = body.contains("[weak self]") ||
                                    body.contains("[unowned self]") ||
                                    body.contains("guard let self")
                
                let hasSelfInClosure = body.contains("self.")
                
                if hasSelfInClosure && !hasCaptureList {
                    let message = """
                    🚨 CRITICAL: Actor Retain Cycle Detected
                    
                    Actor: \(actorName)
                    Problem: Escaping closure without capture list
                    
                    Swift 6 Actor Isolation + Memory Safety:
                    
                    WHY ACTORS ARE SPECIAL:
                    - Actors are reference types (like classes)
                    - Actor isolation is runtime-enforced
                    - Closures capturing actor → strong reference
                    - Actor holding closure → strong reference
                    → RETAIN CYCLE (memory leak)
                    
                    CURRENT (LEAKS MEMORY):
                    ```swift
                    actor DataManager {
                        private var timer: Timer?
                        
                        func start() {
                            timer = Timer.scheduledTimer(
                                withTimeInterval: 1.0,
                                repeats: true
                            ) { _ in
                                await self.update()  // ❌ RETAIN CYCLE
                            }
                        }
                    }
                    
                    // DataManager never deallocated!
                    // Timer keeps strong ref to closure
                    // Closure keeps strong ref to actor
                    ```
                    
                    SOLUTION 1 ([weak self]):
                    ```swift
                    actor DataManager {
                        private var timer: Timer?
                        
                        func start() {
                            timer = Timer.scheduledTimer(
                                withTimeInterval: 1.0,
                                repeats: true
                            ) { [weak self] _ in  // ✅ Weak capture
                                guard let self else { return }
                                await self.update()
                            }
                        }
                        
                        deinit {
                            timer?.invalidate()
                            print("DataManager deallocated")  // ✅ Called
                        }
                    }
                    ```
                    
                    SOLUTION 2 (Task cancellation):
                    ```swift
                    actor DataManager {
                        private var updateTask: Task<Void, Never>?
                        
                        func start() {
                            updateTask = Task { [weak self] in
                                while !Task.isCancelled {
                                    guard let self else { return }
                                    await self.update()
                                    try? await Task.sleep(for: .seconds(1))
                                }
                            }
                        }
                        
                        func stop() {
                            updateTask?.cancel()
                        }
                        
                        deinit {
                            updateTask?.cancel()
                        }
                    }
                    ```
                    
                    SOLUTION 3 (Detached task):
                    ```swift
                    actor DataManager {
                        func start() {
                            Task.detached { [weak self] in
                                while !Task.isCancelled {
                                    guard let self else { return }
                                    await self.process()
                                }
                            }
                        }
                    }
                    ```
                    
                    WHEN TO USE EACH:
                    
                    [weak self]:
                    - Timer callbacks
                    - NotificationCenter observers
                    - URLSession handlers
                    - DispatchQueue closures
                    
                    [unowned self]:
                    - ONLY if actor ALWAYS outlives closure
                    - Very rare in actor context
                    - Crashes if actor deallocated
                    
                    Actor-specific patterns:
                    ```swift
                    // ❌ BAD (retain cycle)
                    NotificationCenter.default.addObserver(
                        forName: .didUpdate,
                        object: nil,
                        queue: nil
                    ) { _ in
                        await self.handle()
                    }
                    
                    // ✅ GOOD
                    NotificationCenter.default.addObserver(
                        forName: .didUpdate,
                        object: nil,
                        queue: nil
                    ) { [weak self] _ in
                        guard let self else { return }
                        Task {
                            await self.handle()
                        }
                    }
                    ```
                    
                    DETECTION TOOLS:
                    - Instruments → Leaks
                    - Memory Graph Debugger (Xcode)
                    - deinit logging
                    - XCTest memory leak tracking
                    
                    TESTING:
                    ```swift
                    func testNoMemoryLeak() async {
                        weak var weakActor: DataManager?
                        
                        do {
                            let actor = DataManager()
                            weakActor = actor
                            await actor.start()
                        }
                        
                        // Give time for cleanup
                        try? await Task.sleep(for: .milliseconds(100))
                        
                        XCTAssertNil(weakActor, "Actor leaked!")
                    }
                    ```
                    
                    Swift 6 Concurrency Rules:
                    - Actors are reference types
                    - Closures are escaping by default in async
                    - [weak self] is ALWAYS safer
                    - Use deinit to verify deallocation
                    
                    This is a CRITICAL memory leak.
                    Fix IMMEDIATELY.
                    """
                    
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file, byteOffset: offset),
                        reason: message
                    ))
                }
            }
        }
        
        return violations
    }
}

