// ═══════════════════════════════════════════════════════════════
// UIKit - IBOutlet Force Unwrap Allower
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct IBOutletForceUnwrapAllower: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "uikit_iboutlet_force_unwrap",
        name: "UIKit - IBOutlet Force Unwrap Is Acceptable",
        description: "IBOutlets can use implicitly unwrapped optionals (!) - this is the ONLY acceptable force unwrap",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let properties = structure.dictionary.substructure.flatMap { $0.substructure }.filter {
            $0.kind == "source.lang.swift.decl.var.instance"
        }
        
        for property in properties {
            let hasIBOutlet = property.attributes?.contains { $0.attribute == "source.decl.attribute.iboutlet" } ?? false
            
            if hasIBOutlet {
                let typeName = property.typeName ?? ""
                let isOptional = typeName.hasSuffix("?") || typeName.hasSuffix("!")
                
                if !isOptional {
                    if let offset = property.offset {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .error,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "IBOutlet without optional - use implicitly unwrapped: @IBOutlet weak var label: UILabel!"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}
