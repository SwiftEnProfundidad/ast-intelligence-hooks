// ═══════════════════════════════════════════════════════════════
// Networking - Alamofire Usage Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct AlamofireUsageValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "networking_alamofire_usage",
        name: "Networking - Alamofire Best Practices",
        description: "Alamofire usage must follow best practices (Session singleton, interceptors)",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        if contents.contains("import Alamofire") {
            let lines = contents.components(separatedBy: .newlines)
            
            for (index, line) in lines.enumerated() {
                if line.contains("AF.request") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "AF.request static usage - create custom Session with interceptors: let session = Session(interceptor: AuthInterceptor())"
                    ))
                }
            }
        }
        
        return violations
    }
}
