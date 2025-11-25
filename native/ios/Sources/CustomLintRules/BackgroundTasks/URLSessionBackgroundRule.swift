// ═══════════════════════════════════════════════════════════════
// Background - URLSession Background Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct URLSessionBackgroundRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "background_urlsession_background",
        name: "Background - URLSession Background Configuration",
        description: "File uploads must use background URLSession for reliable delivery",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            let config = URLSessionConfiguration.background(withIdentifier: "com.ruralgo.upload")
            let session = URLSession(configuration: config, delegate: self, delegateQueue: nil)
            """)
        ],
        triggeringExamples: [
            Example("""
            let task = URLSession.shared.uploadTask(...)  // ↓ No background session
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if (line.contains("uploadTask") || line.contains("multipartFormData")) && !line.contains("test") {
                let contextLines = lines[max(0, index-10)...min(index+5, lines.count-1)].joined()
                if !contextLines.contains("background") && !contextLines.contains("URLSessionConfiguration.background") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Upload task without background session - use URLSessionConfiguration.background(withIdentifier:) for reliable file uploads that survive app termination"
                    ))
                }
            }
        }
        
        return violations
    }
}
