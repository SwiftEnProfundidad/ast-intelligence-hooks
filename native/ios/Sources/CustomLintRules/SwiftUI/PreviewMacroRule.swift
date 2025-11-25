// ═══════════════════════════════════════════════════════════════
// SwiftUI - Preview Macro Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct PreviewMacroRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_preview_macro",
        name: "SwiftUI - #Preview Macro (iOS 17+)",
        description: "Use #Preview macro instead of PreviewProvider for simpler previews",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let structs = structure.dictionary.substructure.filter {
            $0.kind == "source.lang.swift.decl.struct"
        }
        
        for structDict in structs {
            let conformsToPreviewProvider = structDict.inheritedTypes?.contains("PreviewProvider") ?? false
            
            if conformsToPreviewProvider {
                if let offset = structDict.offset {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file, byteOffset: ByteCount(offset)),
                        reason: "PreviewProvider conformance - use #Preview { MyView() } macro for iOS 17+ (simpler syntax)"
                    ))
                }
            }
        }
        
        return violations
    }
}
