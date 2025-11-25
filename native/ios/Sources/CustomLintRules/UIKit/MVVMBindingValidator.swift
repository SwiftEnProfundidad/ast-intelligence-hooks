// ═══════════════════════════════════════════════════════════════
// UIKit - MVVM Binding Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct MVVMBindingValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "uikit_mvvm_binding",
        name: "UIKit - MVVM Binding Validation",
        description: "MVVM ViewControllers should bind to ViewModel using Combine, not direct calls",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        let contents = file.contents
        
        let classes = structure.dictionary.substructure.filter {
            $0.kind == "source.lang.swift.decl.class" &&
            ($0.name?.hasSuffix("ViewController") ?? false)
        }
        
        for classDict in classes {
            let className = classDict.name ?? ""
            
            if let offset = classDict.offset, let length = classDict.length {
                let start = contents.index(contents.startIndex, offsetBy: offset)
                let end = contents.index(start, offsetBy: min(length, contents.count - offset))
                let classText = String(contents[start..<end])
                
                let hasViewModel = classText.contains("ViewModel")
                let hasCombine = classText.contains("sink") || classText.contains("assign")
                let hasDirectCall = classText.contains("viewModel.fetch") || classText.contains("viewModel.save")
                
                if hasViewModel && hasDirectCall && !hasCombine {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file, byteOffset: ByteCount(offset)),
                        reason: "ViewController '\(className)' calls ViewModel directly - use Combine binding: viewModel.$state.sink { [weak self] in }"
                    ))
                }
            }
        }
        
        return violations
    }
}
