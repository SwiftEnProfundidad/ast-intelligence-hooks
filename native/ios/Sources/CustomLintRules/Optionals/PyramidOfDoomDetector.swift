// ═══════════════════════════════════════════════════════════════
// Optionals - Pyramid of Doom Detection
// ═══════════════════════════════════════════════════════════════
// Detects nested if let statements (prefer guard)

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct PyramidOfDoomDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "pyramid_of_doom",
        name: "Pyramid of Doom - Use guard",
        description: "Nested if let statements create pyramid of doom. Use guard for early returns.",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            guard let user = optionalUser else { return }
            guard let profile = user.profile else { return }
            guard let name = profile.name else { return }
            use(name)
            """)
        ],
        triggeringExamples: [
            Example("""
            ↓if let user = optionalUser {
                if let profile = user.profile {
                    if let name = profile.name {
                        use(name)
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
        
        return detectPyramid(in: structure.dictionary, file: file, depth: 0)
    }
    
    private func detectPyramid(in dict: SourceKittenDict, file: SwiftLintFile, depth: Int) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        dict.walkSubstructure { substructure in
            guard let kind = substructure.statementKind,
                  kind == StatementKind.if.rawValue,
                  let offset = substructure.offset else { return }
            
            let nestedDepth = calculateNestedIfLetDepth(substructure, file: file)
            
            if nestedDepth >= 3 {
                let message = """
                Pyramid of Doom: \(nestedDepth) nested if let statements
                
                Problem: Hard to read, max indentation
                
                Current (BAD):
                if let a = optA {
                    if let b = optB {
                        if let c = optC {
                            use(a, b, c)
                        }
                    }
                }
                
                Refactor with guard (GOOD):
                guard let a = optA else { return }
                guard let b = optB else { return }
                guard let c = optC else { return }
                use(a, b, c)  // Flat, readable ✅
                
                Benefits:
                - Early returns
                - Flat code structure
                - Unwrapped values in scope
                - Better readability
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
    
    private func calculateNestedIfLetDepth(_ dict: SourceKittenDict, file: SwiftLintFile) -> Int {
        var maxDepth = 0
        var currentDepth = 0
        
        func traverse(_ subDict: SourceKittenDict) {
            if let kind = subDict.statementKind, kind == StatementKind.if.rawValue {
                currentDepth += 1
                maxDepth = max(maxDepth, currentDepth)
            }
            
            subDict.walkSubstructure { sub in
                traverse(sub)
            }
            
            if let kind = subDict.statementKind, kind == StatementKind.if.rawValue {
                currentDepth -= 1
            }
        }
        
        traverse(dict)
        return maxDepth
    }
}

