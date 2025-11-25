// ═══════════════════════════════════════════════════════════════
// SwiftUI PropertyWrappers - SceneStorage Validation Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct SceneStorageValidationRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_scenestorage_validation",
        name: "SwiftUI - @SceneStorage Validation",
        description: "@SceneStorage must use only primitive types to avoid serialization errors",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            @SceneStorage("selectedTab") var selectedTab: String = "home"
            """)
        ],
        triggeringExamples: [
            Example("""
            @SceneStorage("user") var user: User?  // ↓ Complex type not supported
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        let supportedTypes = ["Int", "Double", "String", "Bool", "URL", "Data"]
        
        for (index, line) in lines.enumerated() {
            if line.contains("@SceneStorage") {
                let isSupported = supportedTypes.contains { line.contains(": \($0)") || line.contains(": \($0)?") }
                if !isSupported && line.contains(": ") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file.path, line: index + 1),
                        reason: "@SceneStorage with complex type - only supports: Int, Double, String, Bool, URL, Data. Store ID/enum raw value instead"
                    ))
                }
            }
        }
        
        return violations
    }
}

