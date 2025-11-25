// ═══════════════════════════════════════════════════════════════
// SwiftUI Modern - PreferenceKey Performance Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct PreferenceKeyPerformanceRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_preferencekey_performance",
        name: "SwiftUI - PreferenceKey Performance",
        description: "PreferenceKey reduce() must be efficient to avoid layout performance issues",
        kind: .performance,
        nonTriggeringExamples: [
            Example("""
            struct MaxPreferenceKey: PreferenceKey {
                static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
                    value = max(value, nextValue())  // O(1) operation
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            struct SlowPreferenceKey: PreferenceKey {
                static func reduce(value: inout [Item], nextValue: () -> [Item]) {
                    value.append(contentsOf: nextValue())  // ↓ O(n) in reduce causes layout thrashing
                }
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let structs = structure.dictionary.substructure.filter {
            $0.kind == "source.lang.swift.decl.struct"
        }
        
        for structDict in structs {
            let inherits = structDict.inheritedTypes ?? []
            if inherits.contains("PreferenceKey") {
                let methods = structDict.substructure.filter { $0.name == "reduce" }
                for method in methods {
                    if let offset = method.offset {
                        let contents = file.contents
                        let start = contents.index(contents.startIndex, offsetBy: offset)
                        let end = contents.index(start, offsetBy: min(200, contents.count - offset))
                        let methodText = String(contents[start..<end])
                        
                        if methodText.contains(".append") || methodText.contains(".insert") || methodText.contains("+=") {
                            violations.append(StyleViolation(
                                ruleDescription: Self.description,
                                severity: .warning,
                                location: Location(file: file, byteOffset: ByteCount(offset)),
                                reason: "PreferenceKey reduce() with O(n) operation - use O(1) operations (max, min, &&, ||) or @State for collection aggregation to avoid layout performance issues"
                            ))
                        }
                    }
                }
            }
        }
        
        return violations
    }
}

