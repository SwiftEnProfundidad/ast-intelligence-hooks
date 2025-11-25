// ═══════════════════════════════════════════════════════════════
// Concurrency - @MainActor Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct MainActorValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "concurrency_mainactor_required",
        name: "@MainActor for UI Updates",
        description: "UI-updating code should use @MainActor instead of DispatchQueue.main",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            @MainActor
            class ViewModel: ObservableObject {
                func updateUI() {
                    // Automatically on main thread
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            class ↓ViewModel {
                func updateUI() {
                    DispatchQueue.main.async {
                        // Use @MainActor instead
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
        let content = file.contents
        
        structure.dictionary.walkSubstructure { substructure in
            guard let kind = substructure.kind,
                  kind == SwiftDeclarationKind.class.rawValue,
                  let offset = substructure.offset,
                  let name = substructure.name else { return }
            
            let isUIClass = name.contains("ViewModel") || name.contains("View") || name.contains("Controller")
            
            guard isUIClass else { return }
            
            let attributes = substructure.attributes ?? []
            let hasMainActor = attributes.contains { $0.attribute?.contains("MainActor") == true }
            
            let bodyOffset = substructure.bodyOffset ?? 0
            let bodyLength = substructure.bodyLength ?? 0
            let body = file.stringView.substringWithByteRange(
                start: bodyOffset,
                length: bodyLength
            ) ?? ""
            
            let usesDispatchMain = body.contains("DispatchQueue.main")
            
            if usesDispatchMain && !hasMainActor {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file, byteOffset: offset),
                    reason: """
                    UI class using DispatchQueue.main - use @MainActor
                    
                    OLD: DispatchQueue.main.async { }
                    NEW: @MainActor class/method
                    
                    Benefits: Compiler-enforced, clearer intent
                    """
                ))
            }
        }
        
        return violations
    }
}

