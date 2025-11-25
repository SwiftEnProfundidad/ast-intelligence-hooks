// ═══════════════════════════════════════════════════════════════
// SwiftUI Navigation - NavigationSplitView Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct NavigationSplitViewRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_navigation_splitview",
        name: "SwiftUI - NavigationSplitView (iPadOS/macOS)",
        description: "iPadOS/macOS master-detail must use NavigationSplitView for adaptive layouts",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            NavigationSplitView {
                SidebarView()
            } detail: {
                DetailView()
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            HStack {  // ↓ Manual split view - use NavigationSplitView
                SidebarView().frame(width: 300)
                DetailView()
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        let lines = contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("HStack {") && !line.contains("test") {
                let nextLines = lines[(index+1)...min(index+10, lines.count-1)].joined()
                let hasManualSplit = nextLines.contains(".frame(width:") && 
                                    (nextLines.contains("Sidebar") || nextLines.contains("List"))
                
                if hasManualSplit && !contents.contains("NavigationSplitView") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Manual split view layout - use NavigationSplitView for adaptive sidebar/detail that responds to window size changes"
                    ))
                }
            }
        }
        
        return violations
    }
}
