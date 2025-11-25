// ═══════════════════════════════════════════════════════════════
// Swift 6 - @MainActor Isolation Validator
// ═══════════════════════════════════════════════════════════════
// Validates proper @MainActor usage for UI updates

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct MainActorIsolation: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swift6_mainactor_isolation",
        name: "Swift 6 - @MainActor Isolation",
        description: "UI types must be @MainActor isolated (Swift 6 complete concurrency)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            @MainActor
            class ViewModel: ObservableObject {
                @Published var state: String = ""
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            class ↓ViewModel: ObservableObject {
                @Published var state: String = ""
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
                  kind == SwiftDeclarationKind.class.rawValue,
                  let offset = substructure.offset,
                  let name = substructure.name else { return }
            
            let bodyOffset = substructure.bodyOffset ?? 0
            let bodyLength = substructure.bodyLength ?? 0
            let body = file.stringView.substringWithByteRange(
                start: bodyOffset,
                length: bodyLength
            ) ?? ""
            
            let isUIType = name.contains("ViewModel") || 
                          name.contains("View") ||
                          body.contains("ObservableObject") ||
                          body.contains("@Published")
            
            guard isUIType else { return }
            
            let attributes = substructure.attributes ?? []
            let hasMainActor = attributes.contains { attr in
                attr.attribute?.contains("MainActor") == true
            }
            
            if !hasMainActor {
                let message = """
                UI type '\(name)' without @MainActor isolation
                
                Swift 6 Complete Concurrency:
                
                Problem: UI updates must be on main thread
                - @Published triggers UI updates
                - ObservableObject observed by SwiftUI
                - Without @MainActor → potential crashes
                
                Solution:
                @MainActor  // ✅ Compiler-enforced main thread
                class \(name): ObservableObject {
                    @Published var state: String
                    
                    func updateUI() {
                        // Always on main thread
                    }
                }
                
                Benefits:
                - Compile-time safety
                - No DispatchQueue.main needed
                - Swift 6 data race prevention
                - Automatic main thread isolation
                
                Exceptions:
                - Non-UI classes (repositories, services)
                - Background actors
                """
                
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .error,
                    location: Location(file: file, byteOffset: offset),
                    reason: message
                ))
            }
        }
        
        return violations
    }
}

