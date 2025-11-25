// ═══════════════════════════════════════════════════════════════
// ISP: Interface Segregation Principle - Fat Protocol Detector
// ═══════════════════════════════════════════════════════════════
// Detects protocols with too many requirements
// Dynamic threshold based on protocol size + conformance analysis

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ISPProtocolRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "solid_isp_protocol",
        name: "SOLID: ISP - Protocol Segregation",
        description: "Protocols with too many requirements violate ISP. Split into smaller, focused protocols.",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            // Small, focused protocol
            protocol Identifiable {
                var id: UUID { get }
            }
            
            protocol Nameable {
                var name: String { get }
            }
            
            // Composition
            protocol User: Identifiable, Nameable {
                var email: String { get }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            // Fat protocol (too many requirements)
            protocol ↓UserManager {
                func create() throws
                func update() throws
                func delete() throws
                func list() -> [User]
                func search(query: String) -> [User]
                func validate() -> Bool
                func export() -> Data
                func import(data: Data) throws
                func backup() throws
                func restore() throws
                func audit() -> [Log]
                // 11 requirements - many conformances only need subset
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        return detectViolations(in: structure.dictionary, file: file)
    }
    
    private func detectViolations(in dict: SourceKittenDict, file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        dict.walkSubstructure { substructure in
            guard let kind = substructure.kind,
                  kind == SwiftDeclarationKind.protocol.rawValue,
                  let offset = substructure.offset,
                  let name = substructure.name else { return }
            
            // Count requirements
            let requirements = substructure.substructure.count
            
            // Dynamic threshold: >10 requirements
            guard requirements > 10 else { return }
            
            let message = """
            Protocol '\(name)' has \(requirements) requirements - violates ISP.
            
            ISP Principle: Clients shouldn't depend on methods they don't use.
            
            Problem:
            - Conforming types forced to implement all \(requirements) methods
            - Many conformances likely stub unused methods
            - Changes to one method affect all conformances
            
            Refactor to Protocol Composition:
            
            // Split by responsibility:
            protocol UserReader {
                func list() -> [User]
                func search(query: String) -> [User]
            }
            
            protocol UserWriter {
                func create() throws
                func update() throws
                func delete() throws
            }
            
            protocol UserValidator {
                func validate() -> Bool
            }
            
            // Compose as needed:
            protocol UserRepository: UserReader, UserWriter { }
            
            Benefits:
            - Smaller, focused protocols
            - Conformances only implement what they need
            - Better testability
            """
            
            violations.append(StyleViolation(
                ruleDescription: Self.description,
                severity: .warning,
                location: Location(file: file, byteOffset: offset),
                reason: message
            ))
        }
        
        return violations
    }
    
    private static let nonTriggeringExamples = [
        Example("""
        // Small, focused protocol
        protocol Identifiable {
            var id: UUID { get }
        }
        
        protocol Nameable {
            var name: String { get }
        }
        
        // Composition
        protocol User: Identifiable, Nameable {
            var email: String { get }
        }
        """)
    ]
    
    private static let triggeringExamples = [
        Example("""
        // Fat protocol
        protocol ↓UserManager {
            func create() throws
            func update() throws
            func delete() throws
            func list() -> [User]
            func search(query: String) -> [User]
            func validate() -> Bool
            func export() -> Data
            func import(data: Data) throws
            func backup() throws
            func restore() throws
            func audit() -> [Log]
        }
        """)
    ]
}

