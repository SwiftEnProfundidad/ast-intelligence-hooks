// ═══════════════════════════════════════════════════════════════
// Combine - Publisher Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct PublisherValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "combine_publisher_validation",
        name: "Combine - Publisher Usage",
        description: "Publishers should be used for streams, async/await for single values",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let functions = structure.dictionary.substructure.flatMap { $0.substructure }.filter {
            $0.kind == "source.lang.swift.decl.function.method.instance"
        }
        
        for function in functions {
            let returnType = function.typeName ?? ""
            let functionName = function.name ?? ""
            
            if returnType.contains("AnyPublisher") && functionName.contains("fetch") && !functionName.contains("stream") {
                if let offset = function.offset {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file, byteOffset: ByteCount(offset)),
                        reason: "Function '\(functionName)' returns Publisher for single value - prefer async throws for one-time fetches, use Publisher only for streams"
                    ))
                }
            }
        }
        
        return violations
    }
}
