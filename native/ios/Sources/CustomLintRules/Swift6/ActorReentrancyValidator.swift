// ═══════════════════════════════════════════════════════════════
// Swift 6 - Actor Reentrancy Validator
// ═══════════════════════════════════════════════════════════════
// Validates actor reentrancy handling (state changes during suspension)

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ActorReentrancyValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swift6_actor_reentrancy",
        name: "Swift 6 - Actor Reentrancy Safety",
        description: "Actor methods with await should handle reentrancy (state may change during suspension)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            actor Cache {
                private var data: [String: Data] = [:]
                
                func fetch(key: String) async -> Data? {
                    if let cached = data[key] {
                        return cached
                    }
                    
                    let fetched = await network.fetch(key)
                    
                    // ✅ Check again after await (reentrant)
                    if let cached = data[key] {
                        return cached
                    }
                    
                    data[key] = fetched
                    return fetched
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            actor ↓Cache {
                private var data: [String: Data] = [:]
                
                func fetch(key: String) async -> Data? {
                    if data[key] == nil {
                        let fetched = await network.fetch(key)
                        data[key] = fetched  // ❌ Assumes state unchanged
                    }
                    return data[key]
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
                  kind == SwiftDeclarationKind.actor.rawValue else { return }
            
            substructure.walkSubstructure { methodSub in
                guard let methodKind = methodSub.kind,
                      methodKind == SwiftDeclarationKind.functionMethodInstance.rawValue,
                      let offset = methodSub.offset,
                      let name = methodSub.name else { return }
                
                let bodyOffset = methodSub.bodyOffset ?? 0
                let bodyLength = methodSub.bodyLength ?? 0
                let body = file.stringView.substringWithByteRange(
                    start: bodyOffset,
                    length: bodyLength
                ) ?? ""
                
                let hasAwait = body.contains("await")
                let hasStateCheck = body.contains("if ") && body.contains("==")
                let hasStateModification = body.contains("[") && body.contains("] =")
                
                if hasAwait && hasStateModification && hasStateCheck {
                    let awaitCount = body.components(separatedBy: "await").count - 1
                    let checkAfterAwait = body.split(separator: "await").dropFirst().contains { part in
                        String(part).contains("if ")
                    }
                    
                    if awaitCount > 0 && !checkAfterAwait {
                        let message = """
                        Actor reentrancy risk in '\(name)'
                        
                        Swift 6 Actor Reentrancy:
                        
                        Problem: State assumed unchanged after await
                        
                        Scenario:
                        1. Thread A: Checks if data[key] == nil
                        2. Thread A: await network.fetch() (SUSPENDS)
                        3. Thread B: Enters actor, sets data[key]
                        4. Thread A: Resumes, assumes still nil → OVERWRITES
                        
                        Solution - Check TWICE:
                        func fetch(key: String) async -> Data? {
                            if let cached = data[key] {
                                return cached  // First check
                            }
                            
                            let fetched = await network.fetch(key)
                            
                            // ✅ Second check after await (reentrancy safe)
                            if let cached = data[key] {
                                return cached
                            }
                            
                            data[key] = fetched
                            return fetched
                        }
                        
                        Swift 6 enforces:
                        - Actor isolation
                        - Sendable conformance
                        - Reentrancy awareness
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
        }
        
        return violations
    }
}

