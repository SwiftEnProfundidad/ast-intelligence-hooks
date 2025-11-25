// ═══════════════════════════════════════════════════════════════
// Swift 6 - Task Storage Validator
// ═══════════════════════════════════════════════════════════════
// Validates proper Task storage for cancellation

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct TaskStoreValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swift6_task_storage",
        name: "Swift 6 - Task Storage for Cancellation",
        description: "Store Tasks in properties to enable cancellation (Swift 6 task lifecycle)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            @MainActor
            class ViewModel: ObservableObject {
                private var fetchTask: Task<Void, Never>?
                
                func startFetch() {
                    fetchTask?.cancel()
                    fetchTask = Task {
                        await fetch()
                    }
                }
                
                func stopFetch() {
                    fetchTask?.cancel()
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            @MainActor
            class ↓ViewModel: ObservableObject {
                func startFetch() {
                    Task {
                        await fetch()
                    }
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
        
        structure.dictionary.walkSubstructure { classStructure in
            guard let kind = classStructure.kind,
                  kind == SwiftDeclarationKind.class.rawValue,
                  let offset = classStructure.offset,
                  let name = classStructure.name else { return }
            
            var hasTaskProperty = false
            var taskCreations: [ByteCount] = []
            
            classStructure.walkSubstructure { memberStructure in
                if let memberKind = memberStructure.kind {
                    if memberKind == SwiftDeclarationKind.varInstance.rawValue,
                       let typeName = memberStructure.typeName,
                       typeName.contains("Task") {
                        hasTaskProperty = true
                    }
                    
                    if memberKind == SwiftDeclarationKind.functionMethodInstance.rawValue {
                        let bodyOffset = memberStructure.bodyOffset ?? 0
                        let bodyLength = memberStructure.bodyLength ?? 0
                        let body = file.stringView.substringWithByteRange(
                            start: bodyOffset,
                            length: bodyLength
                        ) ?? ""
                        
                        if body.contains("Task {") && !body.contains(".task(") {
                            if let methodOffset = memberStructure.offset {
                                taskCreations.append(methodOffset)
                            }
                        }
                    }
                }
            }
            
            if !taskCreations.isEmpty && !hasTaskProperty {
                let message = """
                Task created without storage - cannot be cancelled
                
                Swift 6 Task Lifecycle Management:
                
                Problem: Fire-and-forget tasks
                - No cancellation control
                - Memory leaks if holding strong refs
                - Can't stop long-running operations
                
                Current (BAD):
                class \(name) {
                    func startWork() {
                        Task {  // ❌ No reference - can't cancel
                            await longRunningOperation()
                        }
                    }
                }
                
                Solution (GOOD):
                class \(name) {
                    private var workTask: Task<Void, Never>?
                    
                    func startWork() {
                        workTask?.cancel()  // Cancel previous
                        
                        workTask = Task {  // ✅ Stored - can cancel
                            for await item in stream {
                                if Task.isCancelled { return }
                                await process(item)
                            }
                        }
                    }
                    
                    func stopWork() {
                        workTask?.cancel()
                        workTask = nil
                    }
                    
                    deinit {
                        workTask?.cancel()  // Cleanup
                    }
                }
                
                SwiftUI Integration:
                struct MyView: View {
                    @State private var task: Task<Void, Never>?
                    
                    var body: some View {
                        content
                            .onDisappear {
                                task?.cancel()
                            }
                    }
                }
                
                Task Cancellation Rules:
                1. Store task if it can outlive scope
                2. Cancel in deinit/onDisappear
                3. Check Task.isCancelled in loops
                4. Use defer for cleanup
                
                When NOT to store:
                - Short-lived operations (<100ms)
                - Guaranteed completion (no loops)
                - Already in .task { } modifier
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

