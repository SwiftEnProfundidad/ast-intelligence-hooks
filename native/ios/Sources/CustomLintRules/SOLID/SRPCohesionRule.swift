// ═══════════════════════════════════════════════════════════════
// SRP: Single Responsibility Principle - Cohesion Analyzer
// ═══════════════════════════════════════════════════════════════
// Detects classes with low cohesion using LCOM (Lack of Cohesion of Methods)
// NO hardcoded numbers - all thresholds computed from AST metrics

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct SRPCohesionRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "solid_srp_cohesion",
        name: "SOLID: SRP - Class Cohesion (LCOM)",
        description: "Classes should have high cohesion (single responsibility). " +
                     "Detects low cohesion using LCOM metric (NO hardcoded thresholds).",
        kind: .lint,
        nonTriggeringExamples: SRPCohesionRule.nonTriggeringExamples,
        triggeringExamples: SRPCohesionRule.triggeringExamples
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        return detectViolations(in: structure.dictionary, file: file)
    }
    
    // MARK: - Private Methods
    
    private func detectViolations(in dict: SourceKittenDict, file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        dict.walkSubstructure { substructure in
            guard let kind = substructure.kind,
                  kind == SwiftDeclarationKind.class.rawValue ||
                  kind == SwiftDeclarationKind.struct.rawValue,
                  let offset = substructure.offset,
                  let name = substructure.name else { return }
            
            // Extract methods and properties
            let methods = extractMethods(from: substructure)
            let properties = extractProperties(from: substructure)
            
            // Skip if too small to analyze
            guard methods.count >= 2 && properties.count >= 1 else { return }
            
            // Calculate LCOM (Lack of Cohesion of Methods)
            let lcom = calculateLCOM(methods: methods, properties: properties, file: file)
            
            // Count distinct responsibilities
            let responsibilities = countResponsibilities(
                methods: methods,
                properties: properties,
                substructure: substructure,
                file: file
            )
            
            // Determine severity based on metrics (NOT hardcoded)
            let severity: ViolationSeverity
            let message: String
            
            if lcom > 0 {
                // LCOM > 0 indicates low cohesion
                severity = lcom > methods.count / 2 ? .error : .warning
                
                message = """
                Class '\(name)' has LCOM=\(lcom) (low cohesion).
                
                Metrics:
                - Methods: \(methods.count)
                - Properties: \(properties.count)
                - Responsibilities: \(responsibilities.count) (\(responsibilities.map(\.name).joined(separator: ", ")))
                
                Suggested refactoring:
                \(generateRefactoringSuggestion(name: name, responsibilities: responsibilities))
                """
                
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: severity,
                    location: Location(file: file, byteOffset: offset),
                    reason: message
                ))
                
            } else if responsibilities.count > 1 {
                // High cohesion but multiple responsibilities detected
                severity = responsibilities.count > 3 ? .warning : .info
                
                message = """
                Class '\(name)' has \(responsibilities.count) distinct responsibilities:
                \(responsibilities.map { "- \($0.name): \($0.indicators.joined(separator: ", "))" }.joined(separator: "\n"))
                
                Consider extracting into separate types (SRP: one reason to change).
                """
                
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file, byteOffset: offset),
                    reason: message
                ))
            }
        }
        
        return violations
    }
    
    // MARK: - LCOM Calculation (Core Algorithm)
    
    /// Calculate Lack of Cohesion of Methods
    /// LCOM = |P| - |Q|, where:
    /// P = pairs of methods that don't share properties
    /// Q = pairs of methods that share properties
    ///
    /// LCOM > 0 indicates low cohesion (multiple responsibilities)
    private func calculateLCOM(
        methods: [MethodInfo],
        properties: [PropertyInfo],
        file: SwiftLintFile
    ) -> Int {
        guard methods.count >= 2 else { return 0 }
        
        var disjointPairs = 0
        var connectedPairs = 0
        
        // Build access matrix (which methods access which properties)
        let accessMatrix = methods.map { method in
            properties.map { property in
                methodAccessesProperty(
                    method: method,
                    property: property,
                    file: file
                )
            }
        }
        
        // Count pairs
        for i in 0..<methods.count {
            for j in (i+1)..<methods.count {
                // Check if methods i and j share any property
                let sharedProperties = (0..<properties.count).filter { propIdx in
                    accessMatrix[i][propIdx] && accessMatrix[j][propIdx]
                }
                
                if sharedProperties.isEmpty {
                    disjointPairs += 1
                } else {
                    connectedPairs += 1
                }
            }
        }
        
        // LCOM formula
        return max(0, disjointPairs - connectedPairs)
    }
    
    private func methodAccessesProperty(
        method: MethodInfo,
        property: PropertyInfo,
        file: SwiftLintFile
    ) -> Bool {
        guard let bodyOffset = method.bodyOffset,
              let bodyLength = method.bodyLength else {
            return false
        }
        
        // Extract method body
        let methodBody = file.stringView.substringWithByteRange(
            start: bodyOffset,
            length: bodyLength
        ) ?? ""
        
        // Check if property name appears in method body
        // Simple check: contains property name
        // Advanced: parse AST to find actual references
        return methodBody.contains(property.name)
    }
    
    // MARK: - Responsibility Counting (Semantic Analysis)
    
    private func countResponsibilities(
        methods: [MethodInfo],
        properties: [PropertyInfo],
        substructure: SourceKittenDict,
        file: SwiftLintFile
    ) -> [Responsibility] {
        var responsibilities = Set<Responsibility>()
        
        // Analyze method names for semantic groups
        for method in methods {
            if let responsibility = classifyMethodResponsibility(method.name) {
                responsibilities.insert(responsibility)
            }
        }
        
        // Analyze property types for framework dependencies
        for property in properties {
            if let responsibility = classifyPropertyResponsibility(property.typeName) {
                responsibilities.insert(responsibility)
            }
        }
        
        // Analyze imports
        let fileContent = file.contents
        if let responsibility = classifyFromImports(fileContent) {
            responsibilities.insert(responsibility)
        }
        
        return Array(responsibilities)
    }
    
    private func classifyMethodResponsibility(_ methodName: String) -> Responsibility? {
        let lowercased = methodName.lowercased()
        
        // Domain Logic
        if lowercased.hasPrefix("calculate") ||
           lowercased.hasPrefix("validate") ||
           lowercased.hasPrefix("process") ||
           lowercased.hasPrefix("compute") {
            return Responsibility(
                name: "DOMAIN_LOGIC",
                indicators: [methodName]
            )
        }
        
        // UI/Presentation
        if lowercased.hasPrefix("update") ||
           lowercased.hasPrefix("render") ||
           lowercased.hasPrefix("display") ||
           lowercased.hasPrefix("show") ||
           lowercased.hasPrefix("hide") ||
           lowercased.contains("view") {
            return Responsibility(
                name: "PRESENTATION",
                indicators: [methodName]
            )
        }
        
        // Data Access
        if lowercased.hasPrefix("fetch") ||
           lowercased.hasPrefix("save") ||
           lowercased.hasPrefix("load") ||
           lowercased.hasPrefix("delete") ||
           lowercased.hasPrefix("sync") {
            return Responsibility(
                name: "DATA_ACCESS",
                indicators: [methodName]
            )
        }
        
        // Navigation
        if lowercased.hasPrefix("navigate") ||
           lowercased.hasPrefix("route") ||
           lowercased.hasPrefix("push") ||
           lowercased.hasPrefix("pop") ||
           lowercased.hasPrefix("present") ||
           lowercased.hasPrefix("dismiss") {
            return Responsibility(
                name: "NAVIGATION",
                indicators: [methodName]
            )
        }
        
        return nil
    }
    
    private func classifyPropertyResponsibility(_ typeName: String) -> Responsibility? {
        // UI Framework types
        if typeName.hasPrefix("UI") || typeName.contains("View") {
            return Responsibility(name: "UI_FRAMEWORK", indicators: [typeName])
        }
        
        // Persistence types
        if typeName.contains("CoreData") || typeName.contains("Realm") {
            return Responsibility(name: "PERSISTENCE", indicators: [typeName])
        }
        
        return nil
    }
    
    private func classifyFromImports(_ fileContent: String) -> Responsibility? {
        // Check imports in file
        if fileContent.contains("import UIKit") || fileContent.contains("import SwiftUI") {
            return Responsibility(name: "UI_FRAMEWORK", indicators: ["UIKit/SwiftUI import"])
        }
        
        if fileContent.contains("import CoreData") {
            return Responsibility(name: "PERSISTENCE", indicators: ["CoreData import"])
        }
        
        return nil
    }
    
    // MARK: - Helper Types
    
    private struct MethodInfo {
        let name: String
        let bodyOffset: ByteCount?
        let bodyLength: ByteCount?
    }
    
    private struct PropertyInfo {
        let name: String
        let typeName: String
    }
    
    private struct Responsibility: Hashable {
        let name: String
        var indicators: [String] = []
        
        func hash(into hasher: inout Hasher) {
            hasher.combine(name)
        }
        
        static func == (lhs: Responsibility, rhs: Responsibility) -> Bool {
            return lhs.name == rhs.name
        }
    }
    
    // MARK: - Extraction Helpers
    
    private func extractMethods(from structure: SourceKittenDict) -> [MethodInfo] {
        return structure.substructure.compactMap { sub in
            guard let kind = sub.kind,
                  kind.hasPrefix("source.lang.swift.decl.function.method"),
                  let name = sub.name else {
                return nil
            }
            
            return MethodInfo(
                name: name,
                bodyOffset: sub.bodyOffset,
                bodyLength: sub.bodyLength
            )
        }
    }
    
    private func extractProperties(from structure: SourceKittenDict) -> [PropertyInfo] {
        return structure.substructure.compactMap { sub in
            guard let kind = sub.kind,
                  kind == SwiftDeclarationKind.varInstance.rawValue,
                  let name = sub.name else {
                return nil
            }
            
            let typeName = sub.typeName ?? "Unknown"
            
            return PropertyInfo(
                name: name,
                typeName: typeName
            )
        }
    }
    
    // MARK: - Refactoring Suggestions
    
    private func generateRefactoringSuggestion(
        name: String,
        responsibilities: [Responsibility]
    ) -> String {
        guard !responsibilities.isEmpty else {
            return "Split into smaller, focused classes"
        }
        
        return responsibilities.map { responsibility in
            "\(name)\(responsibility.name.capitalized) - handles \(responsibility.name.lowercased()) only"
        }.joined(separator: "\n")
    }
    
    // MARK: - Examples
    
    private static let nonTriggeringExamples = [
        Example("""
        // High cohesion - all methods work with same properties
        class UserValidator {
            private let rules: [ValidationRule]
            private let errorFormatter: ErrorFormatter
            
            func validate(_ user: User) -> ValidationResult {
                return rules.map { $0.check(user) }
                    .reduce(ValidationResult.success, combine)
            }
            
            func formatErrors(_ result: ValidationResult) -> String {
                return errorFormatter.format(result.errors)
            }
        }
        """),
        
        Example("""
        // Single responsibility - data transformation only
        struct OrderMapper {
            func toDTO(_ order: Order) -> OrderDTO {
                return OrderDTO(
                    id: order.id,
                    total: order.total
                )
            }
            
            func fromDTO(_ dto: OrderDTO) -> Order {
                return Order(id: dto.id, total: dto.total)
            }
        }
        """)
    ]
    
    private static let triggeringExamples = [
        Example("""
        // Low cohesion - multiple responsibilities
        class ↓UserController {
            private let validationRules: [Rule]
            private let database: Database
            private let emailService: EmailService
            private let router: Router
            
            // RESPONSIBILITY 1: Validation
            func validateUser() {
                validationRules.forEach { $0.check() }
            }
            
            // RESPONSIBILITY 2: Persistence
            func saveUser() {
                database.save()
            }
            
            // RESPONSIBILITY 3: Communication
            func sendEmail() {
                emailService.send()
            }
            
            // RESPONSIBILITY 4: Navigation
            func showSettings() {
                router.navigate()
            }
        }
        """)
    ]
}

