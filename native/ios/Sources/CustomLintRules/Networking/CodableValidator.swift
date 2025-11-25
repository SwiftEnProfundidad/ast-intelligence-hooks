// ═══════════════════════════════════════════════════════════════
// Networking - Codable Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct CodableValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "networking_codable_required",
        name: "Codable for Network Models",
        description: "Request/Response models must conform to Codable for JSON serialization",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            struct UserResponse: Codable {
                let id: String
                let name: String
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            struct ↓UserResponse {
                let id: String
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
                  kind == SwiftDeclarationKind.struct.rawValue,
                  let offset = substructure.offset,
                  let name = substructure.name else { return }
            
            let isNetworkModel = name.contains("Response") || name.contains("Request") || name.contains("DTO")
            
            guard isNetworkModel else { return }
            
            let bodyOffset = substructure.bodyOffset ?? 0
            let bodyLength = substructure.bodyLength ?? 0
            let body = file.stringView.substringWithByteRange(
                start: bodyOffset,
                length: bodyLength
            ) ?? ""
            
            let conformsToCodable = body.contains(": Codable") || body.contains(": Decodable") || body.contains(": Encodable")
            
            if !conformsToCodable {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .error,
                    location: Location(file: file, byteOffset: offset),
                    reason: """
                    Network model '\(name)' without Codable conformance
                    
                    struct \(name): Codable {  // ← Add Codable
                        // Automatic JSON serialization ✅
                    }
                    """
                ))
            }
        }
        
        return violations
    }
}

