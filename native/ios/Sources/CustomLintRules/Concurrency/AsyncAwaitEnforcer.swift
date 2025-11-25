// ═══════════════════════════════════════════════════════════════
// Concurrency - async/await over Completion Handlers
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct AsyncAwaitEnforcer: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "concurrency_async_await_required",
        name: "async/await over Completion Handlers",
        description: "New code should use async/await instead of completion handlers",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            func fetchData() async throws -> Data {
                return try await urlSession.data(from: url)
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            func ↓fetchData(completion: @escaping (Result<Data, Error>) -> Void) {
                // Use async/await instead
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        var violations: [StyleViolation] = []
        
        structure.dictionary.walkSubstructure { substructure in
            guard let kind = substructure.kind,
                  kind == SwiftDeclarationKind.functionMethodInstance.rawValue,
                  let offset = substructure.offset,
                  let name = substructure.name else { return }
            
            let bodyOffset = substructure.bodyOffset ?? 0
            let bodyLength = substructure.bodyLength ?? 0
            let signature = file.stringView.substringWithByteRange(
                start: ByteCount(offset),
                length: ByteCount((bodyOffset - offset))
            ) ?? ""
            
            let hasCompletionHandler = signature.contains("completion:") || signature.contains("@escaping")
            let isAsync = signature.contains("async")
            
            if hasCompletionHandler && !isAsync && !name.contains("legacy") {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file, byteOffset: offset),
                    reason: """
                    Completion handler detected - use async/await
                    
                    Current (OLD):
                    func \(name)(completion: @escaping (Result<Data, Error>) -> Void)
                    
                    Refactor (NEW):
                    func \(name)() async throws -> Data
                    
                    Benefits: Simpler, safer, no callback hell
                    """
                ))
            }
        }
        
        return violations
    }
}

