// ═══════════════════════════════════════════════════════════════
// SwiftUI - State Management Validator
// ═══════════════════════════════════════════════════════════════
// Validates proper state hoisting and management

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct StateManagementValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_state_hoisting",
        name: "SwiftUI State Hoisting",
        description: "State should be hoisted to appropriate level, child views should receive bindings",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            struct ParentView: View {
                @State private var isEnabled = false
                
                var body: some View {
                    ChildView(isEnabled: $isEnabled)
                }
            }
            
            struct ChildView: View {
                @Binding var isEnabled: Bool
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            struct ↓ChildView: View {
                @State private var isEnabled = false
                // State should be in parent
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
                  kind == SwiftDeclarationKind.struct.rawValue,
                  let offset = substructure.offset,
                  let name = substructure.name else { return }
            
            let bodyOffset = substructure.bodyOffset ?? 0
            let bodyLength = substructure.bodyLength ?? 0
            let body = file.stringView.substringWithByteRange(
                start: bodyOffset,
                length: bodyLength
            ) ?? ""
            
            guard body.contains(": View") else { return }
            
            let stateProperties = substructure.substructure.filter { prop in
                let attrs = prop.attributes ?? []
                return attrs.contains { $0.attribute == "source.decl.attribute.State" }
            }
            
            let hasBinding = body.contains("@Binding")
            let isReusableComponent = name.contains("Button") || name.contains("Card") || 
                                     name.contains("Row") || name.contains("Cell")
            
            if stateProperties.count > 0 && isReusableComponent && !hasBinding {
                let message = """
                Reusable component with @State - should use @Binding
                
                State Hoisting Pattern:
                
                Problem: Child component owns state
                struct Button: View {
                    @State private var isPressed = false  // ❌ State in child
                }
                
                Solution: Parent owns state, child receives binding
                struct ParentView: View {
                    @State private var isPressed = false  // ✅ State in parent
                    
                    var body: some View {
                        CustomButton(isPressed: $isPressed)  // Pass binding
                    }
                }
                
                struct CustomButton: View {
                    @Binding var isPressed: Bool  // ✅ Binding in child
                }
                
                Benefits:
                - Reusable components
                - Testable (inject state)
                - Predictable (single source of truth)
                - Parent controls state
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

