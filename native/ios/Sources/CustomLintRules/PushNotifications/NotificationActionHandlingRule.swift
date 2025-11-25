// ═══════════════════════════════════════════════════════════════
// Push Notifications - Action Handling Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct NotificationActionHandlingRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "push_action_handling",
        name: "Push - Notification Action Handling",
        description: "Notification tap actions must handle all navigation cases",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let functions = structure.dictionary.substructure.flatMap { $0.substructure }.filter {
            $0.kind == "source.lang.swift.decl.function.method.instance"
        }
        
        for function in functions {
            let functionName = function.name ?? ""
            if functionName.contains("didReceive") && functionName.contains("response") {
                let contents = file.contents
                if let offset = function.offset, let length = function.length {
                    let start = contents.index(contents.startIndex, offsetBy: offset)
                    let end = contents.index(start, offsetBy: min(length, contents.count - offset))
                    let functionText = String(contents[start..<end])
                    
                    if !functionText.contains("switch") && !functionText.contains("actionIdentifier") {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .warning,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "Notification response handler without action handling - implement switch on response.actionIdentifier"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}
