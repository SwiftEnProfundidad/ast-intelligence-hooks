// ═══════════════════════════════════════════════════════════════
// UIKit - Massive ViewController Detector (CRITICAL)
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct MassiveViewControllerDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "uikit_massive_viewcontroller",
        name: "UIKit - Massive ViewController Detection",
        description: "ViewControllers >300 lines violate SRP - extract to ViewModel/Coordinator",
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
            
            if let bodyLength = classDict.bodyLength {
                let approximateLines = bodyLength / 50
                
                if approximateLines > 300 {
                    if let offset = classDict.offset {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .error,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "Massive ViewController '\(className)' (~\(approximateLines) lines) - extract to ViewModel (business logic), Coordinator (navigation), Services (networking)"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}
