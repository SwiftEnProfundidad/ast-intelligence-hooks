// ═══════════════════════════════════════════════════════════════
// UIKit - Auto Layout Validation
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct AutoLayoutValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "uikit_autolayout_validation",
        name: "UIKit - Auto Layout Best Practices",
        description: "Auto Layout constraints should set translatesAutoresizingMaskIntoConstraints = false",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("addSubview(") {
                let nextLines = lines[(index+1)...min(index+5, lines.count-1)].joined()
                if nextLines.contains("NSLayoutConstraint") && !nextLines.contains("translatesAutoresizingMaskIntoConstraints") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file.path, line: index + 1),
                        reason: "addSubview without translatesAutoresizingMaskIntoConstraints = false - causes Auto Layout conflicts"
                    ))
                }
            }
        }
        
        return violations
    }
}

