// ═══════════════════════════════════════════════════════════════
// Push Notifications - Payload Validation Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct NotificationPayloadValidationRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "push_payload_validation",
        name: "Push - Notification Payload Validation",
        description: "Notification handlers must validate userInfo dictionary fields",
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
            if functionName.contains("userNotificationCenter") && functionName.contains("willPresent") {
                let contents = file.contents
                if let offset = function.offset, let length = function.length {
                    let start = contents.index(contents.startIndex, offsetBy: offset)
                    let end = contents.index(start, offsetBy: min(length, contents.count - offset))
                    let functionText = String(contents[start..<end])
                    
                    if functionText.contains("userInfo") && !functionText.contains("guard let") {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .warning,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "Notification handler without userInfo validation - use guard let to safely unwrap notification data"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}
