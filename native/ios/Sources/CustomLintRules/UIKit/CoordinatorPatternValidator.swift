// ═══════════════════════════════════════════════════════════════
// UIKit - Coordinator Pattern Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct CoordinatorPatternValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "uikit_coordinator_pattern",
        name: "UIKit - Coordinator Pattern",
        description: "Complex navigation should use Coordinator pattern to decouple ViewControllers",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let classes = structure.dictionary.substructure.filter {
            $0.kind == "source.lang.swift.decl.class" &&
            ($0.name?.hasSuffix("ViewController") ?? false)
        }
        
        for classDict in classes {
            let className = classDict.name ?? ""
            let contents = file.contents
            
            if let offset = classDict.offset, let length = classDict.length {
                let start = contents.index(contents.startIndex, offsetBy: offset)
                let end = contents.index(start, offsetBy: min(length, contents.count - offset))
                let classText = String(contents[start..<end])
                
                let navigationCount = classText.components(separatedBy: "navigationController?.pushViewController").count - 1
                let presentCount = classText.components(separatedBy: "present(").count - 1
                let totalNavigation = navigationCount + presentCount
                
                if totalNavigation > 3 {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file, byteOffset: ByteCount(offset)),
                        reason: "ViewController '\(className)' with \(totalNavigation) navigation calls - extract to Coordinator for better navigation flow management"
                    ))
                }
            }
        }
        
        return violations
    }
}
