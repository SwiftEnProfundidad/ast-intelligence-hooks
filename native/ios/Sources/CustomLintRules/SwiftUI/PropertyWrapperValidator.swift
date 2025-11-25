// ═══════════════════════════════════════════════════════════════
// SwiftUI - Property Wrapper Validator
// ═══════════════════════════════════════════════════════════════
// Validates correct usage of @State, @StateObject, @ObservedObject

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct PropertyWrapperValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_property_wrapper_usage",
        name: "SwiftUI Property Wrapper Validation",
        description: "Validates @State for primitives, @StateObject for ownership, @ObservedObject for passed objects",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            struct ContentView: View {
                @State private var isEnabled = false
                @StateObject private var viewModel = ViewModel()
                @ObservedObject var externalViewModel: ViewModel
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            struct ContentView: View {
                ↓@ObservedObject private var viewModel = ViewModel()
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
                  kind == SwiftDeclarationKind.varInstance.rawValue,
                  let offset = substructure.offset,
                  let name = substructure.name,
                  let typename = substructure.typeName else { return }
            
            let attributes = substructure.attributes ?? []
            
            let hasState = attributes.contains { $0.attribute == "source.decl.attribute.State" }
            let hasStateObject = attributes.contains { $0.attribute == "source.decl.attribute.StateObject" }
            let hasObservedObject = attributes.contains { $0.attribute == "source.decl.attribute.ObservedObject" }
            
            if hasObservedObject && typename.contains("ViewModel") {
                let bodyOffset = substructure.bodyOffset ?? 0
                let bodyLength = substructure.bodyLength ?? 0
                let initialization = file.stringView.substringWithByteRange(
                    start: bodyOffset,
                    length: bodyLength
                ) ?? ""
                
                if initialization.contains("()") || initialization.contains("init") {
                    let message = """
                    @ObservedObject with initialization - use @StateObject for ownership
                    
                    Problem:
                    @ObservedObject var viewModel = ViewModel()  // ❌
                    
                    - @ObservedObject for PASSED objects
                    - @StateObject for OWNED objects
                    
                    Refactor:
                    @StateObject private var viewModel = ViewModel()  // ✅
                    
                    Why:
                    - @StateObject maintains object across view recreations
                    - @ObservedObject doesn't own, can be recreated
                    """
                    
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file, byteOffset: offset),
                        reason: message
                    ))
                }
            }
            
            if hasState && typename.contains("ViewModel") {
                let message = """
                @State with ObservableObject type - use @StateObject
                
                @State is for VALUE types (Int, String, Bool)
                @StateObject is for REFERENCE types (ObservableObject)
                
                Current: @State var viewModel: ViewModel  // ❌
                Correct: @StateObject var viewModel = ViewModel()  // ✅
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

