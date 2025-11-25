// ═══════════════════════════════════════════════════════════════
// UIKit - Thin ViewController Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ThinViewControllerValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "uikit_thin_viewcontroller",
        name: "UIKit - Thin ViewController Enforcement",
        description: "ViewControllers should delegate business logic to ViewModels/Services",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let classes = structure.dictionary.substructure.filter {
            $0.kind == "source.lang.swift.decl.class"
        }
        
        for classDict in classes {
            let className = classDict.name ?? ""
            guard className.hasSuffix("ViewController") else { continue }
            
            let methods = classDict.substructure.filter {
                $0.kind == "source.lang.swift.decl.function.method.instance"
            }
            
            let businessLogicMethods = methods.filter { method in
                let methodName = method.name ?? ""
                return methodName.contains("fetch") || 
                       methodName.contains("save") ||
                       methodName.contains("delete") ||
                       methodName.contains("update") ||
                       methodName.contains("create") ||
                       methodName.contains("validate") ||
                       methodName.contains("calculate")
            }
            
            if businessLogicMethods.count > 2 {
                if let offset = classDict.offset {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file, byteOffset: ByteCount(offset)),
                        reason: "ViewController '\(className)' with \(businessLogicMethods.count) business logic methods - extract to ViewModel/Service (MVVM pattern)"
                    ))
                }
            }
        }
        
        return violations
    }
}
