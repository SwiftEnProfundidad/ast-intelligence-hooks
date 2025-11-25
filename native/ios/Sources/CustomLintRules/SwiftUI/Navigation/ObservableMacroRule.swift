// ═══════════════════════════════════════════════════════════════
// SwiftUI Navigation - Observable Macro Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ObservableMacroRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_observable_macro",
        name: "SwiftUI - @Observable Macro (iOS 17+)",
        description: "Use @Observable macro instead of ObservableObject protocol for simpler state management",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            @Observable
            class ViewModel {
                var state: String = ""
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            class ViewModel: ObservableObject {  // ↓ Use @Observable instead
                @Published var state: String = ""
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let classes = structure.dictionary.substructure.filter {
            $0.kind == "source.lang.swift.decl.class"
        }
        
        for classDict in classes {
            let inherits = classDict.inheritedTypes ?? []
            if inherits.contains("ObservableObject") {
                if let offset = classDict.offset {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file, byteOffset: ByteCount(offset)),
                        reason: "ObservableObject conformance - use @Observable macro for iOS 17+ (simpler syntax, no @Published needed)"
                    ))
                }
            }
        }
        
        return violations
    }
}
