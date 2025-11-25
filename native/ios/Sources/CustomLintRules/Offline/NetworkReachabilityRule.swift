// ═══════════════════════════════════════════════════════════════
// Offline - Network Reachability Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct NetworkReachabilityRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "offline_network_reachability",
        name: "Offline - Network Reachability Check",
        description: "Network calls must check reachability before executing for offline resilience",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("URLSession") && (line.contains("dataTask") || line.contains("uploadTask")) {
                let contextStart = max(0, index - 5)
                let contextEnd = min(lines.count - 1, index + 5)
                let context = lines[contextStart...contextEnd].joined()
                
                let hasReachability = context.contains("NWPathMonitor") || 
                                     context.contains("isReachable") ||
                                     context.contains("networkStatus")
                
                if !hasReachability {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Network call without reachability check - verify NWPathMonitor.currentPath.status == .satisfied before request for rural offline resilience"
                    ))
                }
            }
        }
        
        return violations
    }
}
