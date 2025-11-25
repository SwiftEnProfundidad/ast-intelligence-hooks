// ═══════════════════════════════════════════════════════════════
// Networking - Network Error Enum Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct NetworkErrorEnumValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "networking_error_enum",
        name: "Networking - Custom Error Enum",
        description: "Network layer must define custom NetworkError enum for proper error handling",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        let isNetworkFile = file.path?.contains("Network") ?? false || 
                          file.path?.contains("API") ?? false
        
        if isNetworkFile && contents.contains("throw") {
            let hasNetworkError = contents.contains("enum NetworkError") ||
                                contents.contains("enum APIError") ||
                                contents.contains("struct NetworkError")
            
            if !hasNetworkError {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: 1),
                    reason: "Network file throwing errors without custom NetworkError enum - define: enum NetworkError: Error { case noConnection, timeout(seconds: Int), serverError(code: Int) }"
                ))
            }
        }
        
        return violations
    }
}
