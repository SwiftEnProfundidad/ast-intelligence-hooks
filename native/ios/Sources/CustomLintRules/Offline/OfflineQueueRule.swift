// ═══════════════════════════════════════════════════════════════
// Offline - Offline Queue Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct OfflineQueueRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "offline_queue",
        name: "Offline - Request Queue",
        description: "Failed network requests must be queued for retry when connection returns",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("catch") && line.contains("URLError") {
                let nextLines = lines[(index+1)...min(index+5, lines.count-1)].joined()
                if !nextLines.contains("queue") && !nextLines.contains("retry") && !nextLines.contains("pending") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Network error without offline queue - implement request queue to persist failed requests for rural connectivity"
                    ))
                }
            }
        }
        
        return violations
    }
}
