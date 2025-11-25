// ═══════════════════════════════════════════════════════════════
// Offline - Local First Persistence Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct LocalFirstPersistenceRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "offline_local_first",
        name: "Offline - Local-First Persistence",
        description: "Data mutations must save locally first, then sync to backend",
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
            let functionName = function.name ?? ""
            if functionName.contains("save") || functionName.contains("create") || functionName.contains("update") {
                let contents = file.contents
                if let offset = function.offset, let length = function.length {
                    let start = contents.index(contents.startIndex, offsetBy: offset)
                    let end = contents.index(start, offsetBy: min(length, contents.count - offset))
                    let functionText = String(contents[start..<end])
                    
                    let hasLocalSave = functionText.contains("context.save()") || 
                                      functionText.contains("modelContext.insert") ||
                                      functionText.contains("CoreData")
                    let hasNetworkCall = functionText.contains("URLSession") || functionText.contains("Task")
                    
                    if hasNetworkCall && !hasLocalSave {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .error,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "Save operation '\(functionName)' without local persistence - implement local-first: save to CoreData/SwiftData first, sync to backend in background"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}
