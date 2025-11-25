// ═══════════════════════════════════════════════════════════════
// Combine - Cancellable Storage Validator (CRITICAL Memory)
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct CancellableStorageValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "combine_cancellable_storage",
        name: "Combine - Cancellable Storage",
        description: "Combine subscriptions must be stored in Set<AnyCancellable> or property to prevent immediate cancellation",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            private var cancellables = Set<AnyCancellable>()
            publisher.sink { }.store(in: &cancellables)
            """)
        ],
        triggeringExamples: [
            Example("""
            publisher.sink { }  // ↓ Not stored - cancels immediately
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if (line.contains(".sink") || line.contains(".assign")) && !line.contains("store(in:") {
                let nextLine = index + 1 < lines.count ? lines[index + 1] : ""
                if !nextLine.contains(".store(in:") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Combine subscription not stored - add .store(in: &cancellables) or assign to property, otherwise subscription cancels immediately"
                    ))
                }
            }
        }
        
        return violations
    }
}
