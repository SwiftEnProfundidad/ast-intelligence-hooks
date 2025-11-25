// ═══════════════════════════════════════════════════════════════
// SwiftUI - View Body Complexity Rule
// ═══════════════════════════════════════════════════════════════
// View body should be simple, extract complex logic

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ViewBodyComplexityRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_view_body_complexity",
        name: "SwiftUI - View Body Complexity",
        description: "View body exceeds 20 lines - extract to computed properties or sub-views",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        let bodyPattern = "var\\s+body:\\s+some\\s+View\\s*\\{([^}]+(?:\\{[^}]*\\})*)+\\}"
        guard let regex = try? NSRegularExpression(pattern: bodyPattern, options: [.dotMatchesLineSeparators]) else {
            return []
        }
        
        let nsString = contents as NSString
        let matches = regex.matches(in: contents, range: NSRange(location: 0, length: nsString.length))
        
        for match in matches {
            let bodyText = nsString.substring(with: match.range)
            let bodyLines = bodyText.components(separatedBy: .newlines).count
            
            if bodyLines > 20 {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file, line: 1, character: 1),
                    reason: "View body too complex (\(bodyLines) lines). Extract to: computed properties (var header: some View), sub-views (HeaderView), or @ViewBuilder functions."
                ))
            }
        }
        
        return violations
    }
}

