// ═══════════════════════════════════════════════════════════════
// Networking - Network Reachability Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct NetworkReachabilityValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "networking_reachability",
        name: "Networking - Reachability Check",
        description: "Network calls must check reachability before executing for offline resilience",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        let lines = contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("URLSession") && (line.contains("dataTask") || line.contains("uploadTask")) {
                let contextStart = max(0, index - 5)
                let contextEnd = min(lines.count - 1, index + 5)
                let context = lines[contextStart...contextEnd].joined()
                
                let hasReachabilityCheck = context.contains("NWPathMonitor") || 
                                          context.contains("isReachable") ||
                                          context.contains("networkStatus") ||
                                          context.contains("isConnected")
                
                if !hasReachabilityCheck {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Network call without reachability check - verify NWPathMonitor.currentPath.status == .satisfied before request"
                    ))
                }
            }
        }
        
        return violations
    }
}
