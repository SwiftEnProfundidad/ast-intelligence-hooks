// ═══════════════════════════════════════════════════════════════
// SwiftUI PropertyWrappers - AppStorage Type Limitations Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct AppStorageTypeLimitationsRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_appstorage_type_limitations",
        name: "SwiftUI - @AppStorage Type Limitations",
        description: "@AppStorage must use property list types (Bool, Int, Double, String, URL, Data) only",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            @AppStorage("isDarkMode") var isDarkMode: Bool = false
            """)
        ],
        triggeringExamples: [
            Example("""
            @AppStorage("settings") var settings: Settings?  // ↓ Complex type not supported
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        let supportedTypes = ["Bool", "Int", "Double", "String", "URL", "Data"]
        
        for (index, line) in lines.enumerated() {
            if line.contains("@AppStorage") {
                let isSupported = supportedTypes.contains { line.contains(": \($0)") || line.contains(": \($0)?") }
                if !isSupported && line.contains(": ") && !line.contains("RawRepresentable") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file.path, line: index + 1),
                        reason: "@AppStorage with unsupported type - only Bool, Int, Double, String, URL, Data, or RawRepresentable enum. Use @AppStorage for primitive values, CoreData for complex objects"
                    ))
                }
            }
        }
        
        return violations
    }
}

