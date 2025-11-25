// ═══════════════════════════════════════════════════════════════
// Swift 6 - Sendable Conformance Validator
// ═══════════════════════════════════════════════════════════════
// Validates Sendable conformance for types crossing concurrency domains

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct SendableConformanceValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swift6_sendable_conformance",
        name: "Swift 6 - Sendable Conformance",
        description: "Types crossing concurrency boundaries must conform to Sendable (Swift 6 data race safety)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            struct UserData: Sendable {
                let id: String
                let name: String
            }
            
            actor DataStore {
                func save(_ data: UserData) async {
                    // UserData is Sendable ✅
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            struct ↓UserData {
                var id: String
            }
            
            actor DataStore {
                func save(_ data: UserData) async {
                    // UserData not Sendable - data race possible ❌
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
                  (kind == SwiftDeclarationKind.struct.rawValue || kind == SwiftDeclarationKind.class.rawValue),
                  let offset = substructure.offset,
                  let name = substructure.name else { return }
            
            let bodyOffset = substructure.bodyOffset ?? 0
            let bodyLength = substructure.bodyLength ?? 0
            let declaration = file.stringView.substringWithByteRange(
                start: ByteCount(offset),
                length: ByteCount((bodyOffset - offset) + bodyLength)
            ) ?? ""
            
            let conformsToSendable = declaration.contains(": Sendable") || declaration.contains(", Sendable")
            let hasUncheckedSendable = declaration.contains("@unchecked Sendable")
            
            let usedInAsyncContext = file.contents.contains("async") && 
                                     (file.contents.contains("actor") || file.contents.contains("Task"))
            
            if usedInAsyncContext && !conformsToSendable && !hasUncheckedSendable {
                let hasMutableState = declaration.contains("var ")
                
                if hasMutableState {
                    let message = """
                    Type '\(name)' used in async context without Sendable conformance
                    
                    Swift 6 Data Race Safety:
                    
                    Problem: Type crosses concurrency boundaries
                    - Passed to actor
                    - Used in Task
                    - Sent between threads
                    
                    Without Sendable → Potential data races
                    
                    Solution 1 (Immutable):
                    struct \(name): Sendable {  // ✅
                        let id: String  // All let
                    }
                    
                    Solution 2 (Actor):
                    actor \(name) {  // ✅ Actors are implicitly Sendable
                        var state: String
                    }
                    
                    Solution 3 (Unsafe, justified):
                    struct \(name): @unchecked Sendable {
                        // Manual synchronization guaranteed
                        private let queue = DispatchQueue()
                    }
                    
                    Swift 6 Complete Concurrency:
                    - Compiler enforces Sendable
                    - Prevents data races at compile time
                    - @MainActor isolation
                    - Task/TaskGroup structured concurrency
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

