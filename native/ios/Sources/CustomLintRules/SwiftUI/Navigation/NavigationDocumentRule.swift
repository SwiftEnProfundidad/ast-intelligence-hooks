// ═══════════════════════════════════════════════════════════════
// SwiftUI Navigation - NavigationDocument Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct NavigationDocumentRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_navigation_document",
        name: "SwiftUI - NavigationDocument (iPadOS/macOS)",
        description: "Document-based apps must use DocumentGroup with proper ReferenceFileDocument conformance",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            @main
            struct MyApp: App {
                var body: some Scene {
                    DocumentGroup(newDocument: MyDocument()) { file in
                        ContentView(document: file.$document)
                    }
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            @main
            struct MyApp: App {
                var body: some Scene {
                    WindowGroup {  // ↓ Document app without DocumentGroup
                        ContentView()
                    }
                }
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        if contents.contains("ReferenceFileDocument") || contents.contains("FileDocument") {
            let hasDocumentGroup = contents.contains("DocumentGroup")
            if !hasDocumentGroup {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: 1),
                    reason: "FileDocument conformance without DocumentGroup - use DocumentGroup scene for document-based app architecture"
                ))
            }
        }
        
        return violations
    }
}
