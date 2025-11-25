// ═══════════════════════════════════════════════════════════════
// Networking - Request/Response Interceptor Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct InterceptorValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "networking_interceptor",
        name: "Networking - Interceptor Pattern",
        description: "API clients should use interceptors for auth tokens, logging, error handling",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let classes = structure.dictionary.substructure.filter {
            $0.kind == "source.lang.swift.decl.class"
        }
        
        for classDict in classes {
            let className = classDict.name ?? ""
            guard className.contains("APIClient") || className.contains("NetworkClient") else { continue }
            
            let contents = file.contents
            if let offset = classDict.offset, let length = classDict.length {
                let start = contents.index(contents.startIndex, offsetBy: offset)
                let end = contents.index(start, offsetBy: min(length, contents.count - offset))
                let classText = String(contents[start..<end])
                
                let hasInterceptor = classText.contains("URLSessionTaskDelegate") ||
                                    classText.contains("willPerformHTTPRedirection") ||
                                    classText.contains("didReceive") ||
                                    classText.contains("interceptor") ||
                                    classText.contains("middleware")
                
                if !hasInterceptor {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file, byteOffset: ByteCount(offset)),
                        reason: "API client '\(className)' without interceptors - implement URLSessionTaskDelegate for auth token injection, logging, global error handling"
                    ))
                }
            }
        }
        
        return violations
    }
}
