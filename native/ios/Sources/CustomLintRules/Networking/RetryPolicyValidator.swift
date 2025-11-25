// ═══════════════════════════════════════════════════════════════
// Networking - Retry Policy Validator (CRITICAL for RuralGO)
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct RetryPolicyValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "networking_retry_policy",
        name: "Networking - Retry Policy Enforcement",
        description: "Network requests must implement retry logic with exponential backoff for rural connectivity",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            func fetchOrders() async throws -> [Order] {
                try await retryWithExponentialBackoff(maxAttempts: 3) {
                    try await apiClient.getOrders()
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            func ↓fetchOrders() async throws -> [Order] {
                try await apiClient.getOrders()  // No retry
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let functions = structure.dictionary.substructure.flatMap { $0.substructure }.filter {
            $0.kind == "source.lang.swift.decl.function.method.instance"
        }
        
        for function in functions {
            let functionName = function.name ?? ""
            guard functionName.contains("fetch") || functionName.contains("request") || functionName.contains("load") else { continue }
            
            let contents = file.contents
            if let offset = function.offset, let length = function.length {
                let start = contents.index(contents.startIndex, offsetBy: offset)
                let end = contents.index(start, offsetBy: min(length, contents.count - offset))
                let functionText = String(contents[start..<end])
                
                let hasNetworkCall = functionText.contains("URLSession") || 
                                    functionText.contains("dataTask") ||
                                    functionText.contains("apiClient") ||
                                    functionText.contains("async throws")
                
                let hasRetry = functionText.contains("retry") || 
                             functionText.contains("maxAttempts") ||
                             functionText.contains("exponentialBackoff") ||
                             functionText.contains("for attempt in")
                
                if hasNetworkCall && !hasRetry && !functionText.contains("test") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file, byteOffset: ByteCount(offset)),
                        reason: "Network function '\(functionName)' without retry policy - implement exponential backoff (critical for rural connectivity): retry(maxAttempts: 3, delay: { pow(2.0, Double($0)) })"
                    ))
                }
            }
        }
        
        return violations
    }
}
